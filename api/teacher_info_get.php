<?php 
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// 檢查是否有傳入 teacher_ID
$teacher_id = $_GET['teacher_ID'] ?? '';

if ($teacher_id === '') {
    echo json_encode(["error" => "請提供 teacher_ID"]);
    exit;
}

// 查詢 personal_info
$sql = "SELECT * FROM personal_info WHERE teacher_ID = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $teacher_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $data = $result->fetch_assoc();

    // 查詢 teacher_major（專長領域）
    $majors = [];
    $stmt_major = $conn->prepare("SELECT major FROM teacher_major WHERE teacher_ID = ?");
    $stmt_major->bind_param("s", $teacher_id);
    $stmt_major->execute();
    $result_major = $stmt_major->get_result();
    while ($row = $result_major->fetch_assoc()) {
        $majors[] = $row['major'];
    }
    $stmt_major->close();
    $data['majors'] = $majors;

    // 查詢 teacher_degree（學歷）
    $degrees = [];
    $stmt_degree = $conn->prepare("SELECT degree FROM teacher_degree WHERE teacher_ID = ?");
    $stmt_degree->bind_param("s", $teacher_id);
    $stmt_degree->execute();
    $result_degree = $stmt_degree->get_result();
    while ($row = $result_degree->fetch_assoc()) {
        $degrees[] = $row['degree'];
    }
    $stmt_degree->close();
    $data['degrees'] = $degrees;

    // 回傳整合資料
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} else {
    echo json_encode(["error" => "找不到資料"]);
}

$stmt->close();
$conn->close();
?>
