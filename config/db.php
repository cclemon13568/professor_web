<?php
$host = '127.0.0.1';
$dbname = 'professor_db';
$user = 'root';
$pass = '';

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    die("資料庫連線失敗：" . $conn->connect_error);
}
$conn->set_charset("utf8mb4");
?>