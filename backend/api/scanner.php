<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../includes/scanner.php';
require_once '../includes/auth.php';

$scanner = new Scanner();
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
            $action = $_GET['action'] ?? '';
            
            switch ($action) {
                case 'lookup_board':
                    $qrCode = $_GET['qr_code'] ?? '';
                    if (!$qrCode) {
                        throw new Exception('QR code is required');
                    }
                    $result = $scanner->lookupBoardDetails($qrCode);
                    echo json_encode(['success' => true, 'data' => $result]);
                    break;

                case 'count_boards':
                    $ptlOrderId = $_GET['ptl_order_id'] ?? '';
                    if (!$ptlOrderId) {
                        throw new Exception('PTL order ID is required');
                    }
                    $result = $scanner->countScannedBoards($ptlOrderId);
                    echo json_encode(['success' => true, 'data' => $result]);
                    break;

                case 'active_session':
                    $userId = $_GET['user_id'] ?? $user['user_id'];
                    $result = $scanner->getActiveSessionForUser($userId);
                    echo json_encode(['success' => true, 'data' => $result]);
                    break;

                case 'scan_history':
                    $technicianId = $_GET['technician_id'] ?? null;
                    if ($user['role'] !== 'manager' && $technicianId && $technicianId !== $user['user_id']) {
                        throw new Exception('Access denied');
                    }
                    $result = $scanner->getScanHistory($technicianId);
                    echo json_encode(['success' => true, 'data' => $result]);
                    break;

                default:
                    throw new Exception('Invalid action');
            }
            break;

        case 'POST':
            $action = $input['action'] ?? '';

            switch ($action) {
                case 'save_board_scan':
                    $data = $input['data'] ?? [];
                    $data['technician_id'] = $user['user_id'];
                    $id = $scanner->saveBoardScan($data);
                    echo json_encode(['success' => true, 'id' => $id, 'message' => 'Board scan saved']);
                    break;

                case 'save_session':
                    $sessionId = $input['session_id'] ?? '';
                    $ptlOrderId = $input['ptl_order_id'] ?? '';
                    $sessionData = $input['session_data'] ?? [];
                    $status = $input['status'] ?? 'active';
                    $pausedAt = $input['paused_at'] ?? null;
                    $breakStartedAt = $input['break_started_at'] ?? null;

                    $id = $scanner->saveSession(
                        $sessionId, 
                        $user['user_id'], 
                        $ptlOrderId, 
                        $sessionData, 
                        $status, 
                        $pausedAt, 
                        $breakStartedAt
                    );
                    echo json_encode(['success' => true, 'session_id' => $id, 'message' => 'Session saved']);
                    break;

                case 'deactivate_session':
                    $sessionId = $input['session_id'] ?? '';
                    if (!$sessionId) {
                        throw new Exception('Session ID is required');
                    }
                    $result = $scanner->deactivateSession($sessionId);
                    echo json_encode([
                        'success' => $result,
                        'message' => $result ? 'Session deactivated' : 'Failed to deactivate session'
                    ]);
                    break;

                default:
                    throw new Exception('Invalid action');
            }
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