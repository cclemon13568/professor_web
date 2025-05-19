<?php
$conn = new mysqli('localhost', '帳號', '密碼', '資料庫名稱');
if ($conn->connect_error) {
    die("連線失敗: " . $conn->connect_error);
}

$teacher_id = $_POST['teacher_ID'];
$name = $_POST['teacher_name'];
$email = $_POST['teacher_email'];
$intro = $_POST['teacher_intro'];

$sql = "UPDATE teacher_info 
        SET teacher_name = '$name', teacher_email = '$email', teacher_intro = '$intro'
        WHERE teacher_ID = '$teacher_id'";

if ($conn->query($sql)) {
    echo json_encode(["success" => true, "message" => "更新成功"]);
} else {
    echo json_encode(["success" => false, "message" => $conn->error]);
}

$conn->close();
?>
