<?php 
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$teacher_id = $_GET['teacher_ID'] ?? '';
if (empty($teacher_id)) {
    echo json_encode(["success" => false, "message" => "請提供 teacher_ID"]);
    exit;
}

$response = ["teacher_ID" => $teacher_id];

// ✅ 校內經歷
$campus_sql = "SELECT id, experience FROM campus_experience WHERE teacher_ID = ?";
$stmt = $conn->prepare($campus_sql);
$stmt->bind_param("s", $teacher_id);
$stmt->execute();
$result = $stmt->get_result();
$response["campus_experience"] = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// ✅ 校外經歷
$external_sql = "SELECT id, experience FROM external_experience WHERE teacher_ID = ?";
$stmt = $conn->prepare($external_sql);
$stmt->bind_param("s", $teacher_id);
$stmt->execute();
$result = $stmt->get_result();
$response["external_experience"] = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// ✅ 論文資訊（publication + paper_info，移除 paper_link）
$pub_sql = "
    SELECT p.paper_ID, p.paper_topic, p.paper_authors, p.paper_year
    FROM publication pub
    JOIN paper_info p ON pub.paper_ID = p.paper_ID
    WHERE pub.teacher_ID = ?
";
$stmt = $conn->prepare($pub_sql);
$stmt->bind_param("s", $teacher_id);
$stmt->execute();
$result = $stmt->get_result();
$response["publications"] = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// ✅ 研究計畫（participation + project_info，移除 project_proof）
$project_sql = "
    SELECT pj.project_ID, pj.project_role, pj.project_period, pj.project_organization
    FROM participation pa
    JOIN project_info pj ON pa.project_ID = pj.project_ID
    WHERE pa.teacher_ID = ?
";
$stmt = $conn->prepare($project_sql);
$stmt->bind_param("s", $teacher_id);
$stmt->execute();
$result = $stmt->get_result();
$response["projects"] = $result->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode(["success" => true, "data" => $response], JSON_UNESCAPED_UNICODE);
$conn->close();
?>
