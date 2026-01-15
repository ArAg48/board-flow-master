-- =====================================================
-- MySQL Schema for PTL Inventory System
-- Matches Supabase database structure exactly
-- =====================================================

-- Drop tables in correct order (respect foreign keys)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS repair_entries;
DROP TABLE IF EXISTS board_data;
DROP TABLE IF EXISTS scan_sessions;
DROP TABLE IF EXISTS ptl_order_progress;
DROP TABLE IF EXISTS ptl_orders;
DROP TABLE IF EXISTS hardware_orders;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS profiles;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- PROFILES TABLE (Users)
-- =====================================================
CREATE TABLE profiles (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) DEFAULT NULL,
    role ENUM('manager', 'technician', 'customer') NOT NULL DEFAULT 'technician',
    is_active BOOLEAN DEFAULT TRUE,
    cw_stamp VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_profiles_username (username),
    INDEX idx_profiles_role (role),
    INDEX idx_profiles_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER_ROLES TABLE (Additional role assignments)
-- =====================================================
CREATE TABLE user_roles (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    role ENUM('manager', 'technician', 'customer') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_user_roles_user_id (user_id),
    INDEX idx_user_roles_role (role),
    UNIQUE KEY unique_user_role (user_id, role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- HARDWARE_ORDERS TABLE
-- =====================================================
CREATE TABLE hardware_orders (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    po_number VARCHAR(100) NOT NULL DEFAULT '',
    assembly_number VARCHAR(100) NOT NULL DEFAULT '',
    quantity INT NOT NULL DEFAULT 1,
    starting_sequence VARCHAR(100) NOT NULL DEFAULT '',
    ending_sequence VARCHAR(100) DEFAULT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT DEFAULT NULL,
    created_by CHAR(36) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
    INDEX idx_hardware_orders_po_number (po_number),
    INDEX idx_hardware_orders_status (status),
    INDEX idx_hardware_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PTL_ORDERS TABLE
-- =====================================================
CREATE TABLE ptl_orders (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    ptl_order_number VARCHAR(100) NOT NULL,
    hardware_order_id CHAR(36) DEFAULT NULL,
    board_type VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    firmware_revision VARCHAR(100) DEFAULT NULL,
    date_code VARCHAR(50) DEFAULT NULL,
    sale_code VARCHAR(100) DEFAULT NULL,
    is_firmware_update BOOLEAN NOT NULL DEFAULT FALSE,
    axxess_updater VARCHAR(255) DEFAULT NULL,
    test_parameters JSON DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    product_count_verified VARCHAR(100) DEFAULT NULL,
    verified_by CHAR(36) DEFAULT NULL,
    verified_at TIMESTAMP NULL DEFAULT NULL,
    verifier_initials VARCHAR(10) DEFAULT NULL,
    created_by CHAR(36) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (hardware_order_id) REFERENCES hardware_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES profiles(id) ON DELETE SET NULL,
    INDEX idx_ptl_orders_ptl_order_number (ptl_order_number),
    INDEX idx_ptl_orders_hardware_order_id (hardware_order_id),
    INDEX idx_ptl_orders_status (status),
    INDEX idx_ptl_orders_board_type (board_type),
    INDEX idx_ptl_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PTL_ORDER_PROGRESS TABLE (Cached progress stats)
-- =====================================================
CREATE TABLE ptl_order_progress (
    id CHAR(36) NOT NULL,
    ptl_order_number VARCHAR(100) NOT NULL,
    board_type VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL,
    scanned_count BIGINT DEFAULT 0,
    passed_count BIGINT DEFAULT 0,
    failed_count BIGINT DEFAULT 0,
    completion_percentage DECIMAL(10,2) DEFAULT 0,
    total_time_minutes BIGINT DEFAULT 0,
    active_time_minutes BIGINT DEFAULT 0,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ptl_order_progress_status (status),
    INDEX idx_ptl_order_progress_ptl_order_number (ptl_order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SCAN_SESSIONS TABLE
-- =====================================================
CREATE TABLE scan_sessions (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    technician_id CHAR(36) NOT NULL,
    ptl_order_id CHAR(36) NOT NULL,
    tester_config JSON NOT NULL,
    session_data JSON DEFAULT '{}',
    status ENUM('completed', 'paused', 'abandoned', 'active') NOT NULL DEFAULT 'active',
    is_active BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL DEFAULT NULL,
    paused_at TIMESTAMP NULL DEFAULT NULL,
    break_started_at TIMESTAMP NULL DEFAULT NULL,
    duration_minutes INT DEFAULT NULL,
    actual_duration_minutes INT DEFAULT NULL,
    pause_duration_minutes INT DEFAULT 0,
    break_duration_minutes INT DEFAULT 0,
    total_scanned INT NOT NULL DEFAULT 0,
    pass_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    session_scanned_count INT DEFAULT 0,
    session_pass_count INT DEFAULT 0,
    session_fail_count INT DEFAULT 0,
    pass_rate DECIMAL(10,2) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (ptl_order_id) REFERENCES ptl_orders(id) ON DELETE CASCADE,
    INDEX idx_scan_sessions_technician_id (technician_id),
    INDEX idx_scan_sessions_ptl_order_id (ptl_order_id),
    INDEX idx_scan_sessions_status (status),
    INDEX idx_scan_sessions_is_active (is_active),
    INDEX idx_scan_sessions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- BOARD_DATA TABLE
-- =====================================================
CREATE TABLE board_data (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    qr_code VARCHAR(255) NOT NULL,
    sequence_number VARCHAR(100) NOT NULL,
    assembly_number VARCHAR(100) NOT NULL,
    board_type VARCHAR(100) NOT NULL,
    ptl_order_id CHAR(36) DEFAULT NULL,
    hardware_order_id CHAR(36) DEFAULT NULL,
    technician_id CHAR(36) DEFAULT NULL,
    test_status VARCHAR(50) DEFAULT 'pending',
    test_date TIMESTAMP NULL DEFAULT NULL,
    test_results JSON DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (ptl_order_id) REFERENCES ptl_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (hardware_order_id) REFERENCES hardware_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE SET NULL,
    INDEX idx_board_data_qr_code (qr_code),
    INDEX idx_board_data_ptl_order_id (ptl_order_id),
    INDEX idx_board_data_technician_id (technician_id),
    INDEX idx_board_data_test_status (test_status),
    INDEX idx_board_data_sequence_number (sequence_number),
    UNIQUE KEY unique_qr_ptl (qr_code, ptl_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REPAIR_ENTRIES TABLE
-- =====================================================
CREATE TABLE repair_entries (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    qr_code VARCHAR(255) NOT NULL,
    board_type VARCHAR(100) NOT NULL,
    failure_reason TEXT NOT NULL,
    failure_date DATE NOT NULL,
    ptl_order_id CHAR(36) NOT NULL,
    original_session_id CHAR(36) NOT NULL,
    assigned_technician_id CHAR(36) DEFAULT NULL,
    repair_status ENUM('pending', 'in_progress', 'completed', 'scrapped') NOT NULL DEFAULT 'pending',
    repair_notes TEXT DEFAULT NULL,
    repair_start_date DATE DEFAULT NULL,
    repair_completed_date DATE DEFAULT NULL,
    retest_results ENUM('pass', 'fail') DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (ptl_order_id) REFERENCES ptl_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (original_session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_technician_id) REFERENCES profiles(id) ON DELETE SET NULL,
    INDEX idx_repair_entries_ptl_order_id (ptl_order_id),
    INDEX idx_repair_entries_repair_status (repair_status),
    INDEX idx_repair_entries_qr_code (qr_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT DEFAULT ADMIN USER
-- Password: admin123 (you should change this)
-- =====================================================
INSERT INTO profiles (id, username, password, full_name, role, is_active)
VALUES (UUID(), 'admin', 'admin123', 'System Administrator', 'manager', TRUE);

-- Get the admin user ID and create their role
SET @admin_id = (SELECT id FROM profiles WHERE username = 'admin' LIMIT 1);
INSERT INTO user_roles (id, user_id, role)
VALUES (UUID(), @admin_id, 'manager');

-- =====================================================
-- VERIFICATION QUERY
-- Run this to verify all tables were created correctly
-- =====================================================
-- SELECT 
--     TABLE_NAME,
--     TABLE_ROWS,
--     ENGINE
-- FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = DATABASE()
-- ORDER BY TABLE_NAME;
