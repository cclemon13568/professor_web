<?php
$conn = new mysqli('localhost', '帳號', '密碼', '資料庫名稱');
if ($conn->connect_error) {
    die("連線失敗: " . $conn->connect_error);
}

$teacher_id = $_GET['teacher_ID']; // 例如: ?teacher_ID=T_123456

$sql = "SELECT * FROM teacher_info WHERE teacher_ID = '$teacher_id'";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $data = $result->fetch_assoc();
    echo json_encode($data);
} else {
    echo json_encode(["error" => "找不到資料"]);
}

$conn->close();
?>
