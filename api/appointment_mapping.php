<?php
include('../config/db.php');
header('Content-Type: application/json; charset=utf-8');

if (!$conn) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['appointment_ID'])) {
            $appointment_ID = $_GET['appointment_ID'];

            $stmt = mysqli_prepare($conn, "SELECT * FROM appointment_mapping WHERE appointment_ID = ?");
            mysqli_stmt_bind_param($stmt, "s", $appointment_ID);
            mysqli_stmt_execute($stmt);
            $result = mysqli_stmt_get_result($stmt);

            $mappings = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $mappings[] = $row;
            }

            if (empty($mappings)) {
                echo json_encode(['error' => '找不到資料']);
            } else {
                echo json_encode($mappings);
            }
        } else {
            $result = mysqli_query($conn, "SELECT * FROM appointment_mapping");
            $data = [];
            while ($row = mysqli_fetch_assoc($result)) {
                $data[] = $row;
            }

            if (empty($data)) {
                echo json_encode(['error' => '找不到資料']);
            } else {
                echo json_encode($data);
            }
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data || !isset($data['appointment_ID'], $data['teacher_ID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'appointment_ID 與 teacher_ID 為必填']);
            exit;
        }

        $appointment_ID = $data['appointment_ID'];
        $teacher_ID = $data['teacher_ID'];

        // 檢查是否已存在
        $check_sql = "SELECT * FROM appointment_mapping WHERE appointment_ID = ? AND teacher_ID = ?";
        $check_stmt = mysqli_prepare($conn, $check_sql);
        mysqli_stmt_bind_param($check_stmt, "ss", $appointment_ID, $teacher_ID);
        mysqli_stmt_execute($check_stmt);
        $result = mysqli_stmt_get_result($check_stmt);

        if (mysqli_fetch_assoc($result)) {
            echo json_encode(['success' => false, 'message' => '該對應關係已存在']);
            exit;
        }

        $insert_sql = "INSERT INTO appointment_mapping (teacher_ID, appointment_ID) VALUES (?, ?)";
        $insert_stmt = mysqli_prepare($conn, $insert_sql);
        mysqli_stmt_bind_param($insert_stmt, "ss", $teacher_ID, $appointment_ID);

        if (mysqli_stmt_execute($insert_stmt)) {
            echo json_encode(['success' => true, 'message' => '新增成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '資料庫新增失敗', 'error' => mysqli_error($conn)]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);

        // 檢查必要欄位是否存在
        $required_keys = ['old_appointment_ID', 'old_teacher_ID', 'new_appointment_ID', 'new_teacher_ID'];
        foreach ($required_keys as $key) {
            if (!isset($data[$key])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => '缺少必要欄位']);
                exit;
            }
        }

        // 檢查是否有多餘欄位（非允許的欄位）
        $allowed_keys = $required_keys;  // 不允許額外欄位
        foreach ($data as $key => $value) {
            if (!in_array($key, $allowed_keys)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => '沒有提供要更新的欄位']);
                exit;
            }
        }

        $old_appointment_ID = $data['old_appointment_ID'];
        $old_teacher_ID = $data['old_teacher_ID'];
        $new_appointment_ID = $data['new_appointment_ID'];
        $new_teacher_ID = $data['new_teacher_ID'];

        // 新舊值完全相同 → 不更新
        if (
            $old_appointment_ID === $new_appointment_ID &&
            $old_teacher_ID === $new_teacher_ID
        ) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '沒有提供要更新的欄位']);
            exit;
        }

        // 確認舊資料是否存在
        $check_sql = "SELECT * FROM appointment_mapping WHERE appointment_ID = ? AND teacher_ID = ?";
        $check_stmt = mysqli_prepare($conn, $check_sql);
        mysqli_stmt_bind_param($check_stmt, "ss", $old_appointment_ID, $old_teacher_ID);
        mysqli_stmt_execute($check_stmt);
        $check_result = mysqli_stmt_get_result($check_stmt);

        if (mysqli_num_rows($check_result) === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => '找不到該欄位']);
            exit;
        }

        // 執行更新
        $update_sql = "UPDATE appointment_mapping 
                    SET appointment_ID = ?, teacher_ID = ? 
                    WHERE appointment_ID = ? AND teacher_ID = ?";
        $stmt = mysqli_prepare($conn, $update_sql);
        mysqli_stmt_bind_param($stmt, "ssss", $new_appointment_ID, $new_teacher_ID, $old_appointment_ID, $old_teacher_ID);

        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => '更新成功']);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '更新失敗：' . mysqli_error($conn)
            ]);
        }
        break;

    case 'DELETE':
        if (empty($_GET['appointment_ID']) || empty($_GET['teacher_ID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'appointment_ID 與 teacher_ID 為必填']);
            exit;
        }


        $appointment_ID = $_GET['appointment_ID'];
        $teacher_ID = $_GET['teacher_ID'];

        // 先檢查資料是否存在
        $check_stmt = mysqli_prepare($conn, "SELECT * FROM appointment_mapping WHERE appointment_ID = ? AND teacher_ID = ?");
        mysqli_stmt_bind_param($check_stmt, "ss", $appointment_ID, $teacher_ID);
        mysqli_stmt_execute($check_stmt);
        $check_result = mysqli_stmt_get_result($check_stmt);

        if (mysqli_num_rows($check_result) === 0) {
            // 找不到該筆資料
            echo json_encode(['success' => false, 'message' => '該值不存在']);
            exit;
        }

        // 資料存在，進行刪除
        $stmt = mysqli_prepare($conn, "DELETE FROM appointment_mapping WHERE appointment_ID = ? AND teacher_ID = ?");
        mysqli_stmt_bind_param($stmt, "ss", $appointment_ID, $teacher_ID);

        if (mysqli_stmt_execute($stmt)) {
            echo json_encode(['success' => true, 'message' => '刪除成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '刪除失敗：' . mysqli_error($conn)]);
        }
        break;


    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}
?>
