<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 解析 JSON 輸入
$input = json_decode(file_get_contents('php://input'), true);

// ✅ 取得參數
$teacher_id = $input['teacher_ID'] ?? '';
$experience = $input['experience'] ?? '';
$id = $input['id'] ?? null; // optional

// ✅ 驗證必要欄位
if (empty($teacher_id) || empty($experience)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 與 experience 為必填"]);
    exit;
}

// ✅ 若未提供 id，自動產生
if (empty($id)) {
    $query = "SELECT MAX(id) AS max_id FROM external_experience";
    $result = $conn->query($query);
    $id = 1;
    if ($result && $row = $result->fetch_assoc()) {
        $id = (int)($row['max_id'] ?? 0) + 1;
        if ($id > 99999) {
            echo json_encode(["success" => false, "message" => "超出可用 ID 上限"]);
            exit;
        }
    }
} else {
    $id = (int)$id;
}

// ✅ 執行新增
$sql = "INSERT INTO external_experience (id, teacher_ID, experience) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iss", $id, $teacher_id, $experience);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "新增成功", "new_id" => $id]);
} else {
    echo json_encode(["success" => false, "message" => "新增失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
