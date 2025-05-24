<?php
require_once('config/db.php'); // 應包含 $pdo 變數

if (isset($pdo)) {
    echo "✅ PDO 資料庫連線成功！";
} else {
    echo "❌ 連線失敗，檢查 db.php 設定";
}
?>
