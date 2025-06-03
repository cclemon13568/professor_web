<?php 
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 解析 JSON 輸入
$input = json_decode(file_get_contents('php://input'), true);

// ✅ 取得參數
$teacher_id = $input['teacher_ID'] ?? '';
$project_ID = $input['project_ID'] ?? '';
$project_role = $input['project_role'] ?? '';
$project_period = $input['project_period'] ?? '';
$project_organization = $input['project_organization'] ?? '';

// ✅ 驗證必要欄位
if (empty($teacher_id) || empty($project_ID)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 與 project_ID 為必填"]);
    exit;
}

// ✅ 插入 project_info（若該 project_ID 已存在就略過）
$sql_info = "INSERT IGNORE INTO project_info (project_ID, project_role, project_period, project_organization)
             VALUES (?, ?, ?, ?)";
$stmt_info = $conn->prepare($sql_info);
$stmt_info->bind_param("ssss", $project_ID, $project_role, $project_period, $project_organization);
$stmt_info->execute();
$stmt_info->close();

// ✅ 插入 participation 關聯
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
