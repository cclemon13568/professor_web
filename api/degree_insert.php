<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 解析 JSON 輸入
$input = json_decode(file_get_contents('php://input'), true);

// ✅ 取得參數
$teacher_id = $input['teacher_ID'] ?? '';
$degree = $input['degree'] ?? '';
$id = $input['id'] ?? null;

// ✅ 驗證欄位
if (empty($teacher_id) || empty($degree)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 與 degree 為必填"]);
    exit;
}

// ✅ 若未提供 id，自動產生
if (empty($id)) {
    $query = "SELECT MAX(id) AS max_id FROM teacher_degree";
    $result = $conn->query($query);
    $id = 1;
    if ($result && $row = $result->fetch_assoc()) {
        $max_id = (int)($row['max_id'] ?? 0);
        $id = $max_id + 1;
        if ($id > 99999) {
            echo json_encode(["success" => false, "message" => "超出可用 ID 上限"]);
            exit;
        }
    }
} else {
    $id = (int)$id;
}

// ✅ 執行新增
$sql = "INSERT INTO teacher_degree (id, teacher_ID, degree) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iss", $id, $teacher_id, $degree);

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
