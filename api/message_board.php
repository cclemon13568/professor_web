<?php
include('../config/db.php'); // 請確保此路徑正確
header('Content-Type: application/json; charset=utf-8');

require_once('words.php'); // 假設 checkSensitiveWords 函數在此檔案中定義

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['question_ID'])) {
            $question_ID = $_GET['question_ID'];

            // 使用預處理語句查詢單一紀錄
            $stmt = $conn->prepare("SELECT * FROM message_board WHERE question_ID = ?");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫查詢準備失敗: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("s", $question_ID);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($row = $result->fetch_assoc()) { // 使用 fetch_assoc() 取得單一列
                echo json_encode(['success' => true, 'data' => $row]); // 包裝在成功物件中
            } else {
                http_response_code(404); // 找不到
                echo json_encode([
                    'success' => false,
                    'message' => "找不到 question_ID={$question_ID} 的問題"
                ]);
            }
            $stmt->close(); // 關閉語句
        } else {
            // 查詢所有留言
            $sql = "SELECT * FROM message_board ORDER BY question_ID ASC";
            $result = $conn->query($sql);
            if (!$result) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '查詢所有留言失敗: ' . $conn->error]);
                exit;
            }
            echo json_encode(['success' => true, 'data' => $result->fetch_all(MYSQLI_ASSOC)]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? 'create'; // 預設動作為 'create'

        if ($action === 'create') {
            // --- POST (新增) 邏輯 ---
            // 自動生成 question_ID (如果未提供)
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
            } else {
                 // 如果提供了 question_ID，檢查它是否已存在
                $check_id_stmt = $conn->prepare("SELECT COUNT(*) FROM message_board WHERE question_ID = ?");
                if (!$check_id_stmt) {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => '檢查問題ID資料庫準備失敗: ' . $conn->error]);
                    exit;
                }
                $check_id_stmt->bind_param("s", $data['question_ID']);
                $check_id_stmt->execute();
                $check_id_stmt->bind_result($count);
                $check_id_stmt->fetch();
                $check_id_stmt->close();

                if ($count > 0) {
                    http_response_code(409); // 衝突
                    echo json_encode(['success' => false, 'message' => '此問題ID已存在，請勿重複新增']);
                    exit;
                }
            }

            // 檢查必要欄位
            if (
                !isset($data['question_name']) || trim($data['question_name']) === '' ||
                !isset($data['question_department']) || trim($data['question_department']) === '' ||
                !isset($data['question_title']) || trim($data['question_title']) === '' ||
                !isset($data['question_content']) || trim($data['question_content']) === '' // 修正：確保內容不為空字串
            ) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => '缺少或空白必要欄位']);
                exit;
            }

            // 敏感詞檢查
            $combinedText = $data['question_title'] . ' ' . $data['question_content'];
            $violations = checkSensitiveWords($conn, $combinedText); // 確保 checkSensitiveWords 函數接收 $conn 參數

            if (!empty($violations)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => '留言中含有敏感字詞',
                    'matched_words' => $violations
                ]);
                exit;
            }

            // 插入新留言
            $stmt = $conn->prepare("INSERT INTO message_board (question_ID, question_name, question_department, question_title, question_content) VALUES (?, ?, ?, ?, ?)");
            // 修正：在 INSERT 語句中加入 question_content 欄位
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '新增留言資料庫準備失敗: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("sssss",
                $data['question_ID'],
                $data['question_name'],
                $data['question_department'],
                $data['question_title'],
                $data['question_content'] // 現在與 SQL 語句匹配
            );

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => '留言已發布', 'question_ID' => $data['question_ID']]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '留言發布失敗: ' . $stmt->error]);
            }
            $stmt->close();
        } elseif ($action === 'update') {
            // --- POST (更新) 邏輯 ---
            if (!isset($data['question_ID']) || empty($data['question_ID'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => '請提供 question_ID 以更新留言']);
                exit;
            }

            $question_ID = $data['question_ID'];
            $updateFields = [];
            $bindParams = '';
            $bindValues = [];

            // 定義允許更新的欄位及其類型
            $allowedFields = [
                'question_name' => 's',
                'question_department' => 's',
                'question_title' => 's',
                'question_content' => 's'
            ];

            foreach ($allowedFields as $field => $type) {
                if (isset($data[$field])) {
                    // 檢查文字欄位是否為空字串
                    if (in_array($field, ['question_title', 'question_content']) && trim($data[$field]) === '') {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => "$field 不可為空"]);
                        exit;
                    }
                    $updateFields[] = "$field = ?";
                    $bindParams .= $type;
                    $bindValues[] = $data[$field];
                }
            }

            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => '沒有提供要更新的欄位']);
                exit;
            }

            // 如果標題/內容正在更新，進行敏感詞檢查
            if (isset($data['question_title']) || isset($data['question_content'])) {
                $current_title = $data['question_title'] ?? null;
                $current_content = $data['question_content'] ?? null;

                // 如果只提供其中一個，則從資料庫中獲取現有的標題/內容
                if ($current_title === null || $current_content === null) {
                    $fetch_stmt = $conn->prepare("SELECT question_title, question_content FROM message_board WHERE question_ID = ?");
                    if ($fetch_stmt) {
                        $fetch_stmt->bind_param("s", $question_ID);
                        $fetch_stmt->execute();
                        $fetch_result = $fetch_stmt->get_result();
                        if ($row = $fetch_result->fetch_assoc()) {
                            $current_title = $current_title ?? $row['question_title'];
                            $current_content = $current_content ?? $row['question_content'];
                        }
                        $fetch_stmt->close();
                    }
                }
                $combinedText = $current_title . ' ' . $current_content;
                $violations = checkSensitiveWords($conn, $combinedText);
                if (!empty($violations)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => '更新內容中含有敏感字詞',
                        'matched_words' => $violations
                    ]);
                    exit;
                }
            }

            $bindParams .= 's'; // 為 question_ID 添加類型
            $bindValues[] = $question_ID;

            $sql = "UPDATE message_board SET " . implode(', ', $updateFields) . " WHERE question_ID = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '更新留言資料庫準備失敗: ' . $conn->error]);
                exit;
            }

            // 動態綁定參數
            // 修正：使用 call_user_func_array 來綁定動態參數，並確保引用傳遞
            $bind_params_ref = [];
            $bind_params_ref[] = $bindParams; // 第一個參數是類型字串

            // 遍歷 $bindValues 陣列，將每個值作為引用添加到 $bind_params_ref
            // 這是解決 'Argument #X must be passed by reference' 警告的關鍵
            foreach ($bindValues as $key => $val) {
                $bind_params_ref[] = &$bindValues[$key]; // 注意這裡的 & 符號，表示傳遞引用
            }

            // 使用 call_user_func_array 執行 bind_param
            call_user_func_array([$stmt, 'bind_param'], $bind_params_ref);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    echo json_encode(['success' => true, 'message' => '留言已更新']);
                } else {
                    echo json_encode(['success' => true, 'message' => '留言未變動 (新值與舊值相同或找不到該ID)']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '更新失敗: ' . $stmt->error]);
            }
            $stmt->close();
        } elseif ($action === 'delete') {
            // --- POST (刪除) 邏輯 ---
            if (!isset($data['question_ID']) || empty($data['question_ID'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => '請提供 question_ID 以刪除留言'
                ]);
                exit;
            }

            $question_ID = $data['question_ID'];

            // 開始事務以確保原子性
            $conn->begin_transaction();

            try {
                // 首先刪除所有相關的回覆 (responds)
                $stmt_delete_responds = $conn->prepare("DELETE FROM responds WHERE question_ID = ?");
                if (!$stmt_delete_responds) {
                    throw new Exception("刪除回覆資料庫準備失敗: " . $conn->error);
                }
                $stmt_delete_responds->bind_param("s", $question_ID);
                if (!$stmt_delete_responds->execute()) {
                    throw new Exception("刪除回覆失敗: " . $stmt_delete_responds->error);
                }
                $stmt_delete_responds->close();

                // 然後刪除主留言
                $stmt_delete_message = $conn->prepare("DELETE FROM message_board WHERE question_ID = ?");
                if (!$stmt_delete_message) {
                    throw new Exception("刪除主留言資料庫準備失敗: " . $conn->error);
                }
                $stmt_delete_message->bind_param("s", $question_ID);
                if (!$stmt_delete_message->execute()) {
                    throw new Exception("刪除主留言失敗: " . $stmt_delete_message->error);
                }

                // 檢查是否有實際刪除留言
                if ($stmt_delete_message->affected_rows === 0) {
                    $conn->rollback(); // 如果找不到留言則回滾
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => '未找到該 question_ID'
                    ]);
                    $stmt_delete_message->close();
                    exit;
                }

                $conn->commit(); // 如果所有操作都成功則提交事務
                echo json_encode([
                    'success' => true,
                    'message' => '留言及其相關回覆已成功刪除'
                ]);
                $stmt_delete_message->close();

            } catch (Exception $e) {
                $conn->rollback(); // 出錯時回滾
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => '刪除失敗：' . $e->getMessage()
                ]);
                exit;
            }
        } else {
            // POST 動作無效
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '無效的 POST 動作']);
        }
        break;

    default:
        http_response_code(405); // 不允許的方法
        echo json_encode(['success' => false, 'message' => '不支援的請求方法']);
}
?>