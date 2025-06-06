<?php
// 關閉 HTML 錯誤輸出避免污染 JSON
ini_set('display_errors', 1);

include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 支援接收 application/json 格式的輸入
if ($_SERVER['CONTENT_TYPE'] === 'application/json') {
    $_POST = json_decode(file_get_contents('php://input'), true) ?? [];
}

// 取得輸入資料
$teacher_id = $_POST['teacher_ID'] ?? '';
$major = $_POST['major'] ?? '';
$id = $_POST['id'] ?? null; // optional

if (empty($teacher_id) || empty($major)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 與 major 為必填"]);
    exit;
}

// 若未提供 id，則從目前最大值 +1
if (empty($id)) {
    $query = "SELECT MAX(id) AS max_id FROM teacher_major";
    $result = $conn->query($query);

    $id = 1; // 預設從 1 開始
    if ($result && $row = $result->fetch_assoc()) {
        $max_id = (int)($row['max_id'] ?? 0);
        $id = $max_id + 1;
        if ($id > 99999) {
            echo json_encode(["success" => false, "message" => "超出可用 ID 上限"]);
            exit;
        }
    }
} else {
    $id = (int)$id; // 強制轉為整數
}

// ✅ 執行新增
$sql = "INSERT INTO teacher_major (id, teacher_ID, major) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iss", $id, $teacher_id, $major);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "新增成功",
        "new_id" => $id
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "新增失敗：" . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
