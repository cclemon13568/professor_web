<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// 必須提供 teacher_ID 作為更新對象
$id = $_POST['teacher_ID'] ?? '';
if (empty($id)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 不可為空"]);
    exit;
}

// 🔍 先確認該 teacher_ID 是否存在
$check_stmt = $conn->prepare("SELECT 1 FROM personal_info WHERE teacher_ID = ?");
$check_stmt->bind_param("s", $id);
$check_stmt->execute();
$check_stmt->store_result();

if ($check_stmt->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "找不到該 teacher_ID"]);
    $check_stmt->close();
    $conn->close();
    exit;
}
$check_stmt->close();

// 允許更新的欄位清單
$fields = [
    'teacher_name',
    'teacher_email',
    'teacher_intro',
    'office_location',
    'office_hours'
];

// 組合要更新的欄位與值
$updates = [];
$params = [];
$types = '';

foreach ($fields as $field) {
    if (isset($_POST[$field])) {
        $updates[] = "$field = ?";
        $params[] = $_POST[$field];
        $types .= 's'; // 全部欄位都是 string
    }
}

if (empty($updates)) {
    echo json_encode(["success" => false, "message" => "沒有提供要更新的欄位"]);
    exit;
}

// 加入 teacher_ID 作為 WHERE 條件
$sql = "UPDATE personal_info SET " . implode(", ", $updates) . " WHERE teacher_ID = ?";
$params[] = $id;
$types .= 's';

// 執行 prepared statement
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "更新成功"]);
} else {
    echo json_encode(["success" => false, "message" => "更新失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
