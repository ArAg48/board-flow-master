<?php
// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// Ensure errors are not output as HTML (prevents breaking JSON responses)
@ini_set('display_errors', '0');
@ini_set('html_errors', '0');
@error_reporting(0);

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once '../includes/auth.php';

try {
    $auth = new Auth();
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) { $input = array(); }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            $action = isset($input['action']) ? $input['action'] : '';

            switch ($action) {
                case 'login':
                    $username = isset($input['username']) ? $input['username'] : '';
                    $password = isset($input['password']) ? $input['password'] : '';

                    if (empty($username) || empty($password)) {
                        throw new Exception('Username and password are required');
                    }

                    $user = $auth->authenticateUser($username, $password);
                    if ($user) {
                        $token = $auth->generateJWT($user['id'], $user['role']);
                        echo json_encode(array(
                            'success' => true,
                            'user' => $user,
                            'token' => $token
                        ));
                    } else {
                        throw new Exception('Invalid credentials');
                    }
                    break;

                case 'create_user':
                    $username = isset($input['username']) ? $input['username'] : '';
                    $password = isset($input['password']) ? $input['password'] : '';
                    $firstName = isset($input['first_name']) ? $input['first_name'] : '';
                    $lastName = isset($input['last_name']) ? $input['last_name'] : '';
                    $role = isset($input['role']) ? $input['role'] : 'technician';
                    $cwStamp = isset($input['cw_stamp']) ? $input['cw_stamp'] : null;

                    $userId = $auth->createUserAccount($username, $password, $firstName, $lastName, $role, $cwStamp);
                    echo json_encode(array(
                        'success' => true,
                        'user_id' => $userId,
                        'message' => 'User created successfully'
                    ));
                    break;

                case 'get_users':
                    $users = $auth->getUserProfiles();
                    echo json_encode(array(
                        'success' => true,
                        'users' => $users
                    ));
                    break;

                case 'toggle_user_status':
                    $userId = isset($input['user_id']) ? $input['user_id'] : '';
                    $result = $auth->toggleUserStatus($userId);
                    echo json_encode(array(
                        'success' => $result,
                        'message' => $result ? 'User status updated' : 'Failed to update user status'
                    ));
                    break;

                case 'update_password':
                    $userId = isset($input['user_id']) ? $input['user_id'] : '';
                    $newPassword = isset($input['new_password']) ? $input['new_password'] : '';
                    $result = $auth->updateUserPassword($userId, $newPassword);
                    echo json_encode(array(
                        'success' => $result,
                        'message' => $result ? 'Password updated' : 'Failed to update password'
                    ));
                    break;

                case 'delete_user':
                    $userId = isset($input['user_id']) ? $input['user_id'] : '';
                    $result = $auth->deleteUserAccount($userId);
                    echo json_encode(array(
                        'success' => $result,
                        'message' => $result ? 'User deleted' : 'Failed to delete user'
                    ));
                    break;

                case 'verify_token':
                    $token = isset($input['token']) ? $input['token'] : '';
                    $payload = $auth->verifyJWT($token);
                    if ($payload) {
                        echo json_encode(array(
                            'success' => true,
                            'user_id' => $payload['user_id'],
                            'role' => $payload['role']
                        ));
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
} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}
?>