<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

require_once('words.php');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['evaluate_ID'])) {
            $evaluate_ID = $_GET['evaluate_ID'];

            // 主表
            $stmt = mysqli_prepare($conn, "
                SELECT e.*, em.course_ID
                FROM evaluation e
                LEFT JOIN evaluation_mapping em ON e.evaluate_ID = em.evaluate_ID
                WHERE e.evaluate_ID = ?
            ");
            mysqli_stmt_bind_param($stmt, "s", $evaluate_ID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            $data = mysqli_fetch_all($result, MYSQLI_ASSOC);

            if (empty($data)) {
                echo json_encode([
                    "success" => false,
                    "message" => "找不到 evaluate_ID={$evaluate_ID} 的課程"
                ]);
            } else {
                echo json_encode($data);
            }

            mysqli_stmt_close($stmt);
        } else {
            // 查全部資料並加上 course_ID
            $query = "
                SELECT e.*, em.course_ID
                FROM evaluation e
                LEFT JOIN evaluation_mapping em ON e.evaluate_ID = em.evaluate_ID
            ";
            $result = mysqli_query($conn, $query);
            echo json_encode(mysqli_fetch_all($result, MYSQLI_ASSOC));
        }
        break;



    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        // 自動產生 evaluate_ID
        if (!isset($data['evaluate_ID']) || trim($data['evaluate_ID']) === '') {
            $result = mysqli_query($conn, "SELECT MAX(evaluate_ID) AS max_id FROM evaluation");
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
            // 檢查字段是否存在且不是空字串 (trim 後)
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

        // 敏感字檢查
        $combinedText = $data['course_period'] . ' ' . $data['evaluate'];
        $violations = checkSensitiveWords($conn, $combinedText);

        if (!empty($violations)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'false',
                'message' => '評論內容中含有敏感字詞，請檢查：' . implode(', ', $violations),
                'matched_words' => $violations
            ]);
            exit;
        }

        // 開始事務處理，確保兩個插入操作要麼都成功，要麼都失敗
        mysqli_begin_transaction($conn);
        $transactionSuccess = true;

        try {
            // 插入 evaluation
            $stmt = mysqli_prepare($conn, "
                INSERT INTO evaluation (evaluate_ID, student_ID, course_period, evaluate)
                VALUES (?, ?, ?, ?)
            ");
            mysqli_stmt_bind_param(
                $stmt,
                "ssss",
                $data['evaluate_ID'],
                $data['student_ID'],
                $data['course_period'],
                $data['evaluate']
            );

            if (!mysqli_stmt_execute($stmt)) {
                $transactionSuccess = false;
                throw new Exception("新增 evaluation 失敗: " . mysqli_error($conn));
            }
            mysqli_stmt_close($stmt);

            // 新增 evaluation_mapping
            $stmtMap = mysqli_prepare($conn, "
                INSERT INTO evaluation_mapping (course_ID, evaluate_ID)
                VALUES (?, ?)
            ");
            mysqli_stmt_bind_param($stmtMap, "ss", $data['course_ID'], $data['evaluate_ID']);
            if (!mysqli_stmt_execute($stmtMap)) {
                $transactionSuccess = false;
                throw new Exception("新增 evaluation_mapping 失敗: " . mysqli_error($conn));
            }
            mysqli_stmt_close($stmtMap);

            // 如果都成功，提交事務
            mysqli_commit($conn);
            echo json_encode([
                'success' => true,
                'message' => '評論新增成功',
                'evaluate_ID' => $data['evaluate_ID']
            ]);

        } catch (Exception $e) {
            // 任何一步失敗，回滾事務
            mysqli_rollback($conn);
            http_response_code(500); // Internal Server Error
            echo json_encode([
                'success' => false,
                'message' => '新增操作失敗：' . $e->getMessage(),
                // 'error' => $e->getMessage() // 在生產環境中應避免顯示詳細錯誤信息
            ]);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['evaluate_ID'])) {
            http_response_code(400);
            echo json_encode(["error" => "evaluate_ID 不可為空"]);
            exit;
        }

        $evaluate_ID = $_GET['evaluate_ID'];

        // 檢查是否存在
        $checkStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM evaluation WHERE evaluate_ID = ?");
        mysqli_stmt_bind_param($checkStmt, "s", $evaluate_ID);
        mysqli_stmt_execute($checkStmt);
        mysqli_stmt_bind_result($checkStmt, $count);
        mysqli_stmt_fetch($checkStmt);
        mysqli_stmt_close($checkStmt);

        if ($count == 0) {
            echo json_encode([
                "success" => false,
                "message" => "找不到 evaluate_ID={$evaluate_ID} 的評論"
            ]);
            exit;
        }

        // 先刪除 mapping
        $stmtMap = mysqli_prepare($conn, "DELETE FROM evaluation_mapping WHERE evaluate_ID = ?");
        mysqli_stmt_bind_param($stmtMap, "s", $evaluate_ID);
        if (!mysqli_stmt_execute($stmtMap)) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "刪除 evaluation_mapping 失敗",
                "error" => mysqli_error($conn)
            ]);
            mysqli_stmt_close($stmtMap);
            exit;
        }
        mysqli_stmt_close($stmtMap);

        // 再刪除主表
        $stmt = mysqli_prepare($conn, "DELETE FROM evaluation WHERE evaluate_ID = ?");
        mysqli_stmt_bind_param($stmt, "s", $evaluate_ID);

        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(["status" => "刪除成功"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "刪除失敗", "details" => mysqli_error($conn)]);
        }

        mysqli_stmt_close($stmt);
        break;

}
?>