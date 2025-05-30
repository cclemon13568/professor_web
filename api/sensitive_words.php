<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');
require_once('words.php');

// 主程式處理敏感字詞的 CRUD 請求
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['word_ID'])) {
            $word_ID = $_GET['word_ID'];

            // 使用 prepared statement 查詢單筆資料
            $stmt = $conn->prepare("SELECT * FROM sensitive_words WHERE word_ID = ?");
            $stmt->bind_param("s", $word_ID);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                echo json_encode($result->fetch_all(MYSQLI_ASSOC));
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => "找不到 word_ID={$word_ID} 的字詞"
                ]);
            }
        } else {
            // 查詢所有留言
            $sql = "SELECT * FROM sensitive_words ORDER BY word_ID ASC";
            $result = $conn->query($sql);
            echo json_encode($result->fetch_all(MYSQLI_ASSOC));
        }
        break;

    case 'POST':
        // 新增敏感字詞
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['word']) || trim($data['word']) === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '請提供敏感字詞']);
            exit;
        }

        $word = trim($data['word']);

        // 檢查是否已存在
        $checkStmt = $conn->prepare("SELECT word_ID FROM sensitive_words WHERE word = ?");
        $checkStmt->bind_param("s", $word);
        $checkStmt->execute();
        $checkStmt->store_result();

        if ($checkStmt->num_rows > 0) {
            http_response_code(409); // Conflict
            echo json_encode([
                'success' => false,
                'message' => '該敏感字詞已存在，請勿重複新增'
            ]);
            exit;
        }

        // 若無重複，執行插入
        $stmt = $conn->prepare("INSERT INTO sensitive_words (word) VALUES (?)");
        $stmt->bind_param("s", $word);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => '敏感字詞已新增']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '新增失敗']);
        }
        break;


    case 'PUT':
        // 修改敏感字詞
        $data = json_decode(file_get_contents("php://input"), true);

        $errors = [];

        if (!isset($data['word_ID']) || trim($data['word_ID']) === '') {
            $errors[] = 'word_ID';
        }

        if (!isset($data['word']) || trim($data['word']) === '') {
            $errors[] = '敏感字詞';
        }

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => '請提供：' . implode('、', $errors)
            ]);
            exit;
        }

    $stmt = $conn->prepare("UPDATE sensitive_words SET word = ? WHERE word_ID = ?");
    $stmt->bind_param("si", $data['word'], $data['word_ID']);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => '敏感字詞已更新']);
    } else {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => '更新失敗']);
    }
    break;


    case 'DELETE':
        if (empty($_GET['word_ID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'word_ID 為必填']);
            exit;
        }

        $word_ID = $_GET['word_ID'];

        $stmt_check = mysqli_prepare($conn, "SELECT word_ID FROM sensitive_words WHERE word_ID = ?");
        mysqli_stmt_bind_param($stmt_check, "s", $word_ID);
        mysqli_stmt_execute($stmt_check);
        $result_check = mysqli_stmt_get_result($stmt_check);

        if (mysqli_num_rows($result_check) === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => "找不到 word_ID = $word_ID 的字詞"]);
            exit;
        }

        $stmt = mysqli_prepare($conn, "DELETE FROM sensitive_words WHERE word_ID = ?");
        mysqli_stmt_bind_param($stmt, "s", $word_ID);

        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => '刪除成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '刪除失敗：' . mysqli_error($conn)]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => '不支援的請求方法']);
}
?>
