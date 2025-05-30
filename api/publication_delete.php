<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$paper_id = $_POST['paper_ID'] ?? '';
if (empty($paper_id)) {
    echo json_encode(["success" => false, "message" => "缺少 paper_ID"]);
    exit;
}

// 刪除 publication 關聯
$stmt_pub = $conn->prepare("DELETE FROM publication WHERE paper_ID = ?");
$stmt_pub->bind_param("s", $paper_id);
$stmt_pub->execute();
$stmt_pub->close();

// 刪除 paper_info
$stmt_info = $conn->prepare("DELETE FROM paper_info WHERE paper_ID = ?");
$stmt_info->bind_param("s", $paper_id);

if ($stmt_info->execute()) {
    echo json_encode(["success" => true, "message" => "刪除成功"]);
} else {
    echo json_encode(["success" => false, "message" => "刪除失敗：" . $stmt_info->error]);
}

$stmt_info->close();
$conn->close();
?>
