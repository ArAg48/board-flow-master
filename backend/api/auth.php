<?php
// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once '../includes/auth.php';

$auth = new Auth();
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            $action = $input['action'] ?? '';

            switch ($action) {
                case 'login':
                    // Enhanced input validation
                    $username = $input['username'] ?? '';
                    $password = $input['password'] ?? '';

                    if (empty($username) || empty($password)) {
                        throw new Exception('Username and password are required');
                    }
                    
                    // Sanitize inputs
                    $username = filter_var(trim($username), FILTER_SANITIZE_STRING);
                    
                    // Validate input lengths
                    if (strlen($username) < 3 || strlen($username) > 50 || strlen($password) < 6 || strlen($password) > 100) {
                        throw new Exception('Invalid username or password format');
                    }

                    $user = $auth->authenticateUser($username, $password);
                    if ($user) {
                        $token = $auth->generateJWT($user['id'], $user['role']);
                        echo json_encode([
                            'success' => true,
                            'user' => $user,
                            'token' => $token
                        ]);
                    } else {
                        throw new Exception('Invalid credentials');
                    }
                    break;

                case 'create_user':
                    // Enhanced input validation for user creation
                    $required_fields = ['username', 'password', 'first_name', 'last_name', 'role'];
                    foreach ($required_fields as $field) {
                        if (!isset($input[$field]) || empty(trim($input[$field]))) {
                            throw new Exception("Field '{$field}' is required");
                        }
                    }
                    
                    // Sanitize inputs
                    $username = filter_var(trim($input['username']), FILTER_SANITIZE_STRING);
                    $firstName = filter_var(trim($input['first_name']), FILTER_SANITIZE_STRING);
                    $lastName = filter_var(trim($input['last_name']), FILTER_SANITIZE_STRING);
                    $role = filter_var(trim($input['role']), FILTER_SANITIZE_STRING);
                    $password = $input['password'];
                    $cwStamp = isset($input['cw_stamp']) ? filter_var(trim($input['cw_stamp']), FILTER_SANITIZE_STRING) : null;
                    
                    // Validate role
                    if (!in_array($role, ['manager', 'technician'])) {
                        throw new Exception('Invalid role specified');
                    }

                    $userId = $auth->createUserAccount($username, $password, $firstName, $lastName, $role, $cwStamp);
                    echo json_encode([
                        'success' => true,
                        'user_id' => $userId,
                        'message' => 'User created successfully'
                    ]);
                    break;

                case 'get_users':
                    $users = $auth->getUserProfiles();
                    echo json_encode([
                        'success' => true,
                        'users' => $users
                    ]);
                    break;

                case 'toggle_user_status':
                    $userId = $input['user_id'] ?? '';
                    $result = $auth->toggleUserStatus($userId);
                    echo json_encode([
                        'success' => $result,
                        'message' => $result ? 'User status updated' : 'Failed to update user status'
                    ]);
                    break;

                case 'update_password':
                    $userId = $input['user_id'] ?? '';
                    $newPassword = $input['new_password'] ?? '';
                    $result = $auth->updateUserPassword($userId, $newPassword);
                    echo json_encode([
                        'success' => $result,
                        'message' => $result ? 'Password updated' : 'Failed to update password'
                    ]);
                    break;

                case 'delete_user':
                    $userId = $input['user_id'] ?? '';
                    $result = $auth->deleteUserAccount($userId);
                    echo json_encode([
                        'success' => $result,
                        'message' => $result ? 'User deleted' : 'Failed to delete user'
                    ]);
                    break;

                case 'verify_token':
                    $token = $input['token'] ?? '';
                    $payload = $auth->verifyJWT($token);
                    if ($payload) {
                        echo json_encode([
                            'success' => true,
                            'user_id' => $payload['user_id'],
                            'role' => $payload['role']
                        ]);
                    } else {
                        throw new Exception('Invalid or expired token');
                    }
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