<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// 取得 major_ID（從 POST 傳入）
$major_ID = $_POST['major_ID'] ?? '';
if (!$major_ID) {
    echo json_encode(['success' => false, 'message' => '缺少 major_ID']);
    exit;
}

// 預備語句進行刪除
$stmt = $conn->prepare("DELETE FROM teacher_major WHERE major_ID = ?");
$stmt->bind_param("s", $major_ID);

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
