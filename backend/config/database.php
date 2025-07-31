<?php
// Database configuration
class Database {
    private $host = 'localhost';
    private $dbname = 'cpses_ax6szfw66e_work_inventory'; // Your actual database name from cPanel
    private $username = 'cpses_ax6szfw66e'; // Your MySQL username from cPanel
    private $password = 'your_actual_mysql_password'; // Your MySQL password from cPanel
    private $pdo;

    public function connect() {
        if ($this->pdo === null) {
            try {
                $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset=utf8mb4";
                $this->pdo = new PDO($dsn, $this->username, $this->password, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]);
            } catch (PDOException $e) {
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