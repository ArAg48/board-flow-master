<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../includes/orders.php';
require_once '../includes/auth.php';

$orders = new Orders();
$auth = new Auth();
$input = json_decode(file_get_contents('php://input'), true);

// Verify authentication
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

if (!$token) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authorization token required']);
    exit;
}

$user = $auth->verifyJWT($token);
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
    exit;
}

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $type = $_GET['type'] ?? '';
            switch ($type) {
                case 'hardware':
                    $result = $orders->getHardwareOrders();
                    break;
                case 'ptl':
                    $result = $orders->getPTLOrders();
                    break;
                case 'ptl_progress':
                    $result = $orders->getPTLOrderProgress();
                    break;
                default:
                    throw new Exception('Invalid order type');
            }
            echo json_encode(['success' => true, 'data' => $result]);
            break;

        case 'POST':
            $type = $input['type'] ?? '';
            $data = $input['data'] ?? [];
            $data['created_by'] = $user['user_id'];

            switch ($type) {
                case 'hardware':
                    $id = $orders->createHardwareOrder($data);
                    echo json_encode(['success' => true, 'id' => $id, 'message' => 'Hardware order created']);
                    break;
                case 'ptl':
                    $id = $orders->createPTLOrder($data);
                    echo json_encode(['success' => true, 'id' => $id, 'message' => 'PTL order created']);
                    break;
                default:
                    throw new Exception('Invalid order type');
            }
            break;

        case 'PUT':
            $type = $input['type'] ?? '';
            $id = $input['id'] ?? '';
            $data = $input['data'] ?? [];

            switch ($type) {
                case 'hardware':
                    $result = $orders->updateHardwareOrder($id, $data);
                    break;
                case 'ptl':
                    $result = $orders->updatePTLOrder($id, $data);
                    break;
                default:
                    throw new Exception('Invalid order type');
            }
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'Order updated successfully' : 'Failed to update order'
            ]);
            break;

        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>