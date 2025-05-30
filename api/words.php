<?php
// 只放函式，不輸出任何 header 或 JSON
function checkSensitiveWords($conn, $text) {
    $matched = [];
    $sql = "SELECT word FROM sensitive_words";
    $result = $conn->query($sql);

    while ($row = $result->fetch_assoc()) {
        $word = $row['word'];
        if (stripos($text, $word) !== false) {
            $matched[] = $word;
        }
    }
    return $matched;
}