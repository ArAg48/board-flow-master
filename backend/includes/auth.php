<?php
require_once 'config/database.php';

class Auth {
    private $db;

    public function __construct() {
        $this->db = (new Database())->getConnection();
    }

    // Hash password
    public function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    // Verify password
    public function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    // Authenticate user
    public function authenticateUser($username, $password) {
        try {
            $stmt = $this->db->prepare("SELECT id, username, password, role, full_name, is_active FROM profiles WHERE username = ? AND is_active = 1");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if ($user && $this->verifyPassword($password, $user['password'])) {
                // Remove password from returned data
                unset($user['password']);
                return $user;
            }
            return false;
        } catch (PDOException $e) {
            error_log("Authentication error: " . $e->getMessage());
            return false;
        }
    }

    // Create user account
    public function createUserAccount($username, $password, $firstName, $lastName, $role, $cwStamp = null) {
        try {
            // Validate input
            if (strlen($username) < 3 || strlen($password) < 6) {
                throw new Exception('Username must be at least 3 characters and password at least 6 characters');
            }

            // Check if username exists
            $stmt = $this->db->prepare("SELECT id FROM profiles WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                throw new Exception('Username already exists');
            }

            // Generate UUID
            $userId = $this->generateUUID();
            $hashedPassword = $this->hashPassword($password);
            $fullName = trim($firstName . ' ' . $lastName);

            $stmt = $this->db->prepare("
                INSERT INTO profiles (id, username, password, full_name, role, cw_stamp) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([$userId, $username, $hashedPassword, $fullName, $role, $cwStamp]);
            return $userId;
        } catch (Exception $e) {
            throw $e;
        }
    }

    // Get user profiles
    public function getUserProfiles() {
        try {
            $stmt = $this->db->prepare("
                SELECT id, username, full_name, role, created_at, updated_at, is_active 
                FROM profiles 
                ORDER BY created_at DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Get user profiles error: " . $e->getMessage());
            return [];
        }
    }

    // Toggle user status
    public function toggleUserStatus($userId) {
        try {
            $stmt = $this->db->prepare("UPDATE profiles SET is_active = NOT is_active WHERE id = ?");
            $stmt->execute([$userId]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Toggle user status error: " . $e->getMessage());
            return false;
        }
    }

    // Update user password
    public function updateUserPassword($userId, $newPassword) {
        try {
            if (strlen($newPassword) < 6) {
                throw new Exception('Password must be at least 6 characters');
            }

            $hashedPassword = $this->hashPassword($newPassword);
            $stmt = $this->db->prepare("UPDATE profiles SET password = ? WHERE id = ?");
            $stmt->execute([$hashedPassword, $userId]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            throw $e;
        }
    }

    // Delete user account
    public function deleteUserAccount($userId) {
        try {
            $this->db->beginTransaction();

            // Update references to NULL to maintain history
            $this->db->prepare("UPDATE scan_sessions SET technician_id = NULL WHERE technician_id = ?")->execute([$userId]);
            $this->db->prepare("UPDATE board_data SET technician_id = NULL WHERE technician_id = ?")->execute([$userId]);
            $this->db->prepare("UPDATE repair_entries SET assigned_technician_id = NULL WHERE assigned_technician_id = ?")->execute([$userId]);

            // Delete the profile
            $stmt = $this->db->prepare("DELETE FROM profiles WHERE id = ?");
            $stmt->execute([$userId]);
            
            $this->db->commit();
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Generate UUID (MySQL compatible)
    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    // Generate JWT token
    public function generateJWT($userId, $role) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $userId,
            'role' => $role,
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]);

        $headerEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $payloadEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, 'your-secret-key', true);
        $signatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }

    // Verify JWT token
    public function verifyJWT($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
        $signature = $parts[2];

        $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], 
            base64_encode(hash_hmac('sha256', $parts[0] . "." . $parts[1], 'your-secret-key', true))
        );

        if ($signature !== $expectedSignature) {
            return false;
        }

        $payloadData = json_decode($payload, true);
        if ($payloadData['exp'] < time()) {
            return false; // Token expired
        }

        return $payloadData;
    }
}
?>