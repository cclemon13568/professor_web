<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// Include PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once('../libs/PHPMailer/src/PHPMailer.php');
require_once('../libs/PHPMailer/src/SMTP.php');
require_once('../libs/PHPMailer/src/Exception.php');

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        'success' => false, // 添加 success 標誌
        'error' => 'Database connection failed',
        'message' => '資料庫連線失敗'
    ]);
    exit;
}
require_once('words.php'); // Assuming this file contains checkSensitiveWords function
$method = $_SERVER['REQUEST_METHOD'];

$statusMap = [
    0 => '預約失敗',
    1 => '預約成功',
    2 => '審查中'
];

switch ($method) {
    case 'GET':
        if (isset($_GET['appointment_ID'])) {
            $appointment_ID = $_GET['appointment_ID'];
            // 取得指定 appointment_ID 的資料及其 mapping（可能有多筆 mapping）
            $stmt = mysqli_prepare($conn, "SELECT * FROM appointment_info WHERE appointment_ID = ?");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode([
                    'success' => false, // 添加 success 標誌
                    'error' => '資料庫查詢準備失敗: ' . mysqli_error($conn),
                    'message' => '資料庫查詢準備失敗'
                ]);
                exit;
            }
            mysqli_stmt_bind_param($stmt, "s", $appointment_ID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            $appointment = mysqli_fetch_assoc($result);
            if (!$appointment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false, // 添加 success 標誌
                    'message' => '找不到資料'
                ]);
                exit;
            }

            $appointment['status_display'] = $statusMap[$appointment['status']] ?? '未知狀態';

            // 取得所有對應的 mapping
            $stmt2 = mysqli_prepare($conn, "SELECT * FROM appointment_mapping WHERE appointment_ID = ?");
            if (!$stmt2) {
                http_response_code(500);
                echo json_encode([
                    'success' => false, // 添加 success 標誌
                    'error' => '資料庫查詢映射準備失敗: ' . mysqli_error($conn),
                    'message' => '資料庫查詢映射準備失敗'
                ]);
                exit;
            }
            mysqli_stmt_bind_param($stmt2, "s", $appointment_ID);
            mysqli_stmt_execute($stmt2);
            $result2 = mysqli_stmt_get_result($stmt2);
            $mappings = [];
            while ($row = mysqli_fetch_assoc($result2)) {
                $mappings[] = $row;
            }
            $appointment['appointment_mapping'] = $mappings;

            // *** 修改這裡：將單筆資料包裹在 'data' 陣列中，並添加 'success' 標誌 ***
            echo json_encode([
                'success' => true,
                'message' => '資料載入成功', // 可以添加成功訊息
                'data' => [$appointment] // 將單筆資料放入陣列
            ]);

        } else {
            // 查全部，帶出每筆的 mapping 陣列
            $appointments = [];
            $result = mysqli_query($conn, "SELECT * FROM appointment_info");
            if (!$result) {
                http_response_code(500);
                echo json_encode([
                    'success' => false, // 添加 success 標誌
                    'error' => '資料庫查詢全部失敗: ' . mysqli_error($conn),
                    'message' => '資料庫查詢全部失敗'
                ]);
                exit;
            }
            while ($row = mysqli_fetch_assoc($result)) {
                $row['status_display'] = $statusMap[$row['status']] ?? '未知狀態';
                $appointments[$row['appointment_ID']] = $row;
            }
            if (!empty($appointments)) {
                // 查 mapping，分組到對應 appointment_ID
                $mappingResult = mysqli_query($conn, "SELECT * FROM appointment_mapping");
                if (!$mappingResult) {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false, // 添加 success 標誌
                        'error' => '資料庫查詢全部映射失敗: ' . mysqli_error($conn),
                        'message' => '資料庫查詢全部映射失敗'
                    ]);
                    exit;
                }
                while ($m = mysqli_fetch_assoc($mappingResult)) {
                    // 確保 $appointments[$m['appointment_ID']] 存在，以避免 undefined offset 警告
                    if (isset($appointments[$m['appointment_ID']])) {
                        $appointments[$m['appointment_ID']]['appointment_mapping'][] = $m;
                    }
                }
                // 若沒 mapping，確保欄位存在為空陣列
                foreach ($appointments as &$app) {
                    if (!isset($app['appointment_mapping'])) {
                        $app['appointment_mapping'] = [];
                    }
                }
            }
            // *** 修改這裡：將全部資料包裹在 'data' 陣列中，並添加 'success' 標誌 ***
            echo json_encode([
                'success' => true,
                'message' => '資料載入成功', // 可以添加成功訊息
                'data' => array_values($appointments) // 重建索引為數字陣列
            ]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? 'create'; // Default action is 'create'

        if ($action === 'create') {
            // New Appointment Creation Logic (Existing POST logic)

            // **強制設定 office_location 的預設值，忽略前端傳入的值**
            $office_location = "E405(test)";
            // **強制設定 status 的預設值為 2，忽略前端傳入的值**
            $status = 2; // 預設狀態為「審查中」

            // 檢查必要欄位是否存在且不為空 ( office_location 和 status 已從此處移除 )
            $required_fields = [
                'appoint_Date',
                'student_ID',
                'student_Name',
                'student_email',
                'course_ID',
                'problem_description'
            ];
            $missing_fields = [];
            foreach ($required_fields as $field) {
                if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
                    $missing_fields[] = $field;
                }
            }

            if (!empty($missing_fields)) {
                http_response_code(400); // Bad Request
                echo json_encode([
                    'success' => false,
                    'message' => '缺少或欄位為空：' . implode(', ', $missing_fields)
                ]);
                exit;
            }

            // 自動生成 appointment_ID (如果沒有提供)
            $newID = '';
            if (empty($data['appointment_ID'])) {
                $result = mysqli_query($conn, "SELECT appointment_ID FROM appointment_info ORDER BY appointment_ID DESC LIMIT 1");
                if ($result && $row = mysqli_fetch_assoc($result)) {
                    $lastID = $row['appointment_ID'];
                    $num = intval(substr($lastID, 1)) + 1;
                    $newID = 'A' . str_pad($num, 3, '0', STR_PAD_LEFT);
                } else {
                    $newID = 'A001';
                }
            } else {
                // 如果提供了 appointment_ID，則檢查是否已存在
                $newID = $data['appointment_ID'];
                $checkStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM appointment_info WHERE appointment_ID = ?");
                if (!$checkStmt) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => '資料庫查詢準備失敗', 'error' => mysqli_error($conn)]);
                    exit;
                }
                mysqli_stmt_bind_param($checkStmt, "s", $newID);
                mysqli_stmt_execute($checkStmt);
                mysqli_stmt_bind_result($checkStmt, $count);
                mysqli_stmt_fetch($checkStmt);
                mysqli_stmt_close($checkStmt);

                if ($count > 0) {
                    http_response_code(409); // Conflict
                    echo json_encode(['success' => false, 'message' => "appointment_ID: {$newID} 已存在，請勿重複新增"]);
                    exit;
                }
            }
            $data['appointment_ID'] = $newID;

            // 敏感字檢查
            $combinedText = $data['appointment_ID'] . ' ' . $data['problem_description'];
            $violations = checkSensitiveWords($conn, $combinedText);

            if (!empty($violations)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, // 這裡也應使用 'success' 而非 'status'
                    'message' => '問題描述中含有敏感字詞請檢查：' . implode(', ', $violations),
                    'matched_words' => $violations
                ]);
                exit;
            }

            // 檢查 course_ID 是否存在
            $course_ID = $data['course_ID'];
            $checkCourseStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM course_info WHERE course_ID = ?");
            if (!$checkCourseStmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫查詢準備失敗', 'error' => mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param($checkCourseStmt, "s", $course_ID);
            mysqli_stmt_execute($checkCourseStmt);
            mysqli_stmt_bind_result($checkCourseStmt, $course_count);
            mysqli_stmt_fetch($checkCourseStmt);
            mysqli_stmt_close($checkCourseStmt);

            if ($course_count == 0) {
                http_response_code(404); // Not Found
                echo json_encode([
                    'success' => false,
                    'message' => "課程 ID: {$course_ID} 不存在，請檢查課程資料。"
                ]);
                exit;
            }

            // 開始資料庫事務
            mysqli_begin_transaction($conn);

            $stmt = mysqli_prepare($conn, "
                INSERT INTO appointment_info
                (appointment_ID, office_location, appoint_Date, status, student_ID, student_Name, student_email, course_ID, problem_description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            if (!$stmt) {
                mysqli_rollback($conn); // 準備失敗也回滾
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫插入準備失敗', 'error' => mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param(
                $stmt,
                "sssisssss",
                $data['appointment_ID'],
                $office_location, // 使用強制設定的 $office_location 變數
                $data['appoint_Date'],
                $status,            // 使用強制設定的 $status 變數
                $data['student_ID'],
                $data['student_Name'],
                $data['student_email'],
                $data['course_ID'],
                $data['problem_description']
            );

            if (mysqli_stmt_execute($stmt)) {
                mysqli_stmt_close($stmt);

                // 新增對應 mapping，teacher_ID 固定為 T002
                $teacher_ID = 'T002'; // 固定值或從 $data 中獲取
                $stmtMap = mysqli_prepare($conn, "INSERT INTO appointment_mapping (appointment_ID, teacher_ID) VALUES (?, ?)");
                if (!$stmtMap) {
                    mysqli_rollback($conn); // 準備失敗也回滾
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => '資料庫映射插入準備失敗', 'error' => mysqli_error($conn)]);
                    exit;
                }
                mysqli_stmt_bind_param($stmtMap, "ss", $data['appointment_ID'], $teacher_ID);
                if (!mysqli_stmt_execute($stmtMap)) {
                    mysqli_rollback($conn); // 執行失敗回滾
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => '預約映射新增失敗', 'error' => mysqli_error($conn)]);
                    exit;
                }
                mysqli_stmt_close($stmtMap);

                mysqli_commit($conn); // 所有操作成功，提交事務
                echo json_encode([
                    'success' => true,
                    'message' => '預約新增成功',
                    'appointment_ID' => $data['appointment_ID'] // 返回新增的ID
                ]);
            } else {
                mysqli_rollback($conn); // 執行失敗回滾
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => '預約主資料新增失敗',
                    'error' => mysqli_error($conn)
                ]);
            }

        } elseif ($action === 'update') {
            // Update Appointment Logic (Moved from PUT)

            if (empty($data['appointment_ID'])) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "請提供 appointment_ID 以供更新"
                ]);
                exit;
            }

            $appointment_ID = $data['appointment_ID'];

            // 1. Fetch current appointment details (especially for old status, date, location, and student email)
            $old_appointment_info = null;
            $stmt_fetch_old = mysqli_prepare($conn, "SELECT status, appoint_Date, office_location, student_email FROM appointment_info WHERE appointment_ID = ?");
            if (!$stmt_fetch_old) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫查詢舊資料準備失敗: ' . mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param($stmt_fetch_old, "s", $appointment_ID);
            mysqli_stmt_execute($stmt_fetch_old);
            $result_old = mysqli_stmt_get_result($stmt_fetch_old);
            $old_appointment_info = mysqli_fetch_assoc($result_old);
            mysqli_stmt_close($stmt_fetch_old);

            if (!$old_appointment_info) {
                http_response_code(404);
                echo json_encode([
                    "success" => false,
                    "message" => "找不到該 appointment_ID"
                ]);
                exit;
            }

            $old_status = $old_appointment_info['status'];
            // Use old data, as these might not be provided in the update
            $appoint_Date = $old_appointment_info['appoint_Date'];
            $office_location = $old_appointment_info['office_location'];
            $student_email = $old_appointment_info['student_email'];

            // Dynamically build update fields (excluding appointment_ID)
            $fields = [];
            $types = "";
            $values = [];

            $allowed_fields = [
                "office_location" => "s",
                "appoint_Date" => "s",
                "status" => "i",
                "student_ID" => "s",
                "student_Name" => "s",
                "student_email" => "s",
                "course_ID" => "s",
                "problem_description" => "s"
            ];

            foreach ($allowed_fields as $field => $type) {
                // Only update if the field exists in $data
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $types .= $type;
                    if ($field === 'status') {
                        $values[] = (int)$data[$field];
                    } else {
                        // For office_location, if an empty string is passed, we want to set it to NULL
                        if ($field === 'office_location' && trim($data[$field]) === '') {
                            $values[] = null; // Set to NULL
                        } else {
                            $values[] = $data[$field];
                        }
                    }
                }
            }

            // Case 3: No fields provided for update
            if (empty($fields)) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "沒有提供要更新的欄位"
                ]);
                exit;
            }

            // SQL update statement
            $sql = "UPDATE appointment_info SET " . implode(", ", $fields) . " WHERE appointment_ID = ?";
            $types .= "s"; // The last one is appointment_ID
            $values[] = $appointment_ID;

            $stmt = mysqli_prepare($conn, $sql);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '更新預約資料庫準備失敗: ' . mysqli_error($conn)]);
                exit;
            }

            // FIX: 為 $values 陣列中的每個元素創建引用
            $bind_params_ref = [];
            $bind_params_ref[] = $stmt; // 第一個參數是 statement 物件
            $bind_params_ref[] = $types; // 第二個參數是類型字串
            foreach ($values as $key => $value) {
                $bind_params_ref[] = &$values[$key]; // 關鍵：將每個值添加為引用
            }
            call_user_func_array('mysqli_stmt_bind_param', $bind_params_ref);

            if (!mysqli_stmt_execute($stmt)) {
                http_response_code(500);
                echo json_encode([
                    "success" => false,
                    "message" => "更新失敗：" . mysqli_error($conn)
                ]);
                exit;
            }

            mysqli_stmt_close($stmt);

            // Check if status was changed from '2' (審查中) to '1' or '0'
            // Get new status if provided, else use old one
            $new_status = isset($data['status']) ? (int)$data['status'] : $old_status;
            $email_send_message = '';
            // Only send email if old status was 2 and new status is 1 or 0
            if ($old_status === 2 && ($new_status === 1 || $new_status === 0)) {
                $mail = new PHPMailer(true);
                try {
                    $mail->isSMTP();
                    $mail->Host = 'smtp.gmail.com';
                    $mail->SMTPAuth = true;
                    $mail->Username = 'lyfish0316@gmail.com'; // Your Gmail address
                    $mail->Password = 'jzbb uoex awqk azsi'; // Your App Password
                    $mail->SMTPSecure = 'tls';
                    $mail->Port = 587;
                    $mail->CharSet = 'UTF-8';
                    $mail->Encoding = 'base64';

                    $mail->setFrom('lyfish0316@gmail.com', '教授系統');
                    $mail->addAddress($student_email); // Send to student's email

                    $subject = "";
                    $body = "";

                    if ($new_status === 1) {
                        $subject = "您的預約面談已成功";
                        $body = "親愛的同學，您的預約面談已成功。\n\n";
                        $body .= "預約時間：" . $appoint_Date . "\n";
                        $body .= "預約地點：" . $office_location . "\n\n";
                        $body .= "請準時前往面談。";
                    } elseif ($new_status === 0) {
                        $subject = "您的預約面談已失敗";
                        $body = "親愛的同學，很抱歉通知您，您的預約面談已失敗。\n\n";
                        $body .= "預約時間：" . $appoint_Date . "\n";
                        $body .= "預約地點：" . $office_location . "\n\n";
                        $body .= "如有疑問，請聯繫相關人員。";
                    }

                    $mail->Subject = $subject;
                    $mail->Body = $body;

                    $mail->send();
                } catch (Exception $e) {
                    error_log("Error sending email for appointment ID {$appointment_ID}: " . $mail->ErrorInfo);
                    $email_send_message = " 但郵件寄送失敗：" . $mail->ErrorInfo;
                }
            }

            // Handle appointment_mapping update (if any)
            if (isset($data['appointment_mapping']) && is_array($data['appointment_mapping'])) {
                // Start transaction to ensure atomicity of mapping deletion and insertion
                mysqli_begin_transaction($conn);
                try {
                    $stmtDel = mysqli_prepare($conn, "DELETE FROM appointment_mapping WHERE appointment_ID = ?");
                    if (!$stmtDel) { throw new Exception('資料庫刪除映射準備失敗: ' . mysqli_error($conn)); }
                    mysqli_stmt_bind_param($stmtDel, "s", $appointment_ID);
                    if (!mysqli_stmt_execute($stmtDel)) { throw new Exception('刪除映射失敗: ' . mysqli_error($conn)); }
                    mysqli_stmt_close($stmtDel);

                    foreach ($data['appointment_mapping'] as $mapping) {
                        if (!isset($mapping['teacher_ID']) || trim($mapping['teacher_ID']) === '') {
                               // Ensure teacher_ID is not empty, or you can choose to ignore this mapping
                            continue;
                        }
                        $stmtIns = mysqli_prepare($conn, "INSERT INTO appointment_mapping (appointment_ID, teacher_ID) VALUES (?, ?)");
                        if (!$stmtIns) { throw new Exception('資料庫新增映射準備失敗: ' . mysqli_error($conn)); }
                        mysqli_stmt_bind_param($stmtIns, "ss", $appointment_ID, $mapping['teacher_ID']);
                        if (!mysqli_stmt_execute($stmtIns)) { throw new Exception('新增映射失敗: ' . mysqli_error($conn)); }
                        mysqli_stmt_close($stmtIns);
                    }
                    mysqli_commit($conn); // Commit transaction
                } catch (Exception $e) {
                    mysqli_rollback($conn); // Rollback transaction
                    error_log("Error updating appointment_mapping for ID {$appointment_ID}: " . $e->getMessage());
                    echo json_encode([
                        "success" => false,
                        "message" => "更新映射失敗：" . $e->getMessage()
                    ]);
                    exit;
                }
            }

            // Successful update response
            echo json_encode([
                "success" => true,
                "message" => "更新成功" . ($email_send_message ?? '')
            ]);

        } elseif ($action === 'delete') {
            // Delete Appointment Logic (Moved from DELETE)

            if (empty($data['appointment_ID'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => '請提供 appointment_ID'
                ]);
                exit;
            }
            $appointment_ID = $data['appointment_ID'];

            // Start transaction for atomicity
            mysqli_begin_transaction($conn);

            try {
                // First delete mapping
                $stmt1 = mysqli_prepare($conn, "DELETE FROM appointment_mapping WHERE appointment_ID = ?");
                if (!$stmt1) {
                    throw new Exception('資料庫刪除準備失敗 (mapping): ' . mysqli_error($conn));
                }
                mysqli_stmt_bind_param($stmt1, "s", $appointment_ID);
                if (!mysqli_stmt_execute($stmt1)) {
                    throw new Exception('刪除映射失敗：' . mysqli_error($conn));
                }
                mysqli_stmt_close($stmt1);

                // Then delete main table entry
                $stmt2 = mysqli_prepare($conn, "DELETE FROM appointment_info WHERE appointment_ID = ?");
                if (!$stmt2) {
                    throw new Exception('資料庫刪除準備失敗 (info): ' . mysqli_error($conn));
                }
                mysqli_stmt_bind_param($stmt2, "s", $appointment_ID);
                if (!mysqli_stmt_execute($stmt2)) {
                    throw new Exception('刪除主資料失敗：' . mysqli_error($conn));
                }

                // Check if data was actually deleted (affected_rows > 0)
                if (mysqli_stmt_affected_rows($stmt2) === 0) {
                    throw new Exception('未找到該 appointment_ID', 404); // Throw exception with status code
                }

                mysqli_stmt_close($stmt2);
                mysqli_commit($conn); // Commit transaction

                // Successful deletion
                echo json_encode([
                    'success' => true,
                    'message' => '成功刪除'
                ]);

            } catch (Exception $e) {
                mysqli_rollback($conn); // Rollback transaction
                $statusCode = ($e->getCode() === 404) ? 404 : 500; // Determine if it's a 404 error
                http_response_code($statusCode);
                echo json_encode([
                    'success' => false,
                    'message' => '刪除失敗：' . $e->getMessage()
                ]);
            }

        } else {
            // Invalid action
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '無效的 POST 動作']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
        break;
}
?>