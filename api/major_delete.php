<?php
// 關閉錯誤輸出，避免污染 JSON 回應
ini_set('display_errors', 0);

include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 解析 JSON 輸入資料
if ($_SERVER['CONTENT_TYPE'] === 'application/json') {
    $_POST = json_decode(file_get_contents('php://input'), true) ?? [];
}

// 取得 id（從 JSON POST 傳入）
$ID = $_POST['id'] ?? '';
if (!is_numeric($ID)) {
    echo json_encode(['success' => false, 'message' => '缺少或無效的 id']);
    exit;
}
$ID = (int)$ID; // 強制轉為整數

// 預備語句進行刪除
$stmt = $conn->prepare("DELETE FROM teacher_major WHERE id = ?");
$stmt->bind_param("i", $ID); // ✅ 使用整數型別綁定

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => '刪除成功']);
    } else {
        echo json_encode(['success' => false, 'message' => '查無資料或已被刪除']);
    }
} else {
    echo json_encode(['success' => false, 'message' => '刪除失敗: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
