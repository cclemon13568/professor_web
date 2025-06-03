<?php
// 關閉 PHP 錯誤輸出到 HTML，避免汙染 JSON
ini_set('display_errors', 0);

include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 接收 JSON 輸入
if ($_SERVER['CONTENT_TYPE'] === 'application/json') {
    $_POST = json_decode(file_get_contents('php://input'), true) ?? [];
}

// ✅ 取得 teacher_ID
$teacher_id = $_POST['teacher_ID'] ?? '';
if (empty($teacher_id)) {
    echo json_encode(["success" => false, "message" => "請提供 teacher_ID"]);
    exit;
}

// ✅ 檢查相關聯的資料表
$related_tables = [
    'appointment_mapping'   => 'teacher_ID',
    'campus_experience'     => 'teacher_ID',
    'course_info'           => 'teacher_ID',
    'external_experience'   => 'teacher_ID',
    'login_info'            => 'professor_accountnumber',
    'participation'         => 'teacher_ID',
    'publication'           => 'teacher_ID',
    'teacher_degree'        => 'teacher_ID',
    'teacher_major'         => 'teacher_ID',
];

$related_counts = [];
foreach ($related_tables as $table => $column) {
    $stmt = $conn->prepare("SELECT COUNT(*) FROM `$table` WHERE `$column` = ?");
    $stmt->bind_param("s", $teacher_id);
    $stmt->execute();
    $stmt->bind_result($count);
    $stmt->fetch();
    $stmt->close();

    if ($count > 0) {
        $related_counts[$table] = $count;
    }
}

if (!empty($related_counts)) {
    $messages = [];
    foreach ($related_counts as $table => $count) {
        $messages[] = "$table 有 $count 筆資料";
    }
    echo json_encode([
        "success" => false,
        "message" => "無法刪除教師，以下資料表仍有關聯資料：",
        "details" => $messages
    ]);
    $conn->close();
    exit;
}

// ✅ 執行刪除
$stmt_delete = $conn->prepare("DELETE FROM personal_info WHERE teacher_ID = ?");
$stmt_delete->bind_param("s", $teacher_id);

if ($stmt_delete->execute()) {
    echo json_encode(["success" => true, "message" => "刪除成功"]);
} else {
    echo json_encode(["success" => false, "message" => "刪除失敗：" . $stmt_delete->error]);
}

$stmt_delete->close();
$conn->close();
