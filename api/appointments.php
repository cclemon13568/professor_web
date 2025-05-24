<!-- 預約 -->
<?php
require 'db.php';
header('Content-Type: application/json');

$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // 查詢所有或某位學生的預約
        if (isset($_GET['student_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM appointments WHERE student_id = ?");
            $stmt->execute([$_GET['student_id']]);
        } else {
            $stmt = $pdo->query("SELECT * FROM appointments");
        }
        $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 查詢所有面談紀錄
        $stmt = $pdo->query("SELECT * FROM interviews");
        $interviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $interviewMap = [];
        foreach ($interviews as $i) {
            $interviewMap[$i['appointment_id']] = $i;
        }

        // 將每筆預約合併對應的面談資料
        foreach ($appointments as &$app) {
            $app['interview'] = $interviewMap[$app['appointment_id']] ?? null;
        }

        echo json_encode($appointments);
        break;

    case 'POST':
        // 新增預約
        $data = json_decode(file_get_contents("php://input"), true);
        
        // 欄位檢查
        if (!isset($data['appointment_id'], $data['office_location'], $data['appointment_date'], $data['status'],
                  $data['student_id'], $data['student_name'], $data['course_id'], $data['problem_description'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            exit;
        }

        // 寫入資料庫
        $stmt = $pdo->prepare("
            INSERT INTO appointments 
            (appointment_id, office_location, appointment_date, status, student_id, student_name, course_id, problem_description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['appointment_id'],
            $data['office_location'],
            $data['appointment_date'],
            $data['status'],
            $data['student_id'],
            $data['student_name'],
            $data['course_id'],
            $data['problem_description']
        ]);
        echo json_encode(['status' => 'Appointment created']);
        break;

    case 'DELETE':
        // 刪除預約
        if (!isset($_GET['appointment_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing appointment_id']);
            exit;
        }

        $appointment_id = $_GET['appointment_id'];

        // 同時刪除面談紀錄與預約資料
        $pdo->prepare("DELETE FROM interviews WHERE appointment_id = ?")->execute([$appointment_id]);
        $pdo->prepare("DELETE FROM appointments WHERE appointment_id = ?")->execute([$appointment_id]);
        echo json_encode(['status' => 'Appointment and interview deleted']);
        break;
}
?>
