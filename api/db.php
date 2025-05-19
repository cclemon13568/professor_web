<?php
$host = 'localhost';// 主機位址
$dbname = 'your_database_name';// 資料庫名稱
$user = 'your_username';// 帳號
$pass = 'your_password';// 密碼

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // 錯誤模式：丟出例外
} catch (PDOException $e) {
    die("DB connection failed: " . $e->getMessage()); // 若連線失敗，顯示錯誤訊息並停止執行
}
?>
