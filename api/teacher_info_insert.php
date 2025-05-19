<?php
// 資料庫連線
$conn = new mysqli('localhost', '帳號', '密碼', '資料庫名稱');
if ($conn->connect_error) {
    die("連線失敗: " . $conn->connect_error);
}

// 接收表單資料
$name = $_POST['teacher_name'];
$email = $_POST['teacher_email'];
$intro = $_POST['teacher_intro'];

// 可以加其他欄位：degree, major, office_location 等

// 產生 UUID 當作 ID
$teacher_id = uniqid("T_");

// 建立 SQL 新增語句
$sql = "INSERT INTO teacher_info (teacher_ID, teacher_name, teacher_email, teacher_intro)
        VALUES ('$teacher_id', '$name', '$email', '$intro')";

if ($conn->query($sql)) {
    echo json_encode(["success" => true, "message" => "新增成功"]);
} else {
    echo json_encode(["success" => false, "message" => $conn->error]);
}

$conn->close();
?>
