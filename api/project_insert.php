<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$teacher_id = $_POST['teacher_ID'] ?? '';
$project_ID = $_POST['project_ID'] ?? '';
$project_role = $_POST['project_role'] ?? '';
$project_period = $_POST['project_period'] ?? '';
$project_organization = $_POST['project_organization'] ?? '';
$project_proof = $_POST['project_proof'] ?? '';

if (empty($teacher_id) || empty($project_ID)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 與 project_ID 為必填"]);
    exit;
}

// ➤ 插入 project_info（避免重複）
$sql_info = "INSERT IGNORE INTO project_info (project_ID, project_role, project_period, project_organization, project_proof)
             VALUES (?, ?, ?, ?, ?)";
$stmt_info = $conn->prepare($sql_info);
$stmt_info->bind_param("sssss", $project_ID, $project_role, $project_period, $project_organization, $project_proof);
$stmt_info->execute();
$stmt_info->close();

// ➤ 插入 participation
$sql_part = "INSERT INTO participation (teacher_ID, project_ID) VALUES (?, ?)";
$stmt_part = $conn->prepare($sql_part);
$stmt_part->bind_param("ss", $teacher_id, $project_ID);

if ($stmt_part->execute()) {
    echo json_encode(["success" => true, "message" => "新增成功"]);
} else {
    echo json_encode(["success" => false, "message" => "新增失敗：" . $stmt_part->error]);
}

$stmt_part->close();
$conn->close();
?>
