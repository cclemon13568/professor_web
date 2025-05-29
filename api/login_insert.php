<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// 取得 POST 參數
$account = $_POST['professor_accountnumber'] ?? '';
$password = $_POST['professor_password'] ?? '';
$email = $_POST['email'] ?? '';

// 檢查必要欄位
if (empty($account) || empty($password) || empty($email)) {
    echo json_encode(["success" => false, "message" => "帳號、密碼與信箱皆為必填"]);
    exit;
}

// 確認帳號是否已存在
$check_sql = "SELECT 1 FROM login_info WHERE professor_accountnumber = ?";
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param("s", $account);
$check_stmt->execute();
$check_stmt->store_result();

if ($check_stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "該帳號已存在"]);
    $check_stmt->close();
    $conn->close();
    exit;
}
$check_stmt->close();

// 產生驗證碼（6 碼隨機英數字）
$verification_code = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));

// 插入新帳號資料
$sql = "INSERT INTO login_info (professor_accountnumber, professor_password, verification_code, email)
        VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssss", $account, $password, $verification_code, $email);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "帳號新增成功",
        "verification_code" => $verification_code
    ]);
} else {
    echo json_encode(["success" => false, "message" => "新增失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
