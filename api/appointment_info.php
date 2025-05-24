<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

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

        if (empty($data['appointment_ID'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'appointment_ID 不可為空'
            ]);
            exit;
        }
        
        // 欄位檢查
        if (!isset(
            $data['appointment_ID'],
            $data['office_location'],
            $data['appoint_Date'],
            $data['status'],
            $data['student_ID'],
            $data['student_Name'],
            $data['course_ID'],
            $data['problem_description']
        )) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '缺少必要欄位']);
            exit;
        }

        $stmt = mysqli_prepare($conn, "
            INSERT INTO appointment_info 
            (appointment_ID, office_location, appoint_Date, status, student_ID, student_Name, course_ID, problem_description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        mysqli_stmt_bind_param(
            $stmt,
            "sssissss",
            $data['appointment_ID'],
            $data['office_location'],
            $data['appoint_Date'],
            $data['status'],
            $data['student_ID'],
            $data['student_Name'],
            $data['course_ID'],
            $data['problem_description']
        );

        if (mysqli_stmt_execute($stmt)) {
            // 成功回傳
            echo json_encode([
                'success' => true,
                'message' => '新增成功'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '資料庫新增失敗',
                'error' => mysqli_error($conn)
            ]);
        }
        break;


    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);

        // 情況一：appointment_ID 不可為空
        if (!$data || empty($data['appointment_ID'])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "appointment_ID 不可為空"
            ]);
            exit;
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
            "course_ID" => "s",
            "problem_description" => "s"
        ];

        foreach ($allowed_fields as $field => $type) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $types .= $type;
                $values[] = $data[$field];
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
