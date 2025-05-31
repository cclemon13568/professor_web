<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// 取得 POST 資料
$teacher_id = $_POST['teacher_ID'] ?? '';
$account = $_POST['professor_accountnumber'] ?? '';
$password = $_POST['professor_password'] ?? '';

// ✅ 檢查欄位
if (empty($teacher_id) || empty($account) || empty($password)) {
    echo json_encode(["success" => false, "message" => "教師代碼、帳號與密碼皆為必填"]);
    exit;
}

// ✅ 從 personal_info 查詢教師信箱
$email_sql = "SELECT teacher_email FROM personal_info WHERE teacher_ID = ?";
$email_stmt = $conn->prepare($email_sql);
$email_stmt->bind_param("s", $teacher_id);
$email_stmt->execute();
$email_result = $email_stmt->get_result();

if ($email_result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "找不到對應的教師資料（teacher_ID）"]);
    $email_stmt->close();
    $conn->close();
    exit;
}
$email_row = $email_result->fetch_assoc();
$email = $email_row['teacher_email'];
$email_stmt->close();

// ✅ 檢查帳號是否已存在
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

// ✅ 產生驗證碼
$verification_code = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));

// ✅ 插入 login_info
$insert_sql = "INSERT INTO login_info (teacher_ID, professor_accountnumber, professor_password, verification_code, email)
               VALUES (?, ?, ?, ?, ?)";
$insert_stmt = $conn->prepare($insert_sql);
$insert_stmt->bind_param("sssss", $teacher_id, $account, $password, $verification_code, $email);

if ($insert_stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "帳號新增成功",
        "verification_code" => $verification_code
    ]);
} else {
    echo json_encode(["success" => false, "message" => "新增失敗：" . $insert_stmt->error]);
}

$insert_stmt->close();
$conn->close();
?>
