<?php
require_once 'config/database.php';

class Scanner {
    private $db;

    public function __construct() {
        $this->db = (new Database())->getConnection();
    }

    // Lookup board details by QR code
    public function lookupBoardDetails($qrCode) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    bd.qr_code,
                    bd.sequence_number,
                    bd.assembly_number,
                    bd.board_type,
                    bd.test_status,
                    bd.test_date,
                    po.ptl_order_number,
                    po.firmware_revision,
                    po.date_code,
                    po.sale_code,
                    p.full_name as technician_name
                FROM board_data bd
                LEFT JOIN ptl_orders po ON bd.ptl_order_id = po.id
                LEFT JOIN profiles p ON bd.technician_id = p.id
                WHERE bd.qr_code = ?
            ");
            $stmt->execute([$qrCode]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Lookup board details error: " . $e->getMessage());
            return false;
        }
    }

    // Save board scan result
    public function saveBoardScan($data) {
        try {
            $id = $this->generateUUID();
            $stmt = $this->db->prepare("
                INSERT INTO board_data (id, qr_code, sequence_number, assembly_number, board_type, test_status, test_results, test_date, technician_id, ptl_order_id, hardware_order_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                test_status = VALUES(test_status),
                test_results = VALUES(test_results),
                test_date = VALUES(test_date),
                technician_id = VALUES(technician_id),
                updated_at = CURRENT_TIMESTAMP
            ");
            
            $stmt->execute([
                $id,
                $data['qr_code'],
                $data['sequence_number'],
                $data['assembly_number'],
                $data['board_type'],
                $data['test_status'] ?? 'pending',
                isset($data['test_results']) ? json_encode($data['test_results']) : null,
                $data['test_date'] ?? null,
                $data['technician_id'],
                $data['ptl_order_id'] ?? null,
                $data['hardware_order_id'] ?? null
            ]);
            
            return $id;
        } catch (PDOException $e) {
            error_log("Save board scan error: " . $e->getMessage());
            throw new Exception("Failed to save board scan");
        }
    }

    // Count scanned boards for PTL order
    public function countScannedBoards($ptlOrderId) {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    COUNT(DISTINCT qr_code) as total_count,
                    SUM(CASE WHEN test_status = 'pass' THEN 1 ELSE 0 END) as pass_count,
                    SUM(CASE WHEN test_status = 'fail' THEN 1 ELSE 0 END) as fail_count,
                    SUM(CASE WHEN test_status = 'pending' THEN 1 ELSE 0 END) as pending_count
                FROM board_data 
                WHERE ptl_order_id = ?
            ");
            $stmt->execute([$ptlOrderId]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Count scanned boards error: " . $e->getMessage());
            return ['total_count' => 0, 'pass_count' => 0, 'fail_count' => 0, 'pending_count' => 0];
        }
    }

    // Save scan session
    public function saveSession($sessionId, $technicianId, $ptlOrderId, $sessionData, $status = 'active', $pausedAt = null, $breakStartedAt = null) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO scan_sessions (id, technician_id, ptl_order_id, session_data, status, is_active, paused_at, break_started_at, tester_config, start_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                session_data = VALUES(session_data),
                status = VALUES(status),
                is_active = VALUES(is_active),
                paused_at = VALUES(paused_at),
                break_started_at = VALUES(break_started_at),
                updated_at = CURRENT_TIMESTAMP
            ");
            
            // Map frontend status to database enum
            $dbStatus = $status;
            switch ($status) {
                case 'break':
                case 'paused':
                    $dbStatus = 'paused';
                    break;
                case 'scanning':
                case 'setup':
                case 'pre-test':
                case 'post-test':
                    $dbStatus = 'active';
                    break;
                case 'completed':
                    $dbStatus = 'completed';
                    break;
                default:
                    $dbStatus = 'active';
            }

            $testerConfig = json_encode(['type' => 1, 'scanBoxes' => 1]);
            if (is_array($sessionData) && isset($sessionData['testerConfig'])) {
                $testerConfig = json_encode($sessionData['testerConfig']);
            }

            $startTime = date('Y-m-d H:i:s');
            if (is_array($sessionData) && isset($sessionData['startTime'])) {
                $startTime = $sessionData['startTime'];
            }

            $stmt->execute([
                $sessionId,
                $technicianId,
                $ptlOrderId,
                json_encode($sessionData),
                $dbStatus,
                true,
                $pausedAt,
                $breakStartedAt,
                $testerConfig,
                $startTime
            ]);
            
            return $sessionId;
        } catch (PDOException $e) {
            error_log("Save session error: " . $e->getMessage());
            throw new Exception("Failed to save session");
        }
    }

    // Get active session for user
    public function getActiveSessionForUser($userId) {
        try {
            $stmt = $this->db->prepare("
                SELECT id, ptl_order_id, session_data, start_time, paused_at, break_started_at
                FROM scan_sessions 
                WHERE technician_id = ? AND is_active = 1 AND status IN ('active', 'paused')
                ORDER BY created_at DESC 
                LIMIT 1
            ");
            $stmt->execute([$userId]);
            return $stmt->fetch();
        } catch (PDOException $e) {
            error_log("Get active session error: " . $e->getMessage());
            return false;
        }
    }

    // Deactivate session
    public function deactivateSession($sessionId) {
        try {
            $stmt = $this->db->prepare("
                UPDATE scan_sessions 
                SET is_active = 0, status = 'completed', end_time = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([$sessionId]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Deactivate session error: " . $e->getMessage());
            return false;
        }
    }

    // Get scan history
    public function getScanHistory($technicianId = null) {
        try {
            $query = "
                SELECT 
                    ss.*,
                    po.ptl_order_number,
                    po.board_type,
                    p.full_name as technician_name
                FROM scan_sessions ss
                LEFT JOIN ptl_orders po ON ss.ptl_order_id = po.id
                LEFT JOIN profiles p ON ss.technician_id = p.id
            ";
            
            $params = [];
            if ($technicianId) {
                $query .= " WHERE ss.technician_id = ?";
                $params[] = $technicianId;
            }
            
            $query .= " ORDER BY ss.created_at DESC";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Get scan history error: " . $e->getMessage());
            return [];
        }
    }

    private function generateUUID() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
?>