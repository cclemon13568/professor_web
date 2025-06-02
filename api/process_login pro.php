<?php
session_start();
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

require_once('../libs/PHPMailer/src/PHPMailer.php');
require_once('../libs/PHPMailer/src/SMTP.php');
require_once('../libs/PHPMailer/src/Exception.php');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// 讀取 raw JSON 並解碼
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// 取得資料
$account = $input['professor_accountnumber'] ?? '';
$password = $input['professor_password'] ?? '';
$code = strtoupper($input['verification_code'] ?? ''); // 驗證碼不分大小寫

if (empty($account) || empty($password)) {
    echo json_encode(["success" => false, "message" => "帳號與密碼皆為必填"]);
    exit;
}

// 查詢 login_info
$sql = "SELECT * FROM login_info WHERE professor_accountnumber = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $account);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows !== 1) {
    echo json_encode(["success" => false, "message" => "查無此帳號"]);
    exit;
}

$user = $result->fetch_assoc();

// 密碼錯誤
if ($password !== $user['professor_password']) {
    echo json_encode(["success" => false, "message" => "密碼錯誤"]);
    exit;
}

// 如果沒有輸入驗證碼，就寄出新的驗證碼
if (empty($code)) {
    // 取得教師 email
    $email_sql = "SELECT email FROM login_info WHERE professor_accountnumber = ?";
    $email_stmt = $conn->prepare($email_sql);
    $email_stmt->bind_param("s", $account);
    $email_stmt->execute();
    $email_result = $email_stmt->get_result();

    if ($email_result->num_rows !== 1) {
        echo json_encode(["success" => false, "message" => "找不到教師信箱"]);
        exit;
    }

    $row = $email_result->fetch_assoc();
    $email = $row['email'];

    // 產生新的驗證碼
    $new_code = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));

    // 寫入驗證碼
    $update_sql = "UPDATE login_info SET verification_code = ? WHERE professor_accountnumber = ?";
    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param("ss", $new_code, $account);
    $update_stmt->execute();

    // 寄送信件
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'lyfish0316@gmail.com';
        $mail->Password = 'jzbb uoex awqk azsi';
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;

        $mail->setFrom('lyfish0316@gmail.com', '教授系統');
        $mail->addAddress($email);
        $mail->Subject = "登入驗證碼";
        $mail->Body = "您好，您的登入驗證碼為：$new_code\n請回到系統輸入完成登入。";

        $mail->send();

        echo json_encode([
            "success" => true,
            "step" => "code_sent",
            "message" => "驗證碼已寄出至教師信箱"
        ]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "信件寄送失敗：" . $mail->ErrorInfo]);
    }
    exit;
}

// 有輸入驗證碼 ➜ 比對
if ($code === strtoupper($user['verification_code'])) {
    $_SESSION['logged_in_user'] = $account;

    $teacher_ID = $user['teacher_ID'] ?? '';
    $firstChar = strtoupper(substr($teacher_ID, 0, 1)); // 取開頭第一個字母

    if ($firstChar === 'T') {
        $redirect_url = 'http://localhost/professor_web/index.html';
    } elseif ($firstChar === 'P') {
        $redirect_url = 'http://localhost/professor_web/background.html';
    } else {
        $redirect_url = 'http://localhost/professor_web/default.html'; // 可選的預設頁面
    }

    echo json_encode([
        "success" => true,
        "message" => "登入成功",
        "redirect_url" => $redirect_url
    ]);
} else {
    echo json_encode(["success" => false, "message" => "驗證碼錯誤"]);
}


$stmt->close();
$conn->close();
