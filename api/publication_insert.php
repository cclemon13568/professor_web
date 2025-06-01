<?php 
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$teacher_id    = $_POST['teacher_ID'] ?? '';
$paper_topic   = $_POST['paper_topic'] ?? '';
$paper_authors = $_POST['paper_authors'] ?? '';
$paper_year    = $_POST['paper_year'] ?? '';

// ✅ 檢查必要欄位
if (empty($teacher_id) || empty($paper_topic)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 與 paper_topic 為必填"]);
    exit;
}

// ✅ 產生新的純數字 paper_ID（char 型別）
$query = "SELECT MAX(CAST(paper_ID AS UNSIGNED)) AS max_id FROM paper_info";
$result = $conn->query($query);
$next_id = 1;
if ($result && $row = $result->fetch_assoc()) {
    $next_id = ((int)($row['max_id'])) + 1;
}
$paper_id = (string)$next_id; // 轉字串對應 char(15)

// ✅ 插入 paper_info
$sql_info = "INSERT INTO paper_info (paper_ID, paper_topic, paper_authors, paper_year) VALUES (?, ?, ?, ?)";
$stmt_info = $conn->prepare($sql_info);
$stmt_info->bind_param("ssss", $paper_id, $paper_topic, $paper_authors, $paper_year);

if (!$stmt_info->execute()) {
    echo json_encode(["success" => false, "message" => "新增 paper_info 失敗：" . $stmt_info->error]);
    exit;
}
$stmt_info->close();

// ✅ 插入 publication 關聯
$sql_pub = "INSERT INTO publication (teacher_ID, paper_ID) VALUES (?, ?)";
$stmt_pub = $conn->prepare($sql_pub);
$stmt_pub->bind_param("ss", $teacher_id, $paper_id);

if ($stmt_pub->execute()) {
    echo json_encode(["success" => true, "message" => "新增成功", "paper_ID" => $paper_id]);
} else {
    echo json_encode(["success" => false, "message" => "新增 publication 失敗：" . $stmt_pub->error]);
}
$stmt_pub->close();
$conn->close();
?>
