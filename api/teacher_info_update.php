<?php
// 關閉 PHP 錯誤輸出以避免污染 JSON
ini_set('display_errors', 0);
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 接收 JSON 資料
if ($_SERVER['CONTENT_TYPE'] === 'application/json') {
    $_POST = json_decode(file_get_contents('php://input'), true) ?? [];
}

// ✅ 必須提供 teacher_ID 作為更新對象
$id = $_POST['teacher_ID'] ?? '';
if (empty($id)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 不可為空"]);
    exit;
}

// ✅ 確認 teacher_ID 是否存在
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

// ✅ 可更新的欄位清單
$fields = [
    'teacher_name',
    'teacher_email',
    'teacher_intro',
    'office_location',
    'office_hours'
];

// ✅ 準備更新語句
$updates = [];
$params = [];
$types = '';

foreach ($fields as $field) {
    if (isset($_POST[$field])) {
        $updates[] = "$field = ?";
        $params[] = $_POST[$field];
        $types .= 's';
    }
}

if (empty($updates)) {
    echo json_encode(["success" => false, "message" => "沒有提供要更新的欄位"]);
    exit;
}

// ✅ 加入 teacher_ID 作為 WHERE 條件
$sql = "UPDATE personal_info SET " . implode(", ", $updates) . " WHERE teacher_ID = ?";
$params[] = $id;
$types .= 's';

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);

// ✅ 執行更新
if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "更新成功"]);
} else {
    echo json_encode(["success" => false, "message" => "更新失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
?>