<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$paper_id      = $_POST['paper_ID'] ?? '';
$paper_topic   = $_POST['paper_topic'] ?? '';
$paper_authors = $_POST['paper_authors'] ?? '';
$paper_year    = $_POST['paper_year'] ?? '';
$paper_link    = $_POST['paper_link'] ?? '';

if (empty($paper_id)) {
    echo json_encode(["success" => false, "message" => "paper_ID 為必填"]);
    exit;
}

$sql = "UPDATE paper_info SET paper_topic = ?, paper_authors = ?, paper_year = ?, paper_link = ? WHERE paper_ID = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssss", $paper_topic, $paper_authors, $paper_year, $paper_link, $paper_id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "更新成功"]);
} else {
    echo json_encode(["success" => false, "message" => "更新失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
