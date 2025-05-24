<!-- 評價 -->
<?php
require 'db.php';
header('Content-Type: application/json');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // 查詢某門課的所有評論
        if (isset($_GET['course_id'])) {
            try {
                // 查詢特定課程 ID 的所有評論
                $stmt = $pdo->prepare("
                    SELECT r.* FROM course_reviews r
                    JOIN course_evaluations e ON r.evaluate_id = e.evaluate_id
                    WHERE e.course_id = ?
                ");
                $stmt->execute([$_GET['course_id']]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));  // 回傳查詢結果
            } catch (PDOException $e) {
                // 資料庫錯誤處理
                http_response_code(500);
                echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);  // 顯示錯誤訊息
            }
        } else {
            try {
                // 查詢所有課程與評論的對應關係
                $stmt = $pdo->query("SELECT * FROM course_evaluations");
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));  // 回傳所有資料
            } catch (PDOException $e) {
                // 資料庫錯誤處理
                http_response_code(500);
                echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);  // 顯示錯誤訊息
            }
        }
        break;

    case 'POST':
        // 建立一個課程與評論的對應關係
        $data = json_decode(file_get_contents("php://input"), true);
        
        // 檢查欄位
        if (!isset($data['course_id'], $data['evaluate_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing course_id or evaluate_id']);
            exit;
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO course_evaluations (course_id, evaluate_id) VALUES (?, ?)");
            $stmt->execute([
                $data['course_id'],
                $data['evaluate_id']
            ]);
            echo json_encode(['status' => 'Evaluation relation created']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['course_id'], $_GET['evaluate_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing course_id or evaluate_id']);
            exit;
        }

        try {
            // 刪除課程與評論的對應關係
            $stmt = $pdo->prepare("DELETE FROM course_evaluations WHERE course_id = ? AND evaluate_id = ?");
            $stmt->execute([$_GET['course_id'], $_GET['evaluate_id']]);
            echo json_encode(['status' => 'Evaluation relation deleted']);
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
