<?php 
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

$teacher_id = $_GET['teacher_ID'] ?? '';
$teacher_name = $_GET['teacher_name'] ?? '';

if (empty($teacher_id) && empty($teacher_name)) {
    // ✅ 沒有輸入任何參數 → 回傳所有 teacher_name
    $sql = "SELECT teacher_ID, teacher_name FROM personal_info";
    $result = $conn->query($sql);

    $names = [];
    while ($row = $result->fetch_assoc()) {
        $names[] = $row;
    }

    echo json_encode([
        "success" => true,
        "message" => "教師列表",
        "teachers" => $names
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    $conn->close();
    exit;
}

// ✅ 有提供 teacher_ID 或 teacher_name → 查詢該筆教師資料
if (!empty($teacher_id)) {
    $sql = "SELECT * FROM personal_info WHERE teacher_ID = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $teacher_id);
} else {
    $sql = "SELECT * FROM personal_info WHERE teacher_name = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $teacher_name);
}

$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $data = $result->fetch_assoc();
    $teacher_id = $data['teacher_ID']; // 確保有 teacher_ID 可供查詢子表格

    // ✅ teacher_major（專長）
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

    // ✅ teacher_degree（學歷）
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

    echo json_encode([
        "success" => true,
        "data" => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} else {
    echo json_encode(["success" => false, "message" => "找不到對應的教師資料"]);
}

$stmt->close();
$conn->close();
?>
