<?php 
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

// ✅ 解析 JSON 輸入
$input = json_decode(file_get_contents('php://input'), true);

// ✅ 接收參數
$paper_id      = $input['paper_ID'] ?? '';
$paper_topic   = $input['paper_topic'] ?? null;
$paper_authors = $input['paper_authors'] ?? null;
$paper_year    = $input['paper_year'] ?? null;

// ✅ 檢查必要欄位
if (empty($paper_id)) {
    echo json_encode(["success" => false, "message" => "paper_ID 為必填"]);
    exit;
}

// ✅ 查詢現有資料
$query = "SELECT paper_topic, paper_authors, paper_year FROM paper_info WHERE paper_ID = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $paper_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "找不到指定的 paper_ID"]);
    $stmt->close();
    $conn->close();
    exit;
}

$current = $result->fetch_assoc();
$stmt->close();

// ✅ 合併資料（未提供欄位就保留原值）
$paper_topic   = $paper_topic   !== null ? $paper_topic   : $current['paper_topic'];
$paper_authors = $paper_authors !== null ? $paper_authors : $current['paper_authors'];
$paper_year    = $paper_year    !== null ? $paper_year    : $current['paper_year'];

// ✅ 執行更新
$update_sql = "UPDATE paper_info SET paper_topic = ?, paper_authors = ?, paper_year = ? WHERE paper_ID = ?";
$update_stmt = $conn->prepare($update_sql);
$update_stmt->bind_param("ssss", $paper_topic, $paper_authors, $paper_year, $paper_id);

if ($update_stmt->execute()) {
    echo json_encode(["success" => true, "message" => "更新成功"]);
} else {
    echo json_encode(["success" => false, "message" => "更新失敗：" . $update_stmt->error]);
}

$update_stmt->close();
$conn->close();
?>
