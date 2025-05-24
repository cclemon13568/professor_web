<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (empty($_GET['course_ID'])) {
            $result = mysqli_query($conn, "SELECT * FROM course_info");
            $courses = mysqli_fetch_all($result, MYSQLI_ASSOC);
            echo json_encode($courses);
        } else {
            $course_ID = $_GET['course_ID'];
            $stmt = mysqli_prepare($conn, "SELECT * FROM course_info WHERE course_ID = ?");
            mysqli_stmt_bind_param($stmt, "s", $course_ID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);
            $course = mysqli_fetch_assoc($result);

            if ($course) {
                echo json_encode($course);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => "找不到 course_ID = $course_ID 的課程"]);
            }
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

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

        $stmt = mysqli_prepare($conn, "
            INSERT INTO course_info 
            (course_ID, course_name, course_time, course_outline, teacher_ID, course_score) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
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
            echo json_encode(['success' => true, 'message' => '新增成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '新增失敗：' . mysqli_error($conn)]);
        }
        break;


    case 'DELETE':
        if (empty($_GET['course_ID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'course_ID 為必填']);
            exit;
        }

        $course_ID = $_GET['course_ID'];

        $stmt_check = mysqli_prepare($conn, "SELECT course_ID FROM course_info WHERE course_ID = ?");
        mysqli_stmt_bind_param($stmt_check, "s", $course_ID);
        mysqli_stmt_execute($stmt_check);
        $result_check = mysqli_stmt_get_result($stmt_check);

        if (mysqli_num_rows($result_check) === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => "找不到 course_ID = $course_ID 的課程"]);
            exit;
        }

        $stmt = mysqli_prepare($conn, "DELETE FROM course_info WHERE course_ID = ?");
        mysqli_stmt_bind_param($stmt, "s", $course_ID);

        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => '刪除成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '刪除失敗：' . mysqli_error($conn)]);
        }
        break;

   case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);

        // 1. course_ID 為必填
        if (!$data || empty($data['course_ID'])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "course_ID 不可為空"
            ]);
            exit;
        }

        $course_ID = $data['course_ID'];

        // 2. 檢查是否存在
        $checkStmt = mysqli_prepare($conn, "SELECT COUNT(*) FROM course_info WHERE course_ID = ?");
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

        // 3. 動態組合要更新的欄位
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

        // 4. 沒提供要更新的欄位
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "沒有提供要更新的欄位"
            ]);
            exit;
        }

        // 5. 組 SQL 並執行
        $sql = "UPDATE course_info SET " . implode(", ", $fields) . " WHERE course_ID = ?";
        $types .= "s"; // course_ID 加入 types
        $values[] = $course_ID;

        $stmt = mysqli_prepare($conn, $sql);
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

        // 6. 成功回傳
        echo json_encode([
            "success" => true,
            "message" => "更新成功"
        ]);
        break;


    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
}
?>
