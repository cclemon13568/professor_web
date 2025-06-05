<?php
include('../config/db.php'); // Ensure this path is correct
header('Content-Type: application/json; charset=utf-8');

// require_once('words.php'); // Assuming words.php exists and might contain related functions, though not directly used in this CRUD.
                             // If no functions from words.php are used here, you can safely remove this line.

if (!$conn) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '資料庫連線失敗']);
    exit;
}

// Main program to handle sensitive word CRUD requests
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $data = []; // Initialize data array for unified response
        $message = '';
        $success = false;
        $statusCode = 200; // Default success status code

        if (isset($_GET['word_ID'])) {
            $word_ID = $_GET['word_ID'];

            // Use prepared statement to query a single record
            $stmt = $conn->prepare("SELECT * FROM sensitive_words WHERE word_ID = ?");
            if (!$stmt) {
                $statusCode = 500;
                $message = '資料庫查詢準備失敗: ' . $conn->error;
            } else {
                $stmt->bind_param("s", $word_ID);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    $data = $result->fetch_all(MYSQLI_ASSOC);
                    $success = true;
                    $message = "成功取得 word_ID={$word_ID} 的字詞資料";
                } else {
                    $statusCode = 404; // Not Found
                    $message = "找不到 word_ID={$word_ID} 的字詞";
                }
                $stmt->close();
            }
        } else {
            // Query all sensitive words
            $sql = "SELECT * FROM sensitive_words ORDER BY word_ID ASC";
            $result = $conn->query($sql);
            if (!$result) {
                $statusCode = 500;
                $message = '查詢所有敏感字詞失敗: ' . $conn->error;
            } else {
                $data = $result->fetch_all(MYSQLI_ASSOC);
                $success = true;
                $message = '成功取得所有敏感字詞資料';
            }
        }

        // Unified GET response
        http_response_code($statusCode);
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $action = $data['action'] ?? 'create'; // Default action is 'create'

        if ($action === 'create') {
            if (!isset($data['word']) || trim($data['word']) === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => '請提供敏感字詞']);
                exit;
            }

            $word = trim($data['word']);

            // Check if the word already exists
            $checkStmt = $conn->prepare("SELECT word_ID FROM sensitive_words WHERE word = ?");
            if (!$checkStmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '檢查重複字詞資料庫準備失敗: ' . $conn->error]);
                exit;
            }
            $checkStmt->bind_param("s", $word);
            $checkStmt->execute();
            $checkStmt->store_result(); // Store result to check num_rows

            if ($checkStmt->num_rows > 0) {
                http_response_code(409); // Conflict
                echo json_encode([
                    'success' => false,
                    'message' => '該敏感字詞已存在，請勿重複新增'
                ]);
                $checkStmt->close();
                exit;
            }
            $checkStmt->close();

            // If not duplicated, insert the new word
            $stmt = $conn->prepare("INSERT INTO sensitive_words (word) VALUES (?)");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '新增敏感字詞資料庫準備失敗: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("s", $word);

            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => '敏感字詞已新增', 'word_ID' => $stmt->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '新增失敗: ' . $stmt->error]);
            }
            $stmt->close();
        } elseif ($action === 'update') {
            $errors = [];

            if (!isset($data['word_ID']) || trim($data['word_ID']) === '') {
                $errors[] = 'word_ID';
            }

            if (!isset($data['word']) || trim($data['word']) === '') {
                $errors[] = '敏感字詞 (word)';
            }

            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => '請提供：' . implode('、', $errors)
                ]);
                exit;
            }

            $word_ID = $data['word_ID'];
            $new_word = trim($data['word']);

            // Check if the word_ID exists
            $check_id_stmt = $conn->prepare("SELECT COUNT(*) FROM sensitive_words WHERE word_ID = ?");
            if (!$check_id_stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '檢查 word_ID 資料庫準備失敗: ' . $conn->error]);
                exit;
            }
            $check_id_stmt->bind_param("i", $word_ID);
            $check_id_stmt->execute();
            $check_id_stmt->bind_result($count);
            $check_id_stmt->fetch();
            $check_id_stmt->close();

            if ($count === 0) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => "找不到 word_ID={$word_ID} 的字詞，無法更新"
                ]);
                exit;
            }

            // Check if the new word already exists for a *different* word_ID
            $check_word_exist_stmt = $conn->prepare("SELECT word_ID FROM sensitive_words WHERE word = ? AND word_ID != ?");
            if (!$check_word_exist_stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '檢查新字詞重複資料庫準備失敗: ' . $conn->error]);
                exit;
            }
            $check_word_exist_stmt->bind_param("si", $new_word, $word_ID);
            $check_word_exist_stmt->execute();
            $check_word_exist_result = $check_word_exist_stmt->get_result();

            if ($check_word_exist_result->num_rows > 0) {
                http_response_code(409); // Conflict
                echo json_encode([
                    'success' => false,
                    'message' => "敏感字詞 '{$new_word}' 已存在於其他項目中，請勿重複"
                ]);
                $check_word_exist_stmt->close();
                exit;
            }
            $check_word_exist_stmt->close();


            // Perform the update
            $stmt = $conn->prepare("UPDATE sensitive_words SET word = ? WHERE word_ID = ?");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '更新敏感字詞資料庫準備失敗: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("si", $new_word, $word_ID);

            if ($stmt->execute()) {
                // Check if any rows were actually affected
                if ($stmt->affected_rows > 0) {
                    echo json_encode(['success' => true, 'message' => '敏感字詞已更新']);
                } else {
                    echo json_encode(['success' => true, 'message' => '敏感字詞未變動 (新值與舊值相同)']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '更新失敗: ' . $stmt->error]);
            }
            $stmt->close();
        } elseif ($action === 'delete') {
            if (!isset($data['word_ID']) || trim($data['word_ID']) === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'word_ID 為必填']);
                exit;
            }

            $word_ID = $data['word_ID'];

            // Check if word_ID exists
            $stmt_check = $conn->prepare("SELECT word_ID FROM sensitive_words WHERE word_ID = ?");
            if (!$stmt_check) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '檢查刪除字詞資料庫準備失敗: ' . $conn->error]);
                exit;
            }
            $stmt_check->bind_param("i", $word_ID); // Assuming word_ID is integer
            $stmt_check->execute();
            $result_check = $stmt_check->get_result();

            if ($result_check->num_rows === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => "找不到 word_ID = $word_ID 的字詞"]);
                $stmt_check->close();
                exit;
            }
            $stmt_check->close();

            // Perform the delete
            $stmt = $conn->prepare("DELETE FROM sensitive_words WHERE word_ID = ?");
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '刪除敏感字詞資料庫準備失敗: ' . $conn->error]);
                exit;
            }
            $stmt->bind_param("i", $word_ID); // Assuming word_ID is integer

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    echo json_encode(['success' => true, 'message' => '刪除成功']);
                } else {
                    // This case should ideally not be hit if the check above passed
                    echo json_encode(['success' => false, 'message' => '刪除失敗：未找到符合的字詞 (可能已被刪除)']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => '刪除失敗：' . $stmt->error]);
            }
            $stmt->close();
        } else {
            // Invalid action for POST
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '無效的 POST 動作']);
        }
        break;

    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(['success' => false, 'message' => '不支援的請求方法']);
}
?>