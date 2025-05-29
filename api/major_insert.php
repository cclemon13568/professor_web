<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$teacher_id = $_POST['teacher_ID'] ?? '';
$major = $_POST['major'] ?? '';

if (empty($teacher_id) || empty($major)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 與 major 為必填"]);
    exit;
}

// 產生新的 id（從目前最大 id +1）
$query = "SELECT MAX(CAST(id AS UNSIGNED)) AS max_id FROM teacher_major";
$result = $conn->query($query);

$new_id = '001'; // 預設值
if ($result && $row = $result->fetch_assoc() && $row['max_id']) {
    $max_id = (int)$row['max_id'];
    $next_id = $max_id + 1;
    if ($next_id > 99999) {
        echo json_encode(["success" => false, "message" => "超出可用 ID 上限"]);
        exit;
    }
    $new_id = str_pad($next_id, 3, '0', STR_PAD_LEFT);
}

// 執行新增
$sql = "INSERT INTO teacher_major (id, teacher_ID, major) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $new_id, $teacher_id, $major);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "新增成功", "new_id" => $new_id]);
} else {
    echo json_encode(["success" => false, "message" => "新增失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
