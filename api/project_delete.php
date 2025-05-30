<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$project_ID = $_POST['project_ID'] ?? '';
if (empty($project_ID)) {
    echo json_encode(["success" => false, "message" => "缺少 project_ID"]);
    exit;
}

// ➤ 刪除 participation 關聯
$stmt_part = $conn->prepare("DELETE FROM participation WHERE project_ID = ?");
$stmt_part->bind_param("s", $project_ID);
$stmt_part->execute();
$stmt_part->close();

// ➤ 刪除 project_info 資料
$stmt_info = $conn->prepare("DELETE FROM project_info WHERE project_ID = ?");
$stmt_info->bind_param("s", $project_ID);

if ($stmt_info->execute()) {
    echo json_encode(["success" => true, "message" => "刪除成功"]);
} else {
    echo json_encode(["success" => false, "message" => "刪除失敗：" . $stmt_info->error]);
}

$stmt_info->close();
$conn->close();
?>
