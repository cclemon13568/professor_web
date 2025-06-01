<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$project_ID = $_POST['project_ID'] ?? '';
$project_role = $_POST['project_role'] ?? null;
$project_period = $_POST['project_period'] ?? null;
$project_organization = $_POST['project_organization'] ?? null;

// ✅ 檢查 project_ID 是否提供
if (empty($project_ID)) {
    echo json_encode(["success" => false, "message" => "project_ID 為必填"]);
    exit;
}

// ✅ 從資料庫撈出原本的值
$query = "SELECT project_role, project_period, project_organization FROM project_info WHERE project_ID = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $project_ID);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "找不到指定的 project_ID"]);
    $stmt->close();
    $conn->close();
    exit;
}

$original = $result->fetch_assoc();
$stmt->close();

// ✅ 若未填入的欄位，就用原始值補上
$project_role = $project_role ?? $original['project_role'];
$project_period = $project_period ?? $original['project_period'];
$project_organization = $project_organization ?? $original['project_organization'];

// ✅ 執行更新
$update_sql = "UPDATE project_info SET project_role = ?, project_period = ?, project_organization = ? WHERE project_ID = ?";
$update_stmt = $conn->prepare($update_sql);
$update_stmt->bind_param("ssss", $project_role, $project_period, $project_organization, $project_ID);

if ($update_stmt->execute()) {
    echo json_encode(["success" => true, "message" => "更新成功"]);
} else {
    echo json_encode(["success" => false, "message" => "更新失敗：" . $update_stmt->error]);
}

$update_stmt->close();
$conn->close();
?>
