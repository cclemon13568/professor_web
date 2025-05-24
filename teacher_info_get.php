<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// 檢查是否有傳入 teacher_ID
$teacher_id = $_GET['teacher_ID'] ?? '';

if ($teacher_id === '') {
    echo json_encode(["error" => "請提供 teacher_ID"]);
    exit;
}

$sql = "SELECT * FROM personal_info WHERE teacher_ID = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $teacher_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $data = $result->fetch_assoc();
    echo json_encode($data);
} else {
    echo json_encode(["error" => "找不到資料"]);
}

$stmt->close();
$conn->close();
?>
