<?php
/**
 * One-time script to migrate existing plaintext passwords to hashed versions
 * Run this script once after deploying the security fixes
 */

require_once __DIR__ . '/includes/auth.php';

echo "Starting password migration...\n";

try {
    $auth = new Auth();
    $migrated = $auth->migratePasswordsToHashed();
    
    if ($migrated !== false) {
        echo "Successfully migrated {$migrated} passwords to hashed format.\n";
    } else {
        echo "Error during password migration. Check error logs.\n";
    }
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}

echo "Migration complete.\n";
?>