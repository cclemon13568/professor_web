<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

require_once('words.php');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['question_ID'])) {
            // 查詢單一主留言及其回覆（回覆為巢狀結構，包含 is_teacher_response）
            $question_ID = $_GET['question_ID'];

            $stmt1 = $conn->prepare("SELECT * FROM message_board WHERE question_ID = ?");
            if ($stmt1 === false) { 
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => '資料庫錯誤: ' . $conn->error]);
                exit;
            }
            $stmt1->bind_param("s", $question_ID);
            $stmt1->execute();
            $msgResult = $stmt1->get_result()->fetch_assoc();
            $stmt1->close();

            if (!$msgResult) {
                http_response_code(404);
                echo json_encode(['status' => 'error', 'message' => '留言不存在']);
                exit;
            }

            $stmt2 = $conn->prepare("SELECT * FROM responds WHERE question_ID = ? ORDER BY created_at ASC");
            if ($stmt2 === false) { 
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => '資料庫錯誤: ' . $conn->error]);
                exit;
            }
            $stmt2->bind_param("s", $question_ID);
            $stmt2->execute();
            $allReplies = $stmt2->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt2->close();

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
            unset($reply);

            $msgResult['responds'] = $nestedReplies;
            echo json_encode($msgResult);

        } else {
            // 取得所有回覆的扁平列表（包含 is_teacher_response）
            $stmt_all_responds = $conn->prepare("SELECT * FROM responds ORDER BY created_at DESC");
            if ($stmt_all_responds === false) {
                http_response_code(500);
                echo json_encode(['status' => 'error', 'message' => '資料庫準備查詢所有回覆失敗: ' . $conn->error]);
                exit;
            }
            $stmt_all_responds->execute();
            $allResponds = $stmt_all_responds->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt_all_responds->close();

            echo json_encode($allResponds);
        }
        break;

    case 'POST':
        // 新增回覆，支援 is_teacher_response 欄位
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['question_ID'], $data['respond_content'])) {
            http_response_code(400);
            echo json_encode(['success' => 'error', 'message' => '缺少必要欄位']);
            exit;
        }

        $question_ID = $data['question_ID'];
        $respond_content = trim($data['respond_content']);
        $parent_respond_ID = isset($data['parent_respond_ID']) && !empty($data['parent_respond_ID']) ? (int)$data['parent_respond_ID'] : null;
        $is_teacher_response = isset($data['is_teacher_response']) ? ((int)$data['is_teacher_response'] === 1 ? 1 : 0) : 0;

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
        if ($stmt === false) {
            http_response_code(500);
            echo json_encode(['success' => 'error', 'message' => '資料庫準備驗證主留言失敗: ' . $conn->error]);
            exit;
        }
        $stmt->bind_param("s", $question_ID);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['success' => 'error', 'message' => "question_ID={$question_ID} 的留言不存在"]);
            exit;
        }
        $stmt->close();

        // 檢查 parent_respond_ID 是否存在（若有）
        if (!is_null($parent_respond_ID)) {
            $stmt = $conn->prepare("SELECT 1 FROM responds WHERE respond_ID = ?");
            if ($stmt === false) {
                http_response_code(500);
                echo json_encode(['success' => 'error', 'message' => '資料庫準備驗證父回覆失敗: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("i", $parent_respond_ID);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => 'error', 'message' => "parent_respond_ID={$parent_respond_ID} 的回覆不存在"]);
                exit;
            }
            $stmt->close();
        }

        // 新增回覆，包含 is_teacher_response
        $stmt = $conn->prepare("INSERT INTO responds (question_ID, respond_content, parent_respond_ID, is_teacher_response) VALUES (?, ?, ?, ?)");
        if ($stmt === false) {
            http_response_code(500);
            echo json_encode(['success' => 'error', 'message' => '資料庫準備新增回覆失敗: ' . $conn->error]);
            exit;
        }
        $stmt->bind_param("ssii", $question_ID, $respond_content, $parent_respond_ID, $is_teacher_response);

        if ($stmt->execute()) {
            echo json_encode(['success' => 'success', 'message' => '回覆已新增', 'respond_ID' => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => 'error', 'message' => '回覆新增失敗: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    case 'DELETE':
        // 刪除回覆及其子回覆，沒有變動，因為不影響 is_teacher_response
        parse_str(file_get_contents("php://input"), $data);

        if (!isset($data['respond_ID']) && isset($_GET['respond_ID'])) {
            $data['respond_ID'] = $_GET['respond_ID'];
        }

        if (!isset($data['respond_ID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '缺少 respond_ID']);
            exit;
        }

        $respond_ID = (int)$data['respond_ID'];

        $stmt_check = $conn->prepare("SELECT 1 FROM responds WHERE respond_ID = ?");
        $stmt_check->bind_param("i", $respond_ID);
        $stmt_check->execute();
        $stmt_check->store_result();

        if ($stmt_check->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => "找不到 respond_ID = {$respond_ID} 的回覆"]);
            exit;
        }

        // 遞迴刪除函式
        function deleteReplyAndChildren($conn, $respond_ID) {
            $stmt = $conn->prepare("SELECT respond_ID FROM responds WHERE parent_respond_ID = ?");
            $stmt->bind_param("i", $respond_ID);
            $stmt->execute();
            $result = $stmt->get_result();

            while ($row = $result->fetch_assoc()) {
                deleteReplyAndChildren($conn, $row['respond_ID']);
            }

            $stmt = $conn->prepare("DELETE FROM responds WHERE respond_ID = ?");
            $stmt->bind_param("i", $respond_ID);
            $stmt->execute();
        }

        deleteReplyAndChildren($conn, $respond_ID);

        echo json_encode(['success' => true, 'message' => '回覆及其子回覆已刪除']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => '不支援的請求方法']);
}
?>
