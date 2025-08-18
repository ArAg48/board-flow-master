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

// Output buffering to prevent stray output
if (!ob_get_level()) { ob_start(); }

// JSON error helpers compatible with older PHP versions
if (!function_exists('api_json_error')) {
    function api_json_error($msg, $code = 500) {
        while (ob_get_level() > 0) { @ob_end_clean(); }
        header('Content-Type: application/json');
        http_response_code($code);
        echo json_encode(array('success' => false, 'error' => $msg));
        exit;
    }
}

if (!function_exists('api_error_handler')) {
    function api_error_handler($errno, $errstr, $errfile, $errline) {
        // Respect @ operator
        if (error_reporting() === 0) { return false; }
        api_json_error('PHP error ['.$errno.']: '.$errstr.' at '.$errfile.':'.$errline, 500);
        return true;
    }
}

if (!function_exists('api_shutdown_handler')) {
    function api_shutdown_handler() {
        $e = error_get_last();
        if ($e && in_array($e['type'], array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR))) {
            api_json_error('Fatal server error: '.$e['message'].' at '.$e['file'].':'.$e['line'], 500);
        }
    }
}

set_error_handler('api_error_handler');
register_shutdown_function('api_shutdown_handler');

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
} catch (Exception $e) {
    api_json_error($e->getMessage(), 400);
}
?>