<!-- 評論 -->
<?php
require 'db.php';
header('Content-Type: application/json');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // 查詢某堂課的評論
        try {
            if (isset($_GET['evaluate_id'])) {
                $stmt = $pdo->prepare("SELECT * FROM course_reviews WHERE evaluate_id = ?");
                $stmt->execute([$_GET['evaluate_id']]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));// 回傳查詢結果
            } else { 
                // 查詢所有評論
                $stmt = $pdo->query("SELECT * FROM course_reviews");
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
        break;

    case 'POST':
        // 新增評論
        $data = json_decode(file_get_contents("php://input"), true);
        
        // 檢查欄位
        if (!$data || !isset($data['evaluate_id'], $data['student_id'], $data['course_id'], $data['course_period'], $data['evaluate'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or missing fields']);
            exit;
        }

         try {
             // 插入新評論
            $stmt = $pdo->prepare("INSERT INTO course_reviews (evaluate_id, student_id,  course_id, course_period, evaluate) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['evaluate_id'],
                $data['student_id'],
                $data['course_id'],
                $data['course_period'],
                $data['evaluate']
            ]);
            echo json_encode(['status' => 'Review added']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing review ID']);
            exit;
        }

        try {
            // 刪除指定的評論
            $stmt = $pdo->prepare("DELETE FROM course_reviews WHERE review_id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(['status' => 'Review deleted']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
?>
