<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$project_ID = $_POST['project_ID'] ?? '';
$project_role = $_POST['project_role'] ?? '';
$project_period = $_POST['project_period'] ?? '';
$project_organization = $_POST['project_organization'] ?? '';
$project_proof = $_POST['project_proof'] ?? '';

if (empty($project_ID)) {
    echo json_encode(["success" => false, "message" => "project_ID 為必填"]);
    exit;
}

$sql = "UPDATE project_info SET project_role = ?, project_period = ?, project_organization = ?, project_proof = ? WHERE project_ID = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssss", $project_role, $project_period, $project_organization, $project_proof, $project_ID);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "更新成功"]);
} else {
    echo json_encode(["success" => false, "message" => "更新失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
