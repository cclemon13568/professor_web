<?php
// 資料庫連線
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// 接收表單資料
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

$sql = "INSERT INTO personal_info (teacher_ID, teacher_name, teacher_email, teacher_intro, office_location, office_hours)
        VALUES ('$id', '$name', '$email', '$intro', '$location', '$hours')";

if ($conn->query($sql)) {
    echo json_encode(["success" => true, "message" => "新增成功"]);
} else {
    echo json_encode(["success" => false, "message" => $conn->error]);
}

$conn->close();
?>
