<?php
// 關閉 PHP 預設錯誤輸出，避免污染 JSON 輸出
ini_set('display_errors', 0);

include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 如果是 JSON 輸入，從 php://input 解析 JSON
if ($_SERVER['CONTENT_TYPE'] === 'application/json') {
    $_POST = json_decode(file_get_contents('php://input'), true) ?? [];
}

// 接收資料
$id       = $_POST['teacher_ID']       ?? '';
$name     = $_POST['teacher_name']     ?? '';
$email    = $_POST['teacher_email']    ?? '';
$intro    = $_POST['teacher_intro']    ?? '';
$location = $_POST['office_location']  ?? '';
$hours    = $_POST['office_hours']     ?? '';

// ✅ 檢查 teacher_ID 不可為空
if (empty($id)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 不可為空"]);
    exit;
}

// ✅ 使用 prepared statement 防止 SQL injection
$sql = "INSERT INTO personal_info (teacher_ID, teacher_name, teacher_email, teacher_intro, office_location, office_hours)
        VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssss", $id, $name, $email, $intro, $location, $hours);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "新增成功"]);
} else {
    echo json_encode(["success" => false, "message" => "新增失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
