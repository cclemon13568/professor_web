<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
require_once('words.php');
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
            mysqli_stmt_bind_param($stmt, "s", $appointment_ID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            $appointment = mysqli_fetch_assoc($result);
            if (!$appointment) {
                http_response_code(404);
                echo json_encode(['error' => '找不到資料']);
                exit;
            }

            $appointment['status_display'] = $statusMap[$appointment['status']] ?? '未知狀態';

            // 取得所有對應的 mapping
            $stmt2 = mysqli_prepare($conn, "SELECT * FROM appointment_mapping WHERE appointment_ID = ?");
            mysqli_stmt_bind_param($stmt2, "s", $appointment_ID);
            mysqli_stmt_execute($stmt2);
            $result2 = mysqli_stmt_get_result($stmt2);
            $mappings = [];
            while ($row = mysqli_fetch_assoc($result2)) {
                $mappings[] = $row;
            }
            $appointment['appointment_mapping'] = $mappings;

            echo json_encode($appointment);

        } else {
            // 查全部，帶出每筆的 mapping 陣列
            $appointments = [];
            $result = mysqli_query($conn, "SELECT * FROM appointment_info");
            while ($row = mysqli_fetch_assoc($result)) {
                $row['status_display'] = $statusMap[$row['status']] ?? '未知狀態';
                $appointments[$row['appointment_ID']] = $row;
            }
            if (!empty($appointments)) {
                // 查 mapping，分組到對應 appointment_ID
                $mappingResult = mysqli_query($conn, "SELECT * FROM appointment_mapping");
                while ($m = mysqli_fetch_assoc($mappingResult)) {
                    $appointments[$m['appointment_ID']]['appointment_mapping'][] = $m;
                }
                // 若沒 mapping，確保欄位存在為空陣列
                foreach ($appointments as &$app) {
                    if (!isset($app['appointment_mapping'])) {
                        $app['appointment_mapping'] = [];
                    }
                }
            }
            echo json_encode(array_values($appointments)); // 重建索引為數字陣列
        }
        break;

    case 'POST':
        // 新增預約
        $data = json_decode(file_get_contents("php://input"), true);

        // **強制設定 office_location 的預設值，忽略前端傳入的值**
        $office_location = "E405(test)";
        // 如果您想確保即使前端傳了 office_location，也只用預設值，可以加上這行：
        // unset($data['office_location']); // 這一行您之前已經有了，如果希望徹底忽略前端傳入，建議保留

        // **強制設定 status 的預設值為 2，忽略前端傳入的值**
        $status = 2; // 預設狀態為「審查中」
        // 如果您想確保即使前端傳了 status，也只用預設值，可以加上這行：
        // unset($data['status']);


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
                'status' => 'false',
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


        // 開始資料庫事務 (如果需要多個操作的原子性)
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
            "sssisssss", // 注意這裡的類型 'i' for status
            $data['appointment_ID'],
            $office_location, // 使用強制設定的 $office_location 變數
            $data['appoint_Date'],
            $status,          // 使用強制設定的 $status 變數
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
        break;


    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['appointment_ID'])) {
        // 自動生成 appointment_ID
        $result = mysqli_query($conn, "SELECT appointment_ID FROM appointment_info ORDER BY appointment_ID DESC LIMIT 1");
        if ($result && $row = mysqli_fetch_assoc($result)) {
            // 取出最大ID的數字部分，假設格式是 A001、A002
            $lastID = $row['appointment_ID'];
            $num = intval(substr($lastID, 1)) + 1;
            $newID = 'A' . str_pad($num, 3, '0', STR_PAD_LEFT);
        } else {
            $newID = 'A001'; // 如果表中無資料，從A001開始
        }
        $data['appointment_ID'] = $newID;
    }

        $appointment_ID = $data['appointment_ID'];

        // 檢查資料庫是否有該 appointment_ID（情況二）
        $checkStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM appointment_info WHERE appointment_ID = ?");
        mysqli_stmt_bind_param($checkStmt, "s", $appointment_ID);
        mysqli_stmt_execute($checkStmt);
        mysqli_stmt_bind_result($checkStmt, $count);
        mysqli_stmt_fetch($checkStmt);
        mysqli_stmt_close($checkStmt);

        if ($count == 0) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "找不到該 appointment_ID"
            ]);
            exit;
        }

        // 動態組合更新欄位（排除 appointment_ID）
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
            // 只有當 $data 中存在該欄位時才進行更新
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $types .= $type;
                if ($field === 'status') {
                    $values[] = (int)$data[$field];
                } else {
                    // 對於 office_location，如果傳入空字串，我們希望設為 NULL
                    if ($field === 'office_location' && trim($data[$field]) === '') {
                        $values[] = null; // 設為 NULL
                    } else {
                        $values[] = $data[$field];
                    }
                }
            }
        }

        // 情況三：沒提供要更新的欄位
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "沒有提供要更新的欄位"
            ]);
            exit;
        }

        // SQL 更新語句
        $sql = "UPDATE appointment_info SET " . implode(", ", $fields) . " WHERE appointment_ID = ?";
        $types .= "s"; // 最後的 appointment_ID
        $values[] = $appointment_ID;

        $stmt = mysqli_prepare($conn, $sql);
        mysqli_stmt_bind_param($stmt, $types, ...$values);

        if (!mysqli_stmt_execute($stmt)) {
            // 情況四：欄位長度錯誤、SQL錯誤
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "更新失敗：" . mysqli_error($conn)
            ]);
            exit;
        }

        mysqli_stmt_close($stmt);

        // 處理 appointment_mapping 的更新（如果有的話）
        if (isset($data['appointment_mapping']) && is_array($data['appointment_mapping'])) {
            $stmtDel = mysqli_prepare($conn, "DELETE FROM appointment_mapping WHERE appointment_ID = ?");
            mysqli_stmt_bind_param($stmtDel, "s", $appointment_ID);
            mysqli_stmt_execute($stmtDel);
            mysqli_stmt_close($stmtDel);

            foreach ($data['appointment_mapping'] as $mapping) {
                if (!isset($mapping['teacher_ID'])) continue;
                $stmtIns = mysqli_prepare($conn, "INSERT INTO appointment_mapping (appointment_ID, teacher_ID) VALUES (?, ?)");
                mysqli_stmt_bind_param($stmtIns, "ss", $appointment_ID, $mapping['teacher_ID']);
                mysqli_stmt_execute($stmtIns);
                mysqli_stmt_close($stmtIns);
            }
        }

        // 更新成功回應
        echo json_encode([
            "success" => true,
            "message" => "更新成功"
        ]);
        break;


    case 'DELETE':
        if (!isset($_GET['appointment_ID']) || empty($_GET['appointment_ID'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => '請提供 appointment_ID'
            ]);
            exit;
        }
        $appointment_ID = $_GET['appointment_ID'];

        // 先刪 mapping
        $stmt1 = mysqli_prepare($conn, "DELETE FROM appointment_mapping WHERE appointment_ID = ?");
        mysqli_stmt_bind_param($stmt1, "s", $appointment_ID);
        if (!mysqli_stmt_execute($stmt1)) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '刪除失敗：' . mysqli_error($conn)
            ]);
            exit;
        }

        // 再刪主表
        $stmt2 = mysqli_prepare($conn, "DELETE FROM appointment_info WHERE appointment_ID = ?");
        mysqli_stmt_bind_param($stmt2, "s", $appointment_ID);
        if (!mysqli_stmt_execute($stmt2)) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '刪除失敗：' . mysqli_error($conn)
            ]);
            exit;
        }

        // 判斷是否有刪到資料（affected_rows > 0）
        if (mysqli_stmt_affected_rows($stmt2) === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => '未找到該 appointment_ID'
            ]);
            exit;
        }

        // 刪除成功
        echo json_encode([
            'success' => true,
            'message' => '成功刪除'
        ]);
        break;


    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
?>
