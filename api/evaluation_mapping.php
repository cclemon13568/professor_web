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
        $conditions = [];
        $params = [];
        $types = '';

        if (isset($_GET['course_ID'])) {
            $conditions[] = "course_ID = ?";
            $params[] = $_GET['course_ID'];
            $types .= 's';
        }

        if (isset($_GET['evaluate_ID'])) {
            $conditions[] = "evaluate_ID = ?";
            $params[] = $_GET['evaluate_ID'];
            $types .= 's';
        }

        if (!empty($conditions)) {
            $sql = "SELECT * FROM evaluation_mapping WHERE " . implode(" AND ", $conditions);
            $stmt = mysqli_prepare($conn, $sql);

            if ($stmt) {
                mysqli_stmt_bind_param($stmt, $types, ...$params);
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
                http_response_code(500);
                echo json_encode(['error' => 'SQL 準備失敗']);
            }
        } else {
            // 無參數：查詢所有資料
            $result = mysqli_query($conn, "SELECT * FROM evaluation_mapping");
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

        if (!$data || !isset($data['course_ID'], $data['evaluate_ID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'course_ID 與 evaluate_ID 為必填']);
            exit;
        }

        $course_ID = $data['course_ID'];
        $evaluate_ID = $data['evaluate_ID'];

        // 檢查是否已存在
        $check_sql = "SELECT * FROM evaluation_mapping WHERE course_ID = ? AND evaluate_ID = ?";
        $check_stmt = mysqli_prepare($conn, $check_sql);
        mysqli_stmt_bind_param($check_stmt, "ss", $course_ID, $evaluate_ID);
        mysqli_stmt_execute($check_stmt);
        $result = mysqli_stmt_get_result($check_stmt);

        if (mysqli_fetch_assoc($result)) {
            echo json_encode(['success' => false, 'message' => '該對應關係已存在']);
            exit;
        }

        $insert_sql = "INSERT INTO evaluation_mapping (course_ID, evaluate_ID) VALUES (?, ?)";
        $insert_stmt = mysqli_prepare($conn, $insert_sql);
        mysqli_stmt_bind_param($insert_stmt, "ss", $course_ID, $evaluate_ID);

        if (mysqli_stmt_execute($insert_stmt)) {
            echo json_encode(['success' => true, 'message' => '新增成功']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => '資料庫新增失敗', 'error' => mysqli_error($conn)]);
        }
        break;

    case 'DELETE':
        if (empty($_GET['course_ID']) || empty($_GET['evaluate_ID'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'course_ID 與 evaluate_ID 為必填']);
            exit;
        }

        $course_ID = $_GET['course_ID'];
        $evaluate_ID = $_GET['evaluate_ID'];

        // 先檢查資料是否存在
        $check_stmt = mysqli_prepare($conn, "SELECT * FROM evaluation_mapping WHERE course_ID = ? AND evaluate_ID = ?");
        mysqli_stmt_bind_param($check_stmt, "ss", $course_ID, $evaluate_ID);
        mysqli_stmt_execute($check_stmt);
        $check_result = mysqli_stmt_get_result($check_stmt);

        if (mysqli_num_rows($check_result) === 0) {
            echo json_encode(['success' => false, 'message' => '該值不存在']);
            exit;
        }

        // 資料存在，進行刪除
        $stmt = mysqli_prepare($conn, "DELETE FROM evaluation_mapping WHERE course_ID = ? AND evaluate_ID = ?");
        mysqli_stmt_bind_param($stmt, "ss", $course_ID, $evaluate_ID);

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
