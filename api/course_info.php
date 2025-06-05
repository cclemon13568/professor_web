<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => '資料庫連線失敗',
        'error' => 'Database connection failed'
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (empty($_GET['course_ID'])) {
            $result = mysqli_query($conn, "SELECT * FROM course_info");
            if (!$result) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => '查詢所有課程失敗: ' . mysqli_error($conn),
                    'error' => mysqli_error($conn)
                ]);
                exit;
            }
            $courses = mysqli_fetch_all($result, MYSQLI_ASSOC);
            echo json_encode([
                'success' => true,
                'message' => '成功取得所有課程資料',
                'data' => $courses
            ]);
        } else {
            $course_ID = $_GET['course_ID'];
            $stmt = mysqli_prepare($conn, "SELECT * FROM course_info WHERE course_ID = ?");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => '資料庫查詢準備失敗: ' . mysqli_error($conn),
                    'error' => mysqli_error($conn)
                ]);
                exit;
            }
            mysqli_stmt_bind_param($stmt, "s", $course_ID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            $course = mysqli_fetch_assoc($result);

            if ($course) {
                echo json_encode([
                    'success' => true,
                    'message' => '成功取得單一課程資料',
                    'data' => [$course] // 將單一課程放入陣列
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => "找不到 course_ID = $course_ID 的課程"]);
            }
            mysqli_stmt_close($stmt); // 記得關閉預處理語句
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? 'create'; // Default action is 'create'

        if ($action === 'create') {
            // --- Original POST (Create) Logic ---
            // 特別檢查 course_ID
            if (!isset($data['course_ID']) || empty($data['course_ID'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'course_ID不可為空']);
                exit;
            }

            // 檢查其他必要欄位
            if (
                !isset($data['course_name'], $data['course_time'],
                    $data['course_outline'], $data['teacher_ID'], $data['course_score'])
                || empty($data['course_name']) || empty($data['course_time']) || empty($data['course_outline']) || empty($data['teacher_ID']) || empty($data['course_score'])
            ) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => '缺少必要欄位']);
                exit;
            }

            // Check if course_ID already exists
            $checkStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM course_info WHERE course_ID = ?");
            if ($checkStmt) {
                mysqli_stmt_bind_param($checkStmt, "s", $data['course_ID']);
                mysqli_stmt_execute($checkStmt);
                mysqli_stmt_bind_result($checkStmt, $count);
                mysqli_stmt_fetch($checkStmt);
                mysqli_stmt_close($checkStmt);

                if ($count > 0) {
                    http_response_code(409); // Conflict
                    echo json_encode(['success' => false, 'message' => "Course ID: {$data['course_ID']} already exists."]);
                    exit;
                }
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Database statement preparation failed for ID check: ' . mysqli_error($conn)]);
                exit;
            }


            $stmt = mysqli_prepare($conn, "
                INSERT INTO course_info
                (course_ID, course_name, course_time, course_outline, teacher_ID, course_score)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '新增課程資料庫準備失敗: ' . mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param(
                $stmt,
                "ssssss",
                $data['course_ID'],
                $data['course_name'],
                $data['course_time'],
                $data['course_outline'],
                $data['teacher_ID'],
                $data['course_score']
            );

            if (mysqli_stmt_execute($stmt)) {
                mysqli_stmt_close($stmt);
                echo json_encode(['success' => true, 'message' => '新增成功']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '新增失敗：' . mysqli_error($conn)]);
            }

        } elseif ($action === 'update') {
            // --- PUT (Update) Logic Moved Here ---
            if (empty($data['course_ID'])) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "course_ID 不可為空"
                ]);
                exit;
            }

            $course_ID = $data['course_ID'];

            // Check if course exists
            $checkStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM course_info WHERE course_ID = ?");
            if (!$checkStmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫查詢準備失敗: ' . mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param($checkStmt, "s", $course_ID);
            mysqli_stmt_execute($checkStmt);
            mysqli_stmt_bind_result($checkStmt, $count);
            mysqli_stmt_fetch($checkStmt);
            mysqli_stmt_close($checkStmt);

            if ($count == 0) {
                http_response_code(404);
                echo json_encode([
                    "success" => false,
                    "message" => "找不到該 course_ID"
                ]);
                exit;
            }

            // Dynamically build update fields
            $fields = [];
            $types = "";
            $values = [];

            $allowed_fields = [
                "course_name" => "s",
                "course_time" => "s",
                "course_outline" => "s",
                "teacher_ID" => "s",
                "course_score" => "s"
            ];

            foreach ($allowed_fields as $field => $type) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $types .= $type;
                    $values[] = $data[$field];
                }
            }

            // No fields provided for update
            if (empty($fields)) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "沒有提供要更新的欄位"
                ]);
                exit;
            }

            // Build SQL and execute
            $sql = "UPDATE course_info SET " . implode(", ", $fields) . " WHERE course_ID = ?";
            $types .= "s"; // course_ID type
            $values[] = $course_ID;

            $stmt = mysqli_prepare($conn, $sql);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '更新課程資料庫準備失敗: ' . mysqli_error($conn)]);
                exit;
            }

            // MODIFIED LINE: 使用 ...$values 直接解包陣列，PHP 5.6+ 支援
            // 這邊不需要 call_user_func_array 和手動創建引用陣列了
            mysqli_stmt_bind_param($stmt, $types, ...$values);

            if (!mysqli_stmt_execute($stmt)) {
                http_response_code(500);
                echo json_encode([
                    "success" => false,
                    "message" => "更新失敗：" . mysqli_error($conn)
                ]);
                exit;
            }

            mysqli_stmt_close($stmt);

            // Success response
            echo json_encode([
                "success" => true,
                "message" => "更新成功"
            ]);

        } elseif ($action === 'delete') {
            // --- DELETE Logic Moved Here ---
            if (empty($data['course_ID'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'course_ID 為必填']);
                exit;
            }

            $course_ID = $data['course_ID'];

            // Check if course exists before attempting delete
            $stmt_check = mysqli_prepare($conn, "SELECT course_ID FROM course_info WHERE course_ID = ?");
            if (!$stmt_check) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫查詢準備失敗: ' . mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param($stmt_check, "s", $course_ID);
            mysqli_stmt_execute($stmt_check);
            $result_check = mysqli_stmt_get_result($stmt_check);

            if (mysqli_num_rows($result_check) === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => "找不到 course_ID = $course_ID 的課程"]);
                exit;
            }
            mysqli_stmt_close($stmt_check); // Close the check statement

            // Proceed with deletion
            $stmt = mysqli_prepare($conn, "DELETE FROM course_info WHERE course_ID = ?");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '刪除課程資料庫準備失敗: ' . mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param($stmt, "s", $course_ID);

            if (mysqli_stmt_execute($stmt)) {
                mysqli_stmt_close($stmt);
                echo json_encode(['success' => true, 'message' => '刪除成功']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '刪除失敗：' . mysqli_error($conn)]);
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
}
?>