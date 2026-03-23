<?php
// ============================================
// DATABASE CONNECTION TEST
// Visit this file in your browser to test the connection
// DELETE THIS FILE after testing for security!
// ============================================

require_once 'config.php';

echo "<h1>Everything Chommzy - Database Test</h1>";
echo "<hr>";

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "<p style='color: green; font-weight: bold;'>✓ Database connection successful!</p>";

    // Test tables
    $tables = ['users', 'products', 'orders', 'referrals', 'bank_accounts', 'wishlist', 'cart', 'notifications', 'password_resets'];

    echo "<h3>Checking tables:</h3>";
    echo "<ul>";
    foreach ($tables as $table) {
        try {
            $stmt = $db->query("SELECT COUNT(*) as count FROM $table");
            $count = $stmt->fetch()['count'];
            echo "<li style='color: green;'>✓ <strong>$table</strong> - $count records</li>";
        } catch (Exception $e) {
            echo "<li style='color: red;'>✗ <strong>$table</strong> - Table not found or error</li>";
        }
    }
    echo "</ul>";

    // Check admin user
    echo "<h3>Admin User Check:</h3>";
    $stmt = $db->prepare("SELECT email, name FROM users WHERE role = 'admin' LIMIT 1");
    $stmt->execute();
    $admin = $stmt->fetch();
    if ($admin) {
        echo "<p style='color: green;'>✓ Admin user exists: {$admin['name']} ({$admin['email']})</p>";
    } else {
        echo "<p style='color: red;'>✗ No admin user found. Run the database.sql file first.</p>";
    }

    // Check products
    echo "<h3>Products Check:</h3>";
    $stmt = $db->query("SELECT COUNT(*) as count FROM products");
    $productCount = $stmt->fetch()['count'];
    if ($productCount > 0) {
        echo "<p style='color: green;'>✓ $productCount products in database</p>";
    } else {
        echo "<p style='color: orange;'>⚠ No products found. Run the database.sql file to add sample products.</p>";
    }

} catch (PDOException $e) {
    echo "<p style='color: red; font-weight: bold;'>✗ Database connection failed!</p>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
    echo "<h3>Troubleshooting:</h3>";
    echo "<ol>";
    echo "<li>Open <code>api/config.php</code> and update the database credentials</li>";
    echo "<li>Make sure you've created the database in Hostinger's hPanel</li>";
    echo "<li>Run the <code>database.sql</code> file in phpMyAdmin</li>";
    echo "</ol>";
}

echo "<hr>";
echo "<p style='color: red; font-weight: bold;'>⚠ DELETE THIS FILE (test.php) after testing for security!</p>";
?>
