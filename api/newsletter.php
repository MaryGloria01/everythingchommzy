<?php
// ============================================
// NEWSLETTER SUBSCRIPTION API
// Handles: Subscribe, Unsubscribe, List, Export
// ============================================

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Create subscribers table if not exists
$db->exec("
    CREATE TABLE IF NOT EXISTS subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        status ENUM('active', 'unsubscribed') DEFAULT 'active',
        source VARCHAR(50) DEFAULT 'website',
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        unsubscribed_at TIMESTAMP NULL,
        INDEX idx_status (status),
        INDEX idx_email (email)
    )
");

switch ($action) {
    case 'subscribe':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleSubscribe($db);
        break;

    case 'unsubscribe':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUnsubscribe($db);
        break;

    case 'list':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleList($db);
        break;

    case 'export':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleExport($db);
        break;

    case 'stats':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleStats($db);
        break;

    case 'delete':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleDelete($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

// Subscribe new email
function handleSubscribe($db) {
    $data = getRequestBody();
    $email = sanitizeInput($data['email'] ?? '');
    $source = sanitizeInput($data['source'] ?? 'website');

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(false, 'Valid email address is required', null, 400);
    }

    try {
        // Check if already exists
        $stmt = $db->prepare("SELECT id, status FROM subscribers WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch();

        if ($existing) {
            if ($existing['status'] === 'active') {
                sendJsonResponse(false, 'This email is already subscribed', null, 400);
            } else {
                // Reactivate subscription
                $stmt = $db->prepare("UPDATE subscribers SET status = 'active', unsubscribed_at = NULL WHERE id = ?");
                $stmt->execute([$existing['id']]);
                sendJsonResponse(true, 'Welcome back! Your subscription has been reactivated');
            }
        } else {
            // New subscription
            $stmt = $db->prepare("INSERT INTO subscribers (email, source) VALUES (?, ?)");
            $stmt->execute([$email, $source]);
            sendJsonResponse(true, 'Thank you for subscribing!', ['id' => $db->lastInsertId()]);
        }

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}

// Unsubscribe email
function handleUnsubscribe($db) {
    $data = getRequestBody();
    $email = sanitizeInput($data['email'] ?? '');

    if (empty($email)) {
        sendJsonResponse(false, 'Email is required', null, 400);
    }

    try {
        $stmt = $db->prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = NOW() WHERE email = ?");
        $stmt->execute([$email]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, 'You have been unsubscribed successfully');
        } else {
            sendJsonResponse(false, 'Email not found', null, 404);
        }

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}

// List subscribers (admin only)
function handleList($db) {
    requireAdmin();

    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(10, intval($_GET['limit'] ?? 20)));
    $status = sanitizeInput($_GET['status'] ?? 'all');
    $search = sanitizeInput($_GET['search'] ?? '');
    $offset = ($page - 1) * $limit;

    try {
        $where = [];
        $params = [];

        if ($status !== 'all') {
            $where[] = "status = ?";
            $params[] = $status;
        }

        if (!empty($search)) {
            $where[] = "email LIKE ?";
            $params[] = "%$search%";
        }

        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";

        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM subscribers $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        // Get subscribers
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $db->prepare("
            SELECT id, email, status, source, subscribed_at, unsubscribed_at
            FROM subscribers
            $whereClause
            ORDER BY subscribed_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $subscribers = $stmt->fetchAll();

        sendJsonResponse(true, 'Subscribers retrieved', [
            'subscribers' => $subscribers,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}

// Export subscribers as CSV (admin only)
function handleExport($db) {
    // Allow token via query param for download links
    if (isset($_GET['token'])) {
        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $_GET['token'];
    }
    requireAdmin();

    $status = sanitizeInput($_GET['status'] ?? 'active');

    try {
        $where = $status !== 'all' ? "WHERE status = ?" : "";
        $params = $status !== 'all' ? [$status] : [];

        $stmt = $db->prepare("SELECT email, status, source, subscribed_at FROM subscribers $where ORDER BY subscribed_at DESC");
        $stmt->execute($params);
        $subscribers = $stmt->fetchAll();

        // Output CSV
        header('Content-Type: text/csv');
        header('Content-Disposition: attachment; filename="subscribers_' . date('Y-m-d') . '.csv"');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['Email', 'Status', 'Source', 'Subscribed Date']);

        foreach ($subscribers as $sub) {
            fputcsv($output, [$sub['email'], $sub['status'], $sub['source'], $sub['subscribed_at']]);
        }

        fclose($output);
        exit;

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}

// Get subscription stats (admin only)
function handleStats($db) {
    requireAdmin();

    try {
        $stats = [];

        // Total active
        $stmt = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE status = 'active'");
        $stats['active'] = $stmt->fetch()['count'];

        // Total unsubscribed
        $stmt = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE status = 'unsubscribed'");
        $stats['unsubscribed'] = $stmt->fetch()['count'];

        // This week
        $stmt = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE subscribed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status = 'active'");
        $stats['this_week'] = $stmt->fetch()['count'];

        // This month
        $stmt = $db->query("SELECT COUNT(*) as count FROM subscribers WHERE subscribed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'active'");
        $stats['this_month'] = $stmt->fetch()['count'];

        sendJsonResponse(true, 'Stats retrieved', $stats);

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}

// Delete subscriber (admin only)
function handleDelete($db) {
    requireAdmin();
    $data = getRequestBody();
    $id = intval($data['id'] ?? 0);

    if ($id <= 0) {
        sendJsonResponse(false, 'Valid subscriber ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM subscribers WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            sendJsonResponse(true, 'Subscriber deleted');
        } else {
            sendJsonResponse(false, 'Subscriber not found', null, 404);
        }

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}
?>
