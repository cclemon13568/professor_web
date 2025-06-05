<?php
include('../config/db.php'); // Ensure this path is correct
header('Content-Type: application/json; charset=utf-8');

require_once('words.php'); // Ensure this file exists and contains checkSensitiveWords

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '資料庫連線失敗']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $response_data = [];
        $response_message = '';
        $response_success = false;
        $http_status_code = 200; // Default success status code

        if (isset($_GET['question_ID'])) {
            $question_ID = $_GET['question_ID'];

            // Fetch single main message
            $stmt1 = $conn->prepare("SELECT * FROM message_board WHERE question_ID = ?");
            if ($stmt1 === false) {
                $http_status_code = 500;
                $response_message = '資料庫準備查詢主留言失敗: ' . $conn->error;
            } else {
                $stmt1->bind_param("s", $question_ID);
                $stmt1->execute();
                $msgResult = $stmt1->get_result()->fetch_assoc();
                $stmt1->close();

                if (!$msgResult) {
                    $http_status_code = 404;
                    $response_message = '留言不存在';
                } else {
                    // Fetch all replies for this question_ID
                    $stmt2 = $conn->prepare("SELECT * FROM responds WHERE question_ID = ? ORDER BY created_at ASC");
                    if ($stmt2 === false) {
                        $http_status_code = 500;
                        $response_message = '資料庫準備查詢回覆失敗: ' . $conn->error;
                    } else {
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
                        unset($reply); // Break the reference with the last element

                        $msgResult['responds'] = $nestedReplies;
                        $response_data = $msgResult;
                        $response_success = true;
                        $response_message = '成功取得主留言及其回覆資料';
                    }
                }
            }
        } else {
            // Get flat list of all replies
            $stmt_all_responds = $conn->prepare("SELECT * FROM responds ORDER BY created_at DESC");
            if ($stmt_all_responds === false) {
                $http_status_code = 500;
                $response_message = '資料庫準備查詢所有回覆失敗: ' . $conn->error;
            } else {
                $stmt_all_responds->execute();
                $allResponds = $stmt_all_responds->get_result()->fetch_all(MYSQLI_ASSOC);
                $stmt_all_responds->close();

                $response_data = $allResponds;
                $response_success = true;
                $response_message = '成功取得所有回覆資料';
            }
        }

        http_response_code($http_status_code);
        echo json_encode([
            'success' => $response_success,
            'message' => $response_message,
            'data' => $response_data
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        // --- Handle POST for PUT and DELETE operations ---
        if (isset($data['_method'])) {
            switch (strtoupper($data['_method'])) {
                case 'PUT':
                    // --- UPDATE REPLY ---
                    if (!isset($data['respond_ID'], $data['respond_content'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => '更新回覆缺少必要欄位 (respond_ID, respond_content)']);
                        exit;
                    }

                    $respond_ID = (int)$data['respond_ID'];
                    $respond_content = trim($data['respond_content']);
                    // Use null to only update if provided, otherwise leave it as is in DB
                    $is_teacher_response = isset($data['is_teacher_response']) ? ((int)$data['is_teacher_response'] === 1 ? 1 : 0) : null;

                    if ($respond_content === '') {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => '回覆內容不可為空']);
                        exit;
                    }

                    // Sensitive word check for update
                    $violations = checkSensitiveWords($conn, $respond_content);
                    if (!empty($violations)) {
                        http_response_code(400);
                        echo json_encode([
                            'success' => false,
                            'message' => '更新回覆中含有敏感字詞',
                            'matched_words' => $violations
                        ]);
                        exit;
                    }

                    // Check if respond_ID exists
                    $stmt_check_exist = $conn->prepare("SELECT 1 FROM responds WHERE respond_ID = ?");
                    if ($stmt_check_exist === false) {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => '資料庫準備檢查回覆存在性失敗: ' . $conn->error]);
                        exit;
                    }
                    $stmt_check_exist->bind_param("i", $respond_ID);
                    $stmt_check_exist->execute();
                    $stmt_check_exist->store_result();
                    if ($stmt_check_exist->num_rows === 0) {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => "找不到 respond_ID = {$respond_ID} 的回覆"]);
                        exit;
                    }
                    $stmt_check_exist->close();

                    // Construct update query dynamically based on provided fields
                    $update_fields = [];
                    $bind_params = [];
                    $bind_types = "";

                    $update_fields[] = "respond_content = ?";
                    $bind_params[] = $respond_content;
                    $bind_types .= "s";

                    if (!is_null($is_teacher_response)) {
                        $update_fields[] = "is_teacher_response = ?";
                        $bind_params[] = $is_teacher_response;
                        $bind_types .= "i";
                    }

                    $sql = "UPDATE responds SET " . implode(", ", $update_fields) . ", updated_at = NOW() WHERE respond_ID = ?";
                    $bind_params[] = $respond_ID;
                    $bind_types .= "i";

                    $stmt_update = $conn->prepare($sql);
                    if ($stmt_update === false) {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => '資料庫準備更新回覆失敗: ' . $conn->error]);
                        exit;
                    }
                    $stmt_update->bind_param($bind_types, ...$bind_params);

                    if ($stmt_update->execute()) {
                        if ($stmt_update->affected_rows > 0) {
                            echo json_encode(['success' => true, 'message' => '回覆已更新']);
                        } else {
                            echo json_encode(['success' => true, 'message' => '回覆內容相同，無需更新']);
                        }
                    } else {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => '回覆更新失敗: ' . $stmt_update->error]);
                    }
                    $stmt_update->close();
                    exit;

                case 'DELETE':
                    // --- DELETE REPLY ---
                    if (!isset($data['respond_ID'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => '刪除回覆缺少必要欄位 (respond_ID)']);
                        exit;
                    }

                    $respond_ID = (int)$data['respond_ID'];

                    $stmt_check = $conn->prepare("SELECT 1 FROM responds WHERE respond_ID = ?");
                    if ($stmt_check === false) {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => '資料庫準備檢查回覆存在性失敗: ' . $conn->error]);
                        exit;
                    }
                    $stmt_check->bind_param("i", $respond_ID);
                    $stmt_check->execute();
                    $stmt_check->store_result();

                    if ($stmt_check->num_rows === 0) {
                        http_response_code(404);
                        echo json_encode(['success' => false, 'message' => "找不到 respond_ID = {$respond_ID} 的回覆"]);
                        exit;
                    }
                    $stmt_check->close();

                    // Recursive delete function (remains the same)
                    function deleteReplyAndChildren($conn, $respond_ID) {
                        $stmt = $conn->prepare("SELECT respond_ID FROM responds WHERE parent_respond_ID = ?");
                        if ($stmt === false) {
                            throw new Exception('資料庫準備查詢子回覆失敗: ' . $conn->error);
                        }
                        $stmt->bind_param("i", $respond_ID);
                        $stmt->execute();
                        $result = $stmt->get_result();

                        while ($row = $result->fetch_assoc()) {
                            deleteReplyAndChildren($conn, $row['respond_ID']);
                        }
                        $stmt->close(); // Close after fetching all children

                        $stmt_delete = $conn->prepare("DELETE FROM responds WHERE respond_ID = ?");
                        if ($stmt_delete === false) {
                            throw new Exception('資料庫準備刪除回覆失敗: ' . $conn->error);
                        }
                        $stmt_delete->bind_param("i", $respond_ID);
                        $stmt_delete->execute();
                        $stmt_delete->close();
                    }

                    try {
                        deleteReplyAndChildren($conn, $respond_ID);
                        echo json_encode(['success' => true, 'message' => '回覆及其子回覆已刪除']);
                    } catch (Exception $e) {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => '刪除回覆失敗: ' . $e->getMessage()]);
                    }
                    exit;

                default:
                    http_response_code(405);
                    echo json_encode(['success' => false, 'message' => '不支援的 _method 類型']);
                    exit;
            }
        }

        // --- Original POST (Create) Reply Logic ---
        if (!isset($data['question_ID'], $data['respond_content'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '新增回覆缺少必要欄位 (question_ID, respond_content)']);
            exit;
        }

        $question_ID = $data['question_ID'];
        $respond_content = trim($data['respond_content']);
        $parent_respond_ID = isset($data['parent_respond_ID']) && !empty($data['parent_respond_ID']) ? (int)$data['parent_respond_ID'] : null;
        $is_teacher_response = isset($data['is_teacher_response']) ? ((int)$data['is_teacher_response'] === 1 ? 1 : 0) : 0;

        if ($respond_content === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '回覆內容不可為空']);
            exit;
        }

        // Sensitive word check
        $violations = checkSensitiveWords($conn, $respond_content);
        if (!empty($violations)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => '回覆中含有敏感字詞',
                'matched_words' => $violations
            ]);
            exit;
        }

        // Check if question_ID exists
        $stmt = $conn->prepare("SELECT 1 FROM message_board WHERE question_ID = ?");
        if ($stmt === false) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '資料庫準備驗證主留言失敗: ' . $conn->error]);
            exit;
        }
        $stmt->bind_param("s", $question_ID);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => "question_ID={$question_ID} 的留言不存在"]);
            exit;
        }
        $stmt->close();

        // Check if parent_respond_ID exists (if provided)
        if (!is_null($parent_respond_ID)) {
            $stmt = $conn->prepare("SELECT 1 FROM responds WHERE respond_ID = ?");
            if ($stmt === false) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '資料庫準備驗證父回覆失敗: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("i", $parent_respond_ID);
            $stmt->execute();
            $stmt->store_result();

            if ($stmt->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => "parent_respond_ID={$parent_respond_ID} 的回覆不存在"]);
                exit;
            }
            $stmt->close();
        }

        // Insert new reply
        $stmt = $conn->prepare("INSERT INTO responds (question_ID, respond_content, parent_respond_ID, is_teacher_response) VALUES (?, ?, ?, ?)");
        if ($stmt === false) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '資料庫準備新增回覆失敗: ' . $conn->error]);
            exit;
        }
        $stmt->bind_param("ssii", $question_ID, $respond_content, $parent_respond_ID, $is_teacher_response);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => '回覆已新增', 'respond_ID' => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '回覆新增失敗: ' . $stmt->error]);
        }
        $stmt->close();
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => '不支援的請求方法']);
}
?>