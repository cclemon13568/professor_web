<?php
session_start();
include('../config/db.php'); // Ensure this path is correct
header('Content-Type: application/json; charset=utf-8');

require_once('../libs/PHPMailer/src/PHPMailer.php');
require_once('../libs/PHPMailer/src/SMTP.php');
require_once('../libs/PHPMailer/src/Exception.php');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST': // 註冊、修改、刪除
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, true);

        $action = $input['action'] ?? 'register'; // Default action is 'register'

        if ($action === 'register') {
            // --- Original POST (Register) Logic ---
            $teacher_ID = $input['teacher_ID'] ?? '';
            $username = $input['professor_accountnumber'] ?? '';
            $password = $input['professor_password'] ?? '';

            if (empty($teacher_ID) || empty($username) || empty($password)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "請輸入教師代號、帳號與密碼"]);
                exit;
            }

            // 查 teacher_ID 是否存在
            $sql = "SELECT teacher_email FROM personal_info WHERE teacher_ID = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "查詢教師資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $stmt->bind_param("s", $teacher_ID);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows !== 1) {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "教師代號不存在"]);
                exit;
            }

            $row = $result->fetch_assoc();
            $teacher_email = $row['teacher_email'];
            $stmt->close();

            // 檢查帳號是否已被使用
            $check_account_sql = "SELECT professor_accountnumber FROM login_info WHERE professor_accountnumber = ?";
            $check_account_stmt = $conn->prepare($check_account_sql);
            if (!$check_account_stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "檢查帳號資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $check_account_stmt->bind_param("s", $username);
            $check_account_stmt->execute();
            $account_result = $check_account_stmt->get_result();
            $account_exists = ($account_result->num_rows > 0);
            $check_account_stmt->close();

            // 檢查密碼是否已被使用
            // NOTE: Checking if a password 'exists' in the database is generally bad practice for security.
            // Passwords should be hashed and unique password checks are typically not done.
            // However, maintaining the current logic for this example based on the original code.
            $check_password_sql = "SELECT professor_password FROM login_info WHERE professor_password = ?";
            $check_password_stmt = $conn->prepare($check_password_sql);
            if (!$check_password_stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "檢查密碼資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $check_password_stmt->bind_param("s", $password);
            $check_password_stmt->execute();
            $password_result = $check_password_stmt->get_result();
            $password_exists = ($password_result->num_rows > 0);
            $check_password_stmt->close();

            if ($account_exists && $password_exists) {
                http_response_code(409); // Conflict
                echo json_encode(["success" => false, "message" => "此帳號密碼已被使用"]);
                exit;
            } elseif ($account_exists) {
                http_response_code(409); // Conflict
                echo json_encode(["success" => false, "message" => "此帳號已被使用"]);
                exit;
            } elseif ($password_exists) {
                http_response_code(409); // Conflict
                echo json_encode(["success" => false, "message" => "此密碼已被使用"]);
                exit;
            }

            // 產生驗證碼 (應為隨機生成)
            // For now, keeping your string "稍後會寄出". In a real system, generate a random code.
            $verification_code = substr(str_shuffle("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 8); // Example of random code

            // 寫入 login_info 表
            $insert_sql = "INSERT INTO login_info (professor_accountnumber, professor_password, email, verification_code, teacher_ID)
                            VALUES (?, ?, ?, ?, ?)";
            $insert_stmt = $conn->prepare($insert_sql);
            if (!$insert_stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "插入登入資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $insert_stmt->bind_param("sssss", $username, $password, $teacher_email, $verification_code, $teacher_ID);

            if (!$insert_stmt->execute()) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "註冊失敗： " . $insert_stmt->error]);
                $insert_stmt->close();
                exit;
            }
            $insert_stmt->close();


            // 寄送驗證碼
            $mail = new PHPMailer(true);
            try {
                $mail->isSMTP();
                $mail->Host = 'smtp.gmail.com';
                $mail->SMTPAuth = true;
                $mail->Username = 'lyfish0316@gmail.com'; // Replace with your actual email
                $mail->Password = 'jzbb uoex awqk azsi'; // Replace with your actual app password
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Use TLS
                $mail->Port = 587;
                $mail->CharSet = 'UTF-8';
                $mail->Encoding = 'base64';

                $mail->setFrom('lyfish0316@gmail.com', '教授系統'); // Replace with your actual email
                $mail->addAddress($teacher_email);
                $mail->Subject = "教授系統註冊驗證碼";
                $mail->Body = "您好，您的註冊驗證碼是： $verification_code\n";
                $mail->AltBody = "您的註冊驗證碼是： $verification_code"; // Plain text for non-HTML mail clients

                $mail->send();
                $_SESSION['pending_user_account'] = $username; // Store account for verification later
                echo json_encode(["success" => true, "message" => "註冊成功，驗證碼已寄送至信箱", "verification_code" => $verification_code]); // Optionally return code for testing
            } catch (Exception $e) {
                // If email sending fails, you might want to revert the database insertion
                // Or mark the user as unverified and retry sending email later.
                // For this example, we'll just report the email error.
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "註冊成功，但驗證碼寄送失敗：" . $mail->ErrorInfo]);
            }
        } elseif ($action === 'update') {
            // --- PUT (Update) Logic Moved Here ---
            $current_account = $input['current_professor_accountnumber'] ?? ''; // 原本帳號
            $current_password = $input['current_professor_password'] ?? ''; // 原本密碼
            $new_account = $input['new_professor_accountnumber'] ?? '';
            $new_password = $input['new_professor_password'] ?? '';

            $missing = [];
            if (empty($current_account)) $missing[] = "目前帳號";
            if (empty($current_password)) $missing[] = "目前密碼";
            if (empty($new_account)) $missing[] = "新帳號";
            if (empty($new_password)) $missing[] = "新密碼";

            if (!empty($missing)) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "請提供：" . implode('、', $missing)
                ]);
                exit;
            }

            // 1. 驗證目前帳號密碼是否正確
            $verify_sql = "SELECT COUNT(*) FROM login_info WHERE professor_accountnumber = ? AND professor_password = ?";
            $verify_stmt = $conn->prepare($verify_sql);
            if (!$verify_stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "驗證目前帳號密碼資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $verify_stmt->bind_param("ss", $current_account, $current_password);
            $verify_stmt->execute();
            $verify_stmt->bind_result($count);
            $verify_stmt->fetch();
            $verify_stmt->close();

            if ($count === 0) {
                http_response_code(401); // Unauthorized
                echo json_encode(["success" => false, "message" => "目前帳號或密碼不正確"]);
                exit;
            }

            // 2. 檢查新帳號是否已被其他人使用 (排除自身)
            $check_new_account_sql = "SELECT COUNT(*) FROM login_info WHERE professor_accountnumber = ? AND professor_accountnumber != ?";
            $check_new_account_stmt = $conn->prepare($check_new_account_sql);
            if (!$check_new_account_stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "檢查新帳號資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $check_new_account_stmt->bind_param("ss", $new_account, $current_account);
            $check_new_account_stmt->execute();
            $check_new_account_stmt->bind_result($new_account_count);
            $check_new_account_stmt->fetch();
            $check_new_account_stmt->close();

            if ($new_account_count > 0) {
                http_response_code(409); // Conflict
                echo json_encode(["success" => false, "message" => "此新帳號已被其他用戶使用"]);
                exit;
            }

            // 3. 檢查新密碼是否已被其他人使用 (排除自身)
            // Again, this password check is unusual for security reasons (passwords should be hashed).
            // But preserving the original intent.
            $check_new_password_sql = "SELECT COUNT(*) FROM login_info WHERE professor_password = ? AND professor_accountnumber != ?";
            $check_new_password_stmt = $conn->prepare($check_new_password_sql);
            if (!$check_new_password_stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "檢查新密碼資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $check_new_password_stmt->bind_param("ss", $new_password, $current_account);
            $check_new_password_stmt->execute();
            $check_new_password_stmt->bind_result($new_password_count);
            $check_new_password_stmt->fetch();
            $check_new_password_stmt->close();

            if ($new_password_count > 0) {
                http_response_code(409); // Conflict
                echo json_encode(["success" => false, "message" => "此新密碼已被其他用戶使用"]);
                exit;
            }

            // 4. 更新帳號與密碼
            $update_sql = "UPDATE login_info SET professor_accountnumber = ?, professor_password = ? WHERE professor_accountnumber = ?";
            $update_stmt = $conn->prepare($update_sql);
            if (!$update_stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "更新帳號密碼資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $update_stmt->bind_param("sss", $new_account, $new_password, $current_account);
            if ($update_stmt->execute()) {
                echo json_encode(["success" => true, "message" => "帳號與密碼已更新"]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "更新失敗: " . $update_stmt->error]);
            }
            $update_stmt->close();
        } elseif ($action === 'delete') {
            // --- DELETE Logic Moved Here ---
            $username_to_delete = $input['professor_accountnumber'] ?? '';

            if (empty($username_to_delete)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "帳號不得為空"]);
                exit;
            }

            // 檢查帳號是否存在
            $check_sql = "SELECT COUNT(*) FROM login_info WHERE professor_accountnumber = ?";
            $check_stmt = $conn->prepare($check_sql);
            if (!$check_stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "檢查刪除帳號資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $check_stmt->bind_param("s", $username_to_delete);
            $check_stmt->execute();
            $check_stmt->bind_result($count);
            $check_stmt->fetch();
            $check_stmt->close();

            if ($count === 0) {
                http_response_code(404); // Not Found
                echo json_encode(["success" => false, "message" => "找不到 accountnumber 為 $username_to_delete 的帳號"]);
                exit;
            }

            // 執行刪除帳號
            $delete_sql = "DELETE FROM login_info WHERE professor_accountnumber = ?";
            $delete_stmt = $conn->prepare($delete_sql);
            if (!$delete_stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "刪除帳號資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $delete_stmt->bind_param("s", $username_to_delete);
            if ($delete_stmt->execute()) {
                echo json_encode(["success" => true, "message" => "帳號已刪除"]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "刪除失敗: " . $delete_stmt->error]);
            }
            $delete_stmt->close();
        } else {
            // Invalid action for POST
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "無效的 POST 動作"]);
        }
        break;


    case 'GET': // 查詢
        $teacher_ID = $_GET['teacher_ID'] ?? '';

        if (empty($teacher_ID)) {
            // No teacher_ID, query all accounts
            $sql = "SELECT professor_accountnumber, email, verification_code, teacher_ID FROM login_info"; // Exclude password for security
            $result = $conn->query($sql);

            if (!$result) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "查詢所有帳號失敗: " . $conn->error]);
                exit;
            }

            if ($result->num_rows === 0) {
                echo json_encode(["success" => true, "message" => "目前沒有帳號資料", "data" => []]);
            } else {
                $data = [];
                while ($row = $result->fetch_assoc()) {
                    $data[] = $row;
                }
                echo json_encode(["success" => true, "data" => $data]);
            }
        } else {
            // With teacher_ID, query a single account
            $sql = "SELECT professor_accountnumber, email, verification_code, teacher_ID FROM login_info WHERE teacher_ID = ?"; // Exclude password for security
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "查詢單一帳號資料庫準備失敗: " . $conn->error]);
                exit;
            }
            $stmt->bind_param("s", $teacher_ID);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 0) {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "找不到此教師代號對應的帳號"]);
            } else {
                $data = $result->fetch_assoc();
                echo json_encode(["success" => true, "data" => $data]);
            }
            $stmt->close();
        }
        break;


    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(["success" => false, "message" => "不支援的請求方式"]);
        break;
}
?>