<?php
$host = 'localhost';// 主機位址
$dbname = 'D1249166';// 資料庫名稱
$user = 'D1249166';// 帳號
$pass = '#3PPnntjK';// 密碼

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // 錯誤模式：丟出例外
} catch (PDOException $e) {
    die("DB connection failed: " . $e->getMessage()); // 若連線失敗，顯示錯誤訊息並停止執行
}
?>
