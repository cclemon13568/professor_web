<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 解析 JSON 輸入
$input = json_decode(file_get_contents('php://input'), true);

// ✅ 取得資料
$id = $input['id'] ?? '';
$experience = $input['experience'] ?? '';

// ✅ 驗證欄位
if (!is_numeric($id)) {
    echo json_encode(['success' => false, 'message' => '缺少或無效的 id']);
    exit;
}
if (empty($experience)) {
    echo json_encode(['success' => false, 'message' => 'experience 為必填']);
    exit;
}
$id = (int)$id;

// ✅ 執行更新
$sql = "UPDATE external_experience SET experience = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $experience, $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => '更新成功']);
    } else {
        echo json_encode(['success' => false, 'message' => '查無此 id 或資料未變更']);
    }
} else {
    echo json_encode(['success' => false, 'message' => '更新失敗: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
