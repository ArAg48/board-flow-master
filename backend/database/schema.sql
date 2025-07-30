-- MySQL Database Schema for Work Inventory System
-- Run this to create the complete database structure

-- Create database
CREATE DATABASE IF NOT EXISTS work_inventory;
USE work_inventory;

-- User roles enum (using ENUM in MySQL)
CREATE TABLE user_roles_enum (
    role VARCHAR(20) PRIMARY KEY
);
INSERT INTO user_roles_enum VALUES ('manager'), ('technician');

-- Order status enum
CREATE TABLE order_status_enum (
    status VARCHAR(20) PRIMARY KEY
);
INSERT INTO order_status_enum VALUES ('pending'), ('in_progress'), ('completed'), ('cancelled');

-- Session status enum
CREATE TABLE session_status_enum (
    status VARCHAR(20) PRIMARY KEY
);
INSERT INTO session_status_enum VALUES ('active'), ('paused'), ('completed');

-- Repair status enum
CREATE TABLE repair_status_enum (
    status VARCHAR(20) PRIMARY KEY
);
INSERT INTO repair_status_enum VALUES ('pending'), ('in_progress'), ('completed'), ('failed');

-- Retest result enum
CREATE TABLE retest_result_enum (
    result VARCHAR(20) PRIMARY KEY
);
INSERT INTO retest_result_enum VALUES ('pass'), ('fail'), ('pending');

-- Profiles table (users)
CREATE TABLE profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role ENUM('manager', 'technician') NOT NULL DEFAULT 'technician',
    cw_stamp VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Hardware orders table
CREATE TABLE hardware_orders (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    po_number VARCHAR(255) NOT NULL DEFAULT '',
    assembly_number VARCHAR(255) NOT NULL DEFAULT '',
    starting_sequence VARCHAR(255) NOT NULL DEFAULT '',
    ending_sequence VARCHAR(255),
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- PTL orders table
CREATE TABLE ptl_orders (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ptl_order_number VARCHAR(255) NOT NULL,
    board_type VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    firmware_revision VARCHAR(255),
    date_code VARCHAR(255),
    sale_code VARCHAR(255),
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    notes TEXT,
    test_parameters JSON,
    hardware_order_id CHAR(36),
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hardware_order_id) REFERENCES hardware_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Board data table
CREATE TABLE board_data (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    qr_code VARCHAR(255) NOT NULL,
    sequence_number VARCHAR(255) NOT NULL,
    assembly_number VARCHAR(255) NOT NULL,
    board_type VARCHAR(255) NOT NULL,
    test_status ENUM('pass', 'fail', 'pending') DEFAULT 'pending',
    test_results JSON,
    test_date TIMESTAMP NULL,
    technician_id CHAR(36),
    ptl_order_id CHAR(36),
    hardware_order_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (ptl_order_id) REFERENCES ptl_orders(id) ON DELETE SET NULL,
    FOREIGN KEY (hardware_order_id) REFERENCES hardware_orders(id) ON DELETE SET NULL
);

-- Scan sessions table
CREATE TABLE scan_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    technician_id CHAR(36) NOT NULL,
    ptl_order_id CHAR(36) NOT NULL,
    status ENUM('active', 'paused', 'completed') NOT NULL DEFAULT 'active',
    is_active BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    paused_at TIMESTAMP NULL,
    break_started_at TIMESTAMP NULL,
    session_data JSON DEFAULT '{}',
    tester_config JSON NOT NULL DEFAULT '{"type": 1, "scanBoxes": 1}',
    total_scanned INT NOT NULL DEFAULT 0,
    pass_count INT NOT NULL DEFAULT 0,
    fail_count INT NOT NULL DEFAULT 0,
    pass_rate DECIMAL(5,2),
    duration_minutes INT,
    actual_duration_minutes INT,
    pause_duration_minutes INT DEFAULT 0,
    break_duration_minutes INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (ptl_order_id) REFERENCES ptl_orders(id) ON DELETE CASCADE
);

-- Repair entries table
CREATE TABLE repair_entries (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    qr_code VARCHAR(255) NOT NULL,
    board_type VARCHAR(255) NOT NULL,
    failure_reason VARCHAR(255) NOT NULL,
    failure_date DATE NOT NULL,
    repair_status ENUM('pending', 'in_progress', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    assigned_technician_id CHAR(36),
    repair_start_date DATE,
    repair_completed_date DATE,
    repair_notes TEXT,
    retest_results ENUM('pass', 'fail', 'pending'),
    ptl_order_id CHAR(36) NOT NULL,
    original_session_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_technician_id) REFERENCES profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (ptl_order_id) REFERENCES ptl_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (original_session_id) REFERENCES scan_sessions(id) ON DELETE CASCADE
);

-- PTL order progress table (derived data)
CREATE TABLE ptl_order_progress (
    id CHAR(36) PRIMARY KEY,
    ptl_order_number VARCHAR(255) NOT NULL,
    board_type VARCHAR(255) NOT NULL,
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

-- View for board data with technician
CREATE VIEW board_data_with_technician AS
SELECT 
    bd.*,
    p.full_name as technician_name
FROM board_data bd
LEFT JOIN profiles p ON bd.technician_id = p.id;

-- Create indexes for performance
CREATE INDEX idx_board_data_qr_code ON board_data(qr_code);
CREATE INDEX idx_board_data_ptl_order ON board_data(ptl_order_id);
CREATE INDEX idx_board_data_technician ON board_data(technician_id);
CREATE INDEX idx_scan_sessions_technician ON scan_sessions(technician_id);
CREATE INDEX idx_scan_sessions_ptl_order ON scan_sessions(ptl_order_id);
CREATE INDEX idx_scan_sessions_active ON scan_sessions(is_active);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_repair_entries_qr_code ON repair_entries(qr_code);