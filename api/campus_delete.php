<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$id = $_POST['id'] ?? '';

if (!is_numeric($id)) {
    echo json_encode(['success' => false, 'message' => '缺少或無效的 id']);
    exit;
}
$id = (int)$id;

$stmt = $conn->prepare("DELETE FROM campus_experience WHERE id = ?");
$stmt->bind_param("i", $id);

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
