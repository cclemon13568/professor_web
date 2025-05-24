<!-- 學生評論 -->
<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['evaluate_ID'])) {
            $evaluate_ID = $_GET['evaluate_ID'];
            $stmt = mysqli_prepare($conn, "SELECT * FROM evaluation WHERE evaluate_ID = ?");
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
            $result = mysqli_query($conn, "SELECT * FROM evaluation");
            echo json_encode(mysqli_fetch_all($result, MYSQLI_ASSOC));
        }
        break;


    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        // 情況一：evaluate_ID 缺少或為空
        if (!isset($data['evaluate_ID']) || trim($data['evaluate_ID']) === '') {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'evaluate_ID 不可為空'
            ]);
            exit;
        }

        // 情況二：缺少任一必要欄位
        if (!isset($data['student_ID'], $data['course_period'], $data['evaluate'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => '缺少必要欄位'
            ]);
            exit;
        }

        // 插入資料
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

        // 執行插入與錯誤處理
        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => '新增成功']);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => mysqli_error($conn)
            ]);
        }

        mysqli_stmt_close($stmt);
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

    default:
        http_response_code(405);
        echo json_encode(["error" => "Method Not Allowed"]);
        break;
}
?>
