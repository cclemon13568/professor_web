<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// 接收 POST 登入資料
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

// 欄位驗證
if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "帳號與密碼為必填"]);
    exit;
}

// 查詢資料庫
$sql = "SELECT * FROM login_info WHERE professor_accountnumber = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();

    if ($password === $user['professor_password']) {
        $_SESSION['user'] = $user['professor_accountnumber'];

        $teacher_id = $user['teacher_ID']; // ✅ 從資料表中取得 teacher_ID

        // ✅ 根據 teacher_ID 開頭判斷角色
        if (str_starts_with($teacher_id, 'T')) {
            header("Location: /professor_web/ediview.html");
            exit;
        } elseif (str_starts_with($teacher_id, 'A')) {
            header("Location: /professor_web/background.html");
            exit;
        } else {
            echo json_encode(["success" => false, "message" => "無效的教師代碼"]);
            exit;
        }
    }
}

echo json_encode(["success" => false, "message" => "帳號或密碼錯誤"]);
exit;
?>
