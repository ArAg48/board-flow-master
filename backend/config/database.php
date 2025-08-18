<?php
// Database configuration
class Database {
    private $host = 'localhost';
    private $port = '3306';
    private $dbname = 'axxessup_cpses_ax6szfw66e_work_inventory';
    private $username = 'axxessup_Arjun';
    private $password = 'U@ctHJLMTK?#Q&%!';
    private $pdo;

    public function connect() {
        if ($this->pdo === null) {
            try {
                if (!class_exists('PDO')) {
                    throw new Exception('PDO extension is not available');
                }
                if (!in_array('mysql', PDO::getAvailableDrivers())) {
                    throw new Exception('pdo_mysql driver is not enabled');
                }
                $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->dbname};charset=utf8mb4";
                $this->pdo = new PDO($dsn, $this->username, $this->password, array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ));
            } catch (Exception $e) {
                throw new Exception("Database connection failed: " . $e->getMessage());
            }
        }
        return $this->pdo;
    }

    public function getConnection() {
        return $this->connect();
    }
}
?>