<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$id = $_POST['id'] ?? '';
$degree = $_POST['degree'] ?? '';

if (!is_numeric($id)) {
    echo json_encode(["success" => false, "message" => "缺少或無效的 id"]);
    exit;
}
if (empty($degree)) {
    echo json_encode(["success" => false, "message" => "degree 為必填"]);
    exit;
}
$id = (int)$id;

$sql = "UPDATE teacher_degree SET degree = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $degree, $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "更新成功"]);
    } else {
        echo json_encode(["success" => false, "message" => "查無此 id 或資料未變更"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "更新失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
