<!-- 留言板 -->
<?php
require 'db.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // 查詢單筆留言
            $stmt = $pdo->prepare("SELECT * FROM messages WHERE question_id = ?");
            $stmt->execute([$_GET['id']]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {// 找到則回傳資料
                echo json_encode($result);
            } else {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => 'Message not found']);
            }
        } else {
            // 查詢全部留言
            $stmt = $pdo->query("SELECT * FROM messages");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
        break;

    case 'POST':
        // 取得前端送來的 JSON 資料
        $data = json_decode(file_get_contents("php://input"), true);

        // 基本欄位檢查
        if (!isset($data['question_id'], $data['question_name'], $data['question_department'], $data['question_title'], $data['question'], $data['popular_question'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
            exit;
        }

        $question_title = $data['question_title'];
        $question_text = $data['question'];
        $full_text = $question_title . ' ' . $question_text;

        // 敏感字檢查
        $stmt = $pdo->query("SELECT word FROM sensitive_words");
        $sensitive_list = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $matched_words = [];
        foreach ($sensitive_list as $word) {
            if (stripos($full_text, $word) !== false) {
                $matched_words[] = $word;
            }
        }

        if (!empty($matched_words)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => '留言中含有敏感字詞',
                'matched_words' => $matched_words
            ]);
            exit;
        }

        // 新增留言
        $stmt = $pdo->prepare("
        INSERT INTO messages 
            (question_id, question_name, question_department, question_title, question, sensitive_words, popular_question)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['question_id'],
            $data['question_name'],
            $data['question_department'],
            $data['question_title'],
            $data['question'],
            '', 
            $data['popular_question']
        ]);
        echo json_encode(['status' => 'Message created']);
        break;

    case 'PUT':
         // 修改留言的回覆內容（respond）
        $data = json_decode(file_get_contents("php://input"), true);
        
        // 檢查必要參數
        if (!isset($_GET['id']) || !isset($data['respond'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing id or respond']);
            break;
        }

        // 更新留言的 respond 欄位
        $stmt = $pdo->prepare("UPDATE messages SET respond = ? WHERE question_id = ?");
        $stmt->execute([
            $data['respond'],
            $_GET['id']
        ]);
        echo json_encode(['status' => 'Message updated']);
        break;

    case 'DELETE':
        // 刪除留言
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Missing id']);
            break;
        }

         // 刪除資料
        $stmt = $pdo->prepare("DELETE FROM messages WHERE question_id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode(['status' => 'Message deleted']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
        break;
}
?>
