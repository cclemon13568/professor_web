<?php
session_start(); // 開啟 session
include('../config/db.php'); // 連線資料庫
header('Content-Type: application/json; charset=utf-8');

// 接收帳號與密碼
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    header("Location: login.html?error=empty");
    exit;
}

// 取得使用者資料
$sql = "SELECT * FROM login_info WHERE professor_accoutnumber = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

// 若有符合的帳號
if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();

    // ✅ 比對密碼（目前為明碼比對）
    if ($password === $user['professor_password']) {

        // 產生隨機驗證碼
        $verification_code = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));

        // 將驗證碼更新到資料庫
        $update_sql = "UPDATE login_info SET verification_code = ? WHERE professor_accoutnumber = ?";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->bind_param("ss", $verification_code, $username);
        $update_stmt->execute();
        $update_stmt->close();

        // 設定 Session，暫時標示為待驗證
        $_SESSION['pending_user'] = $username;

        // 寄送驗證碼 Email
        $to = $user['email'];
        $subject = "教授系統登入驗證碼";
        $message = "您好，您的驗證碼為：$verification_code\n\n請在系統中輸入以完成登入。";
        $headers = "From: noreply@yourdomain.com"; // 記得替換為實際寄件人

        if (mail($to, $subject, $message, $headers)) {
            header("Location: ediview.html");
            exit;
        } else {
            header("Location: login.html?error=mailfail");
            exit;
        }
    }
}

// ❌ 登入失敗
header("Location: login.html?error=invalid");
exit;
?>
