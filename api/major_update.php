<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// 取得 POST 資料
$id = $_POST['id'] ?? '';
$teacher_id = $_POST['teacher_ID'] ?? '';
$major = $_POST['major'] ?? '';

// ✅ 驗證必要欄位
if (!is_numeric($id)) {
    echo json_encode(["success" => false, "message" => "缺少或無效的 id"]);
    exit;
}
if (empty($teacher_id) || empty($major)) {
    echo json_encode(["success" => false, "message" => "teacher_ID 與 major 為必填"]);
    exit;
}

// ✅ 執行更新
$sql = "UPDATE teacher_major SET teacher_ID = ?, major = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssi", $teacher_id, $major, $id); // s: string, i: int

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(["success" => true, "message" => "更新成功"]);
    } else {
        echo json_encode(["success" => false, "message" => "查無此 id 或資料未變更"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "更新失敗：" . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
