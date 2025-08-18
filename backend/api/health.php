<?php
// Simple health check endpoint (GET) to diagnose server and DB issues
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

@ini_set('display_errors', '0');
@ini_set('html_errors', '0');
@error_reporting(0);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

function out($arr, $code = 200) {
  http_response_code($code);
  echo json_encode($arr);
  exit;
}

$health = array(
  'ok' => true,
  'php_version' => PHP_VERSION,
  'time' => date('c'),
);

// Try DB connection if requested or by default
$checkDb = true;
if (isset($_GET['db'])) { $checkDb = $_GET['db'] !== '0'; }

if ($checkDb) {
  try {
    require_once '../config/database.php';
    $dbObj = new Database();
    $db = $dbObj->getConnection();
    // lightweight query to ensure connectivity
    $stmt = $db->query('SELECT 1');
    $health['db_connected'] = (bool) $stmt->fetchColumn();
  } catch (Exception $e) {
    $health['ok'] = false;
    $health['db_connected'] = false;
    $health['error'] = 'db_connection_failed';
    $health['message'] = $e->getMessage();
    out($health, 500);
  }
}

out($health, 200);
