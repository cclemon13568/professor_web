<!-- 課程簡介 -->
<?php
require 'db.php';
header('Content-Type: application/json');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // 查全部 or 指定課程
        try {
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("SELECT * FROM courses WHERE course_id = ?");
                $stmt->execute([$_GET['id']]);
                echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
            } else {
                $stmt = $pdo->query("SELECT * FROM courses");
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // 新增課程
        $data = json_decode(file_get_contents("php://input"), true);
        
        // 檢查欄位
        if (!$data || !isset($data['course_id'], $data['course_name'], $data['course_time'], $data['course_online'], $data['teacher_id'], $data['course_score'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or missing fields']);
            exit;
        }

         try {
            // 寫入課程資料
            $stmt = $pdo->prepare("
                INSERT INTO courses 
                (course_id, course_name, course_time, course_outline, teacher_id, course_score) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data["course_id"],
                $data['course_name'],
                $data['course_time'],
                $data['course_online'],
                $data['teacher_id'],
                $data['course_score']
            ]);
            echo json_encode(['status' => 'Course created']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // 刪除課程
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing course_id']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM courses WHERE course_id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(['status' => 'Course deleted']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
        break;

        case 'PUT':
            // 修改課程
            $data = json_decode(file_get_contents("php://input"), true);
        
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing course_id']);
                exit;
            }
        
            // 檢查必要欄位是否存在
            if (!$data || !isset($data['course_name'], $data['course_time'], $data['course_outline'], $data['teacher_id'], $data['course_score'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields']);
                exit;
            }
        
            try {
                // 更新指定課程的資料
                $stmt = $pdo->prepare("
                    UPDATE courses 
                    SET course_name = ?, course_time = ?, course_outline = ?, teacher_id = ?, course_score = ? 
                    WHERE course_id = ?
                ");
                $stmt->execute([
                    $data['course_name'],
                    $data['course_time'],
                    $data['course_outline'],
                    $data['teacher_id'],
                    $data['course_score'],
                    $_GET['id']
                ]);
        
                echo json_encode(['status' => 'Course updated']);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
            }
            break;
}
?>
