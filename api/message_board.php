<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

require_once('words.php');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['question_ID'])) {
            $question_ID = $_GET['question_ID'];

            // 使用 prepared statement 查詢單筆資料
            $stmt = $conn->prepare("SELECT * FROM message_board WHERE question_ID = ?");
            $stmt->bind_param("s", $question_ID);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($row = $result->fetch_assoc()) { // 使用 fetch_assoc() 而不是 fetch_all()
                echo json_encode($row); // 直接輸出單一物件
            } else {
                http_response_code(404); // 找不到資料應該是 404
                echo json_encode([
                    'success' => false,
                    'message' => "找不到 question_ID={$question_ID} 的問題"
                ]);
            }
            $stmt->close(); // 關閉 statement
        } else {
            // 查詢所有留言
            $sql = "SELECT * FROM message_board ORDER BY question_ID ASC";
            $result = $conn->query($sql);
            echo json_encode($result->fetch_all(MYSQLI_ASSOC));
        }
        break;


    case 'POST':
        // 發布新留言
        $data = json_decode(file_get_contents("php://input"), true);

        // 自動產生 question_ID（若未提供）
        if (!isset($data['question_ID']) || empty($data['question_ID'])) {
            $result = $conn->query("SELECT question_ID FROM message_board ORDER BY question_ID DESC LIMIT 1");

            if ($result && $result->num_rows > 0) {
                $last_id = $result->fetch_assoc()['question_ID'];
                $num = (int)substr($last_id, 1);
                $new_id = 'Q' . str_pad($num + 1, 3, '0', STR_PAD_LEFT);
            } else {
                $new_id = 'Q001';
            }

            $data['question_ID'] = $new_id;
        }

        // 檢查必要欄位是否存在
        if (
            !isset($data['question_name']) ||
            !isset($data['question_department']) ||
            !isset($data['question_title']) ||
            !isset($data['question_content']) ||
            !isset($data['popular_question'])
        ) {
            http_response_code(400);
            echo json_encode(['status' => 'false', 'message' => '缺少必要欄位']);
            exit;
        }

        // 🔍 檢查標題與內文是否為空白（即使有欄位但內容只有空白）
        if (trim($data['question_title']) === '' || trim($data['question_content']) === '') {
            http_response_code(400);
            echo json_encode(['status' => 'false', 'message' => '標題與內容不可為空']);
            exit;
        }

        // 敏感字檢查
        $combinedText = $data['question_title'] . ' ' . $data['question_content'];
        $violations = checkSensitiveWords($conn, $combinedText);

        if (!empty($violations)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'false',
                'message' => '留言中含有敏感字詞',
                'matched_words' => $violations
            ]);
            exit;
        }

        // 新增留言
        $stmt = $conn->prepare("INSERT INTO message_board (question_ID, question_name, question_department, question_title, question_content, popular_question) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss",
            $data['question_ID'],
            $data['question_name'],
            $data['question_department'],
            $data['question_title'],
            $data['question_content'],
            $data['popular_question']
        );

        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => '留言已發布']);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => '留言發布失敗']);
        }
        break;



    case 'DELETE':
        if (!isset($_GET['question_ID']) || empty($_GET['question_ID'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => '請提供 question_ID'
            ]);
            exit;
        }

        $question_ID = $_GET['question_ID'];

        // 先刪除所有對應回覆（responds）
        $stmt1 = mysqli_prepare($conn, "DELETE FROM responds WHERE question_ID = ?");
        mysqli_stmt_bind_param($stmt1, "s", $question_ID);
        if (!mysqli_stmt_execute($stmt1)) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '刪除失敗：' . mysqli_error($conn)
            ]);
            exit;
        }

        // 再刪除主留言
        $stmt2 = mysqli_prepare($conn, "DELETE FROM message_board WHERE question_ID = ?");
        mysqli_stmt_bind_param($stmt2, "s", $question_ID);
        if (!mysqli_stmt_execute($stmt2)) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '刪除失敗：' . mysqli_error($conn)
            ]);
            exit;
        }

        // 判斷是否有刪到資料
        if (mysqli_stmt_affected_rows($stmt2) === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => '未找到該 question_ID'
            ]);
            exit;
        }

        // 刪除成功
        echo json_encode([
            'success' => true,
            'message' => '刪除成功'
        ]);
        break;


    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => '不支援的請求方法']);
}
?>
