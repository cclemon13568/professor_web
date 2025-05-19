<!-- 面談 -->
<?php
require 'db.php';
header('Content-Type: application/json');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        // 新增或更新面談紀錄
        $data = json_decode(file_get_contents("php://input"), true);

        // 欄位檢查
        if (!$data || !isset($data['appointment_id'], $data['summary'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid or missing data']);
            exit;
        }

       try {
            // 檢查是否已經有面談紀錄
            $stmt = $pdo->prepare("SELECT * FROM interviews WHERE appointment_id = ?");
            $stmt->execute([$data['appointment_id']]);
            $exists = $stmt->fetch();

            if ($exists) {
                // 若已有資料更新面談紀錄
                $stmt = $pdo->prepare("UPDATE interviews SET summary = ? WHERE appointment_id = ?");
                $stmt->execute([
                    $data['summary'],
                    $data['appointment_id']
                ]);
                $msg = "Interview updated";
            } else {
                // 若無資料檢查是否有提供 teacher_id 再插入
                if (!isset($data['teacher_id'])) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing teacher_id for insert']);
                    exit;
                }
                // 新增面談紀錄
                $stmt = $pdo->prepare("INSERT INTO interviews (teacher_id, appointment_id, summary) VALUES (?, ?, ?)");
                $stmt->execute([
                    $data['teacher_id'],
                    $data['appointment_id'],
                    $data['summary']
                ]);
                $msg = "Interview created";
            }

            // 更新預約狀態為「已完成」
            $pdo->prepare("UPDATE appointments SET status = '已完成' WHERE appointment_id = ?")
                ->execute([$data['appointment_id']]);

            echo json_encode(['status' => $msg]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
        break;

    case 'GET':
        // 查詢所有面談紀錄
        try {
            $stmt = $pdo->query("SELECT * FROM interviews");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
        break;
}
?>
