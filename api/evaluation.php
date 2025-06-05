<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

require_once('words.php'); // Assuming words.php contains checkSensitiveWords function

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
        $data = []; // Initialize data array for unified response
        $message = '';
        $success = false;

        if (isset($_GET['evaluate_ID'])) {
            $evaluate_ID = $_GET['evaluate_ID'];

            // Main evaluation table and linked course_ID
            $stmt = mysqli_prepare($conn, "
                SELECT e.*, em.course_ID
                FROM evaluation e
                LEFT JOIN evaluation_mapping em ON e.evaluate_ID = em.evaluate_ID
                WHERE e.evaluate_ID = ?
            ");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫查詢準備失敗: ' . mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param($stmt, "s", $evaluate_ID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            $data = mysqli_fetch_all($result, MYSQLI_ASSOC);

            if (empty($data)) {
                http_response_code(404); // Not Found
                $message = "找不到 evaluate_ID={$evaluate_ID} 的評論";
            } else {
                $success = true;
                $message = "成功取得 evaluate_ID={$evaluate_ID} 的評論資料";
            }
            mysqli_stmt_close($stmt);

        } else if (isset($_GET['course_ID'])) {
            $course_ID = $_GET['course_ID'];
            $stmt = mysqli_prepare($conn, "
                SELECT e.*, em.course_ID
                FROM evaluation e
                LEFT JOIN evaluation_mapping em ON e.evaluate_ID = em.evaluate_ID
                WHERE em.course_ID = ?
            ");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫查詢準備失敗: ' . mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param($stmt, "s", $course_ID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
            $success = true;
            $message = "成功取得 course_ID={$course_ID} 的所有評論資料";
            mysqli_stmt_close($stmt);

        } else {
            // Retrieve all evaluations with course_ID
            $query = "
                SELECT e.*, em.course_ID
                FROM evaluation e
                LEFT JOIN evaluation_mapping em ON e.evaluate_ID = em.evaluate_ID
            ";
            $result = mysqli_query($conn, $query);
            if (!$result) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '查詢所有評論失敗: ' . mysqli_error($conn)]);
                exit;
            }
            $data = mysqli_fetch_all($result, MYSQLI_ASSOC);
            $success = true;
            $message = "成功取得所有評論資料";
        }

        // Unified GET response
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? 'create'; // Default action is 'create'

        if ($action === 'create') {
            // --- Original POST (Create) Logic ---
            // Auto-generate evaluate_ID if not provided or empty
            if (!isset($data['evaluate_ID']) || trim($data['evaluate_ID']) === '') {
                $result = mysqli_query($conn, "SELECT MAX(evaluate_ID) AS max_id FROM evaluation");
                if (!$result) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => '獲取最大 evaluate_ID 失敗: ' . mysqli_error($conn)]);
                    exit;
                }
                $row = mysqli_fetch_assoc($result);
                $maxID = $row['max_id'];

                if ($maxID) {
                    $num = intval(substr($maxID, 1)) + 1;
                } else {
                    $num = 1;
                }
                $data['evaluate_ID'] = 'E' . str_pad($num, 3, '0', STR_PAD_LEFT);
            }

            $required_fields = ['student_ID', 'course_period', 'evaluate', 'course_ID'];
            $missing_fields = [];
            foreach ($required_fields as $field) {
                // Check if field exists and is not an empty string (after trimming)
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

            $course_ID = $data['course_ID'];
            $checkCourseStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM course_info WHERE course_ID = ?");
            if (!$checkCourseStmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫課程ID檢查準備失敗: ' . mysqli_error($conn)]);
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

            // Sensitive words check
            $combinedText = $data['course_period'] . ' ' . $data['evaluate'];
            // Ensure checkSensitiveWords is defined in words.php and accessible
            $violations = checkSensitiveWords($conn, $combinedText); 

            if (!empty($violations)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false, // Changed from 'status' => 'false' to 'success' => false for consistency
                    'message' => '評論內容中含有敏感字詞，請檢查：' . implode(', ', $violations),
                    'matched_words' => $violations
                ]);
                exit;
            }

            // Start transaction
            mysqli_begin_transaction($conn);
            $transactionSuccess = true;

            try {
                // Insert into evaluation
                $stmt = mysqli_prepare($conn, "
                    INSERT INTO evaluation (evaluate_ID, student_ID, course_period, evaluate)
                    VALUES (?, ?, ?, ?)
                ");
                if (!$stmt) {
                    throw new Exception("新增 evaluation 資料庫準備失敗: " . mysqli_error($conn));
                }
                mysqli_stmt_bind_param(
                    $stmt,
                    "ssss",
                    $data['evaluate_ID'],
                    $data['student_ID'],
                    $data['course_period'],
                    $data['evaluate']
                );

                if (!mysqli_stmt_execute($stmt)) {
                    throw new Exception("新增 evaluation 失敗: " . mysqli_error($conn));
                }
                mysqli_stmt_close($stmt);

                // Insert into evaluation_mapping
                $stmtMap = mysqli_prepare($conn, "
                    INSERT INTO evaluation_mapping (course_ID, evaluate_ID)
                    VALUES (?, ?)
                ");
                if (!$stmtMap) {
                    throw new Exception("新增 evaluation_mapping 資料庫準備失敗: " . mysqli_error($conn));
                }
                mysqli_stmt_bind_param($stmtMap, "ss", $data['course_ID'], $data['evaluate_ID']);
                if (!mysqli_stmt_execute($stmtMap)) {
                    throw new Exception("新增 evaluation_mapping 失敗: " . mysqli_error($conn));
                }
                mysqli_stmt_close($stmtMap);

                // Commit transaction if all successful
                mysqli_commit($conn);
                echo json_encode([
                    'success' => true,
                    'message' => '評論新增成功',
                    'evaluate_ID' => $data['evaluate_ID']
                ]);

            } catch (Exception $e) {
                // Rollback on any failure
                mysqli_rollback($conn);
                http_response_code(500); // Internal Server Error
                echo json_encode([
                    'success' => false,
                    'message' => '新增操作失敗：' . $e->getMessage(),
                ]);
            }
        } elseif ($action === 'update') {
            // --- PUT (Update) Logic Moved Here ---
            if (empty($data['evaluate_ID'])) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "evaluate_ID 不可為空"
                ]);
                exit;
            }

            $evaluate_ID = $data['evaluate_ID'];

            // Check if evaluation exists
            $checkStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM evaluation WHERE evaluate_ID = ?");
            if (!$checkStmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫評論ID檢查準備失敗: ' . mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param($checkStmt, "s", $evaluate_ID);
            mysqli_stmt_execute($checkStmt);
            mysqli_stmt_bind_result($checkStmt, $count);
            mysqli_stmt_fetch($checkStmt);
            mysqli_stmt_close($checkStmt);

            if ($count == 0) {
                http_response_code(404);
                echo json_encode([
                    "success" => false,
                    "message" => "找不到該 evaluate_ID 的評論"
                ]);
                exit;
            }

            // Dynamically build update fields for 'evaluation' table
            $fields = [];
            $types = "";
            $values = [];

            $allowed_fields_evaluation = [
                "student_ID" => "s",
                "course_period" => "s",
                "evaluate" => "s"
            ];

            // For evaluation_mapping (course_ID)
            $update_mapping = false;
            if (isset($data['course_ID'])) {
                $course_ID = $data['course_ID'];
                // Check if the new course_ID exists
                $checkCourseStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM course_info WHERE course_ID = ?");
                if (!$checkCourseStmt) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => '資料庫課程ID檢查準備失敗: ' . mysqli_error($conn)]);
                    exit;
                }
                mysqli_stmt_bind_param($checkCourseStmt, "s", $course_ID);
                mysqli_stmt_execute($checkCourseStmt);
                mysqli_stmt_bind_result($checkCourseStmt, $course_count);
                mysqli_stmt_fetch($checkCourseStmt);
                mysqli_stmt_close($checkCourseStmt);

                if ($course_count == 0) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => "要更新的課程 ID: {$course_ID} 不存在，請檢查課程資料。"
                    ]);
                    exit;
                }
                $update_mapping = true;
            }

            foreach ($allowed_fields_evaluation as $field => $type) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $types .= $type;
                    $values[] = $data[$field];
                }
            }

            // Check sensitive words if 'course_period' or 'evaluate' is being updated
            if (isset($data['course_period']) || isset($data['evaluate'])) {
                // Fetch existing data to combine with new data if only one is updated
                $existingDataStmt = mysqli_prepare($conn, "SELECT course_period, evaluate FROM evaluation WHERE evaluate_ID = ?");
                mysqli_stmt_bind_param($existingDataStmt, "s", $evaluate_ID);
                mysqli_stmt_execute($existingDataStmt);
                mysqli_stmt_bind_result($existingDataStmt, $old_course_period, $old_evaluate);
                mysqli_stmt_fetch($existingDataStmt);
                mysqli_stmt_close($existingDataStmt);

                $current_course_period = $data['course_period'] ?? $old_course_period;
                $current_evaluate = $data['evaluate'] ?? $old_evaluate;

                $combinedText = $current_course_period . ' ' . $current_evaluate;
                $violations = checkSensitiveWords($conn, $combinedText);

                if (!empty($violations)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false, // Changed from 'status' => 'false' for consistency
                        'message' => '評論內容中含有敏感字詞，請檢查：' . implode(', ', $violations),
                        'matched_words' => $violations
                    ]);
                    exit;
                }
            }

            // No fields provided for update (excluding course_ID if it's the only one)
            if (empty($fields) && !$update_mapping) {
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "沒有提供要更新的欄位"
                ]);
                exit;
            }

            // Start transaction for update
            mysqli_begin_transaction($conn);
            $transactionSuccess = true;

            try {
                if (!empty($fields)) {
                    // Update 'evaluation' table
                    $sql_evaluation = "UPDATE evaluation SET " . implode(", ", $fields) . " WHERE evaluate_ID = ?";
                    $types .= "s"; // evaluate_ID type
                    $values[] = $evaluate_ID;

                    $stmt_evaluation = mysqli_prepare($conn, $sql_evaluation);
                    if (!$stmt_evaluation) {
                        throw new Exception("更新 evaluation 資料庫準備失敗: " . mysqli_error($conn));
                    }
                    // MODIFIED LINE: Use ...$values for direct array unpacking
                    mysqli_stmt_bind_param($stmt_evaluation, $types, ...$values);

                    if (!mysqli_stmt_execute($stmt_evaluation)) {
                        throw new Exception("更新 evaluation 失敗：" . mysqli_error($conn));
                    }
                    mysqli_stmt_close($stmt_evaluation);
                }

                if ($update_mapping) {
                    // Update 'evaluation_mapping' table
                    // Use REPLACE INTO or check and update/insert
                    // For simplicity, let's assume update is sufficient here
                    // If a record might not exist in mapping, you might use an UPSERT strategy (REPLACE INTO or ON DUPLICATE KEY UPDATE)
                    $stmt_mapping = mysqli_prepare($conn, "UPDATE evaluation_mapping SET course_ID = ? WHERE evaluate_ID = ?");
                    if (!$stmt_mapping) {
                        throw new Exception("更新 evaluation_mapping 資料庫準備失敗: " . mysqli_error($conn));
                    }
                    mysqli_stmt_bind_param($stmt_mapping, "ss", $data['course_ID'], $evaluate_ID);
                    if (!mysqli_stmt_execute($stmt_mapping)) {
                        throw new Exception("更新 evaluation_mapping 失敗: " . mysqli_error($conn));
                    }
                    mysqli_stmt_close($stmt_mapping);
                }

                mysqli_commit($conn);
                echo json_encode([
                    "success" => true,
                    "message" => "更新成功"
                ]);

            } catch (Exception $e) {
                mysqli_rollback($conn);
                http_response_code(500);
                echo json_encode([
                    "success" => false,
                    "message" => "更新操作失敗：" . $e->getMessage()
                ]);
            }
        } elseif ($action === 'delete') {
            // --- DELETE Logic Moved Here ---
            if (empty($data['evaluate_ID'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'evaluate_ID 為必填']);
                exit;
            }

            $evaluate_ID = $data['evaluate_ID'];

            // Check if evaluation exists before attempting delete
            $stmt_check = mysqli_prepare($conn, "SELECT evaluate_ID FROM evaluation WHERE evaluate_ID = ?");
            if (!$stmt_check) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫評論ID檢查準備失敗: ' . mysqli_error($conn)]);
                exit;
            }
            mysqli_stmt_bind_param($stmt_check, "s", $evaluate_ID);
            mysqli_stmt_execute($stmt_check);
            $result_check = mysqli_stmt_get_result($stmt_check);

            if (mysqli_num_rows($result_check) === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => "找不到 evaluate_ID = $evaluate_ID 的評論"]);
                exit;
            }
            mysqli_stmt_close($stmt_check); // Close the check statement

            // Start transaction for delete
            mysqli_begin_transaction($conn);
            try {
                // Delete from mapping table first
                $stmtMap = mysqli_prepare($conn, "DELETE FROM evaluation_mapping WHERE evaluate_ID = ?");
                if (!$stmtMap) {
                    throw new Exception("刪除 evaluation_mapping 資料庫準備失敗: " . mysqli_error($conn));
                }
                mysqli_stmt_bind_param($stmtMap, "s", $evaluate_ID);
                if (!mysqli_stmt_execute($stmtMap)) {
                    throw new Exception("刪除 evaluation_mapping 失敗: " . mysqli_error($conn));
                }
                mysqli_stmt_close($stmtMap);

                // Then delete from main evaluation table
                $stmt = mysqli_prepare($conn, "DELETE FROM evaluation WHERE evaluate_ID = ?");
                if (!$stmt) {
                    throw new Exception("刪除 evaluation 資料庫準備失敗: " . mysqli_error($conn));
                }
                mysqli_stmt_bind_param($stmt, "s", $evaluate_ID);

                if (!mysqli_stmt_execute($stmt)) {
                    throw new Exception("刪除 evaluation 失敗: " . mysqli_error($conn));
                }
                mysqli_stmt_close($stmt);

                mysqli_commit($conn);
                echo json_encode(["success" => true, "message" => "刪除成功"]);

            } catch (Exception $e) {
                mysqli_rollback($conn);
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "刪除操作失敗: " . $e->getMessage()]);
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