-- Work Inventory Database Schema for MySQL
-- Updated for cPanel/GreenGeeks hosting

-- Create database (if needed, though this is usually done through cPanel)
-- CREATE DATABASE IF NOT EXISTS axxessup_cpses_ax6szfw66e_work_inventory;
-- USE axxessup_cpses_ax6szfw66e_work_inventory;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- User roles enum (MySQL uses ENUM instead of custom types)
-- CREATE TYPE user_role AS ENUM ('manager', 'technician');
-- CREATE TYPE order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
-- CREATE TYPE session_status AS ENUM ('active', 'paused', 'completed');
-- CREATE TYPE repair_status AS ENUM ('pending', 'in_progress', 'completed', 'rejected');
-- CREATE TYPE retest_result AS ENUM ('pass', 'fail', 'pending');

-- Profiles table (user management)
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('manager', 'technician') NOT NULL DEFAULT 'technician',
    is_active BOOLEAN DEFAULT TRUE,
    cw_stamp VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Hardware orders table
CREATE TABLE IF NOT EXISTS hardware_orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    po_number VARCHAR(100) NOT NULL,
    assembly_number VARCHAR(100) NOT NULL,
    starting_sequence VARCHAR(50) NOT NULL,
    ending_sequence VARCHAR(50),
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- PTL orders table
CREATE TABLE IF NOT EXISTS ptl_orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    hardware_order_id VARCHAR(36),
    ptl_order_number VARCHAR(100) NOT NULL,
    board_type VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    firmware_revision VARCHAR(50),
    date_code VARCHAR(50),
    sale_code VARCHAR(50),
    test_parameters JSON,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hardware_order_id) REFERENCES hardware_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Board data table
CREATE TABLE IF NOT EXISTS board_data (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    qr_code VARCHAR(255) NOT NULL,
    sequence_number VARCHAR(50) NOT NULL,
    assembly_number VARCHAR(100) NOT NULL,
    board_type VARCHAR(100) NOT NULL,
    test_status ENUM('pending', 'pass', 'fail') DEFAULT 'pending',
    test_date TIMESTAMP NULL,
    test_results JSON,
    hardware_order_id VARCHAR(36),
    ptl_order_id VARCHAR(36),
    technician_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hardware_order_id) REFERENCES hardware_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (ptl_order_id) REFERENCES ptl_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Scan sessions table
CREATE TABLE IF NOT EXISTS scan_sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    technician_id VARCHAR(36) NOT NULL,
    ptl_order_id VARCHAR(36) NOT NULL,
    session_data JSON DEFAULT '{}',
    tester_config JSON NOT NULL DEFAULT '{"type": 1, "scanBoxes": 1}',
    status ENUM('active', 'paused', 'completed') NOT NULL DEFAULT 'active',
    is_active BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    paused_at TIMESTAMP NULL,
    break_started_at TIMESTAMP NULL,
    duration_minutes INT,
    actual_duration_minutes INT,
    break_duration_minutes INT DEFAULT 0,
    pause_duration_minutes INT DEFAULT 0,
    total_scanned INT NOT NULL DEFAULT 0,
    pass_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    session_scanned_count INT DEFAULT 0,
    session_pass_count INT DEFAULT 0,
    session_fail_count INT DEFAULT 0,
    pass_rate DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (ptl_order_id) REFERENCES ptl_orders(id) ON DELETE CASCADE
);

-- Repair entries table
CREATE TABLE IF NOT EXISTS repair_entries (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    qr_code VARCHAR(255) NOT NULL,
    board_type VARCHAR(100) NOT NULL,
    failure_reason TEXT NOT NULL,
    failure_date DATE NOT NULL,
    ptl_order_id VARCHAR(36) NOT NULL,
    original_session_id VARCHAR(36) NOT NULL,
    assigned_technician_id VARCHAR(36),
    repair_status ENUM('pending', 'in_progress', 'completed', 'rejected') NOT NULL DEFAULT 'pending',
    repair_start_date DATE,
    repair_completed_date DATE,
    repair_notes TEXT,
    retest_results ENUM('pass', 'fail', 'pending'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ptl_order_id) REFERENCES ptl_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (original_session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_technician_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- PTL order progress table (for tracking progress)
CREATE TABLE IF NOT EXISTS ptl_order_progress (
    id VARCHAR(36) PRIMARY KEY,
    ptl_order_number VARCHAR(100) NOT NULL,
    board_type VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL,
    scanned_count BIGINT DEFAULT 0,
    passed_count BIGINT DEFAULT 0,
    failed_count BIGINT DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    total_time_minutes BIGINT DEFAULT 0,
    active_time_minutes BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES ptl_orders(id) ON DELETE CASCADE
);

-- Create view for board data with technician names
CREATE OR REPLACE VIEW board_data_with_technician AS
SELECT 
    bd.*,
    p.full_name as technician_name
FROM board_data bd
LEFT JOIN profiles p ON bd.technician_id = p.id;

-- Insert default admin user (password: admin123)
INSERT INTO profiles (id, username, password, full_name, role, is_active) 
VALUES (
    UUID(), 
    'admin', 
    'admin123', 
    'System Administrator', 
    'manager', 
    TRUE
) ON DUPLICATE KEY UPDATE username = username;

-- Insert sample technician (password: tech123)
INSERT INTO profiles (id, username, password, full_name, role, is_active, cw_stamp) 
VALUES (
    UUID(), 
    'smorrison', 
    'password123', 
    'Sarah Morrison', 
    'manager', 
    TRUE,
    'SM001'
) ON DUPLICATE KEY UPDATE username = username;

-- Create indexes for better performance
CREATE INDEX idx_board_data_qr_code ON board_data(qr_code);
CREATE INDEX idx_board_data_ptl_order ON board_data(ptl_order_id);
CREATE INDEX idx_board_data_technician ON board_data(technician_id);
CREATE INDEX idx_scan_sessions_technician ON scan_sessions(technician_id);
CREATE INDEX idx_scan_sessions_ptl_order ON scan_sessions(ptl_order_id);
CREATE INDEX idx_scan_sessions_active ON scan_sessions(is_active);