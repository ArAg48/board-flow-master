<?php
require_once 'config/database.php';

class Orders {
    private $db;

    public function __construct() {
        $this->db = (new Database())->getConnection();
    }

    // Hardware Orders
    public function getHardwareOrders() {
        try {
            $stmt = $this->db->prepare("
                SELECT ho.*, p.full_name as created_by_name 
                FROM hardware_orders ho
                LEFT JOIN profiles p ON ho.created_by = p.id
                ORDER BY ho.created_at DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Get hardware orders error: " . $e->getMessage());
            return [];
        }
    }

    public function createHardwareOrder($data) {
        try {
            $id = $this->generateUUID();
            $stmt = $this->db->prepare("
                INSERT INTO hardware_orders (id, po_number, assembly_number, starting_sequence, ending_sequence, quantity, status, notes, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $id,
                $data['po_number'],
                $data['assembly_number'],
                $data['starting_sequence'],
                $data['ending_sequence'] ?? null,
                $data['quantity'],
                $data['status'] ?? 'pending',
                $data['notes'] ?? null,
                $data['created_by']
            ]);
            
            return $id;
        } catch (PDOException $e) {
            error_log("Create hardware order error: " . $e->getMessage());
            throw new Exception("Failed to create hardware order");
        }
    }

    public function updateHardwareOrder($id, $data) {
        try {
            $stmt = $this->db->prepare("
                UPDATE hardware_orders 
                SET po_number = ?, assembly_number = ?, starting_sequence = ?, ending_sequence = ?, 
                    quantity = ?, status = ?, notes = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $data['po_number'],
                $data['assembly_number'],
                $data['starting_sequence'],
                $data['ending_sequence'] ?? null,
                $data['quantity'],
                $data['status'],
                $data['notes'] ?? null,
                $id
            ]);
            
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Update hardware order error: " . $e->getMessage());
            return false;
        }
    }

    // PTL Orders
    public function getPTLOrders() {
        try {
            $stmt = $this->db->prepare("
                SELECT po.*, ho.po_number as hardware_po_number, p.full_name as created_by_name
                FROM ptl_orders po
                LEFT JOIN hardware_orders ho ON po.hardware_order_id = ho.id
                LEFT JOIN profiles p ON po.created_by = p.id
                ORDER BY po.created_at DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Get PTL orders error: " . $e->getMessage());
            return [];
        }
    }

    public function createPTLOrder($data) {
        try {
            $id = $this->generateUUID();
            $stmt = $this->db->prepare("
                INSERT INTO ptl_orders (id, ptl_order_number, board_type, quantity, firmware_revision, date_code, sale_code, status, notes, test_parameters, hardware_order_id, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $id,
                $data['ptl_order_number'],
                $data['board_type'],
                $data['quantity'],
                $data['firmware_revision'] ?? null,
                $data['date_code'] ?? null,
                $data['sale_code'] ?? null,
                $data['status'] ?? 'pending',
                $data['notes'] ?? null,
                isset($data['test_parameters']) ? json_encode($data['test_parameters']) : null,
                $data['hardware_order_id'] ?? null,
                $data['created_by']
            ]);
            
            return $id;
        } catch (PDOException $e) {
            error_log("Create PTL order error: " . $e->getMessage());
            throw new Exception("Failed to create PTL order");
        }
    }

    public function updatePTLOrder($id, $data) {
        try {
            $stmt = $this->db->prepare("
                UPDATE ptl_orders 
                SET ptl_order_number = ?, board_type = ?, quantity = ?, firmware_revision = ?, 
                    date_code = ?, sale_code = ?, status = ?, notes = ?, test_parameters = ?
                WHERE id = ?
            ");
            
            $stmt->execute([
                $data['ptl_order_number'],
                $data['board_type'],
                $data['quantity'],
                $data['firmware_revision'] ?? null,
                $data['date_code'] ?? null,
                $data['sale_code'] ?? null,
                $data['status'],
                $data['notes'] ?? null,
                isset($data['test_parameters']) ? json_encode($data['test_parameters']) : null,
                $id
            ]);
            
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Update PTL order error: " . $e->getMessage());
            return false;
        }
    }

    // Get PTL order progress
    public function getPTLOrderProgress() {
        try {
            $stmt = $this->db->prepare("
                SELECT 
                    po.id,
                    po.ptl_order_number,
                    po.board_type,
                    po.quantity,
                    po.status,
                    COALESCE(bd_stats.total_count, 0) as scanned_count,
                    COALESCE(bd_stats.pass_count, 0) as passed_count,
                    COALESCE(bd_stats.fail_count, 0) as failed_count,
                    CASE 
                        WHEN po.quantity > 0 THEN (COALESCE(bd_stats.total_count, 0) / po.quantity * 100)
                        ELSE 0
                    END as completion_percentage,
                    COALESCE(ss_stats.total_time, 0) as total_time_minutes,
                    COALESCE(ss_stats.active_time, 0) as active_time_minutes
                FROM ptl_orders po
                LEFT JOIN (
                    SELECT 
                        ptl_order_id,
                        COUNT(*) as total_count,
                        SUM(CASE WHEN test_status = 'pass' THEN 1 ELSE 0 END) as pass_count,
                        SUM(CASE WHEN test_status = 'fail' THEN 1 ELSE 0 END) as fail_count
                    FROM board_data 
                    GROUP BY ptl_order_id
                ) bd_stats ON po.id = bd_stats.ptl_order_id
                LEFT JOIN (
                    SELECT 
                        ptl_order_id,
                        SUM(COALESCE(duration_minutes, 0)) as total_time,
                        SUM(COALESCE(actual_duration_minutes, duration_minutes, 0)) as active_time
                    FROM scan_sessions
                    GROUP BY ptl_order_id
                ) ss_stats ON po.id = ss_stats.ptl_order_id
                ORDER BY po.created_at DESC
            ");
            $stmt->execute();
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Get PTL order progress error: " . $e->getMessage());
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