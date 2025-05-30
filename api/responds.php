<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

require_once('words.php');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['question_ID'])) {
            // 取得單筆留言及其回覆
            $question_ID = $_GET['question_ID'];

            $stmt1 = $conn->prepare("SELECT * FROM message_board WHERE question_ID = ?");
            $stmt1->bind_param("s", $question_ID);
            $stmt1->execute();
            $msgResult = $stmt1->get_result()->fetch_assoc();

            if (!$msgResult) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => '留言不存在']);
                exit;
            }

            // 取得所有回覆
            $stmt2 = $conn->prepare("SELECT * FROM responds WHERE question_ID = ? ORDER BY created_at ASC");
            $stmt2->bind_param("s", $question_ID);
            $stmt2->execute();
            $allReplies = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

            // 回覆巢狀處理
            $replyMap = [];
            foreach ($allReplies as $reply) {
                $reply['children'] = [];
                $replyMap[$reply['respond_ID']] = $reply;
            }

            $nestedReplies = [];
            foreach ($replyMap as $id => &$reply) {
            if ($reply['parent_respond_ID'] !== null) {
                $parentId = $reply['parent_respond_ID'];
                if (isset($replyMap[$parentId])) {
                    $replyMap[$parentId]['children'][] = &$reply;
                }
            } else {
                $nestedReplies[] = &$reply;
            }
        }


            $msgResult['responds'] = $nestedReplies;
            echo json_encode($msgResult);
        } else {
            // 取得所有留言與其回覆
            $stmt_all = $conn->prepare("SELECT * FROM message_board ORDER BY question_ID");
            $stmt_all->execute();
            $allMessages = $stmt_all->get_result()->fetch_all(MYSQLI_ASSOC);

            foreach ($allMessages as &$msg) {
                $stmt2 = $conn->prepare("SELECT * FROM responds WHERE question_ID = ? ORDER BY created_at ASC");
                $stmt2->bind_param("s", $msg['question_ID']);
                $stmt2->execute();
                $allReplies = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);

                // 回覆巢狀處理
                $replyMap = [];
                foreach ($allReplies as $reply) {
                    $reply['children'] = [];
                    $replyMap[$reply['respond_ID']] = $reply;
                }

                $nestedReplies = [];
                foreach ($replyMap as $id => &$reply) {
                    if (!empty($reply['parent_respond_ID'])) {
                        $parentId = $reply['parent_respond_ID'];
                        if (isset($replyMap[$parentId])) {
                            $replyMap[$parentId]['children'][] = &$reply;
                        }
                    } else {
                        $nestedReplies[] = &$reply;
                    }
                }

                $msg['responds'] = $nestedReplies;
            }

            echo json_encode($allMessages);
        }
        break;


    case 'POST':
        // 新增回覆
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['question_ID'], $data['respond_content'])) {
            http_response_code(400);
            echo json_encode(['success' => 'error', 'message' => '缺少必要欄位']);
            exit;
        }

        $question_ID = $data['question_ID'];
        $respond_content = trim($data['respond_content']);
        $parent_respond_ID = isset($data['parent_respond_ID']) ? $data['parent_respond_ID'] : null;

        // 空字串檢查
        if ($respond_content === '') {
            http_response_code(400);
            echo json_encode(['success' => 'error', 'message' => '回覆內容不可為空']);
            exit;
        }

        // 敏感字檢查
        $violations = checkSensitiveWords($conn, $respond_content);
        if (!empty($violations)) {
            http_response_code(400);
            echo json_encode([
                'success' => 'error',
                'message' => '回覆中含有敏感字詞',
                'matched_words' => $violations
            ]);
            exit;
        }

        // 檢查 question_ID 是否存在
        $stmt = $conn->prepare("SELECT 1 FROM message_board WHERE question_ID = ?");
        $stmt->bind_param("s", $question_ID);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['success' => 'error', 'message' => "question_ID={$question_ID} 的留言不存在"]);
            exit;
        }

        // 檢查 parent_respond_ID 是否存在（如果有提供）
        if (!is_null($parent_respond_ID)) {
            $stmt = $conn->prepare("SELECT 1 FROM responds WHERE respond_ID = ?");
            $stmt->bind_param("i", $parent_respond_ID);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows === 0) {
                http_response_code(404);
                echo json_encode([
                    'success' => 'error',
                    'message' => "respond_ID={$parent_respond_ID} 的回覆不存在"
                ]);
                exit;
            }
        }

        // 新增回覆
        $stmt = $conn->prepare("INSERT INTO responds (question_ID, respond_content, parent_respond_ID) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $question_ID, $respond_content, $parent_respond_ID);

        if ($stmt->execute()) {
            echo json_encode(['success' => 'success', 'message' => '回覆已新增']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => 'error', 'message' => '回覆新增失敗']);
        }
        break;



    case 'DELETE':
        // 刪除回覆（會一併刪除其子回覆）
        parse_str(file_get_contents("php://input"), $data);

        // 也支援從 URL 的 query string 取得 respond_ID
        if (!isset($data['respond_ID']) && isset($_GET['respond_ID'])) {
            $data['respond_ID'] = $_GET['respond_ID'];
        }

        if (!isset($data['respond_ID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '缺少 respond_ID']);
            exit;
        }

        $respond_ID = (int)$data['respond_ID'];

        // 檢查 respond_ID 是否存在
        $stmt_check = $conn->prepare("SELECT 1 FROM responds WHERE respond_ID = ?");
        $stmt_check->bind_param("i", $respond_ID);
        $stmt_check->execute();
        $stmt_check->store_result();

        if ($stmt_check->num_rows === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => "找不到 respond_ID = {$respond_ID} 的回覆"
            ]);
            exit;
        }

        // 遞迴刪除函式
        function deleteReplyAndChildren($conn, $respond_ID) {
            // 找出所有子回覆
            $stmt = $conn->prepare("SELECT respond_ID FROM responds WHERE parent_respond_ID = ?");
            $stmt->bind_param("i", $respond_ID);
            $stmt->execute();
            $result = $stmt->get_result();

            while ($row = $result->fetch_assoc()) {
                // 遞迴刪除
                deleteReplyAndChildren($conn, $row['respond_ID']);
            }

            // 刪除自己
            $stmt = $conn->prepare("DELETE FROM responds WHERE respond_ID = ?");
            $stmt->bind_param("i", $respond_ID);
            $stmt->execute();
        }

        // 執行遞迴刪除
        deleteReplyAndChildren($conn, $respond_ID);

        echo json_encode(['success' => true, 'message' => '回覆及其子回覆已刪除']);
        break;


    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => '不支援的請求方法']);
}
?>
