<?php
// ============================================
// USERS API
// Handles: List, Get, Delete users (Admin only)
// ============================================

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'profile':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetProfile($db);
        break;

    case 'list':
        // Accept both GET and POST (POST bypasses cache)
        handleListUsers($db);
        break;

    case 'get':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetUser($db);
        break;

    case 'delete':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleDeleteUser($db);
        break;

    case 'stats':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUserStats($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

// Get current user's profile
function handleGetProfile($db) {
    $user = requireAuth();
    if (!$user) {
        sendJsonResponse(false, 'Authentication required', null, 401);
    }

    try {
        $stmt = $db->prepare("SELECT id, name, email, phone, role, referral_code, created_at FROM users WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch();

        if (!$userData) {
            sendJsonResponse(false, 'User not found', null, 404);
        }

        sendJsonResponse(true, 'Profile retrieved', $userData);
    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to get profile', null, 500);
    }
}

function handleListUsers($db) {
    // Prevent caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');

    requireAdmin();

    $role = $_GET['role'] ?? null;
    $limit = (int)($_GET['limit'] ?? 50);
    $offset = (int)($_GET['offset'] ?? 0);

    try {
        $where = "WHERE role != 'admin'";
        $params = [];

        if ($role) {
            $where .= " AND role = ?";
            $params[] = $role;
        }

        $stmt = $db->prepare("
            SELECT
                u.id, u.name, u.email, u.phone, u.role, u.referral_code, u.created_at,
                (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
                (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = u.id AND payment_status = 'confirmed') as total_spent,
                (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as referral_count
            FROM users u
            $where
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        ");

        $paramIndex = 1;
        foreach ($params as $param) {
            $stmt->bindValue($paramIndex++, $param);
        }
        $stmt->bindValue($paramIndex++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($paramIndex, $offset, PDO::PARAM_INT);

        $stmt->execute();
        $users = $stmt->fetchAll();

        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM users $where");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        sendJsonResponse(true, 'Users retrieved successfully', [
            'users' => $users,
            'total' => $total
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch users: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleGetUser($db) {
    requireAdmin();

    $id = sanitizeInput($_GET['id'] ?? '');

    if (empty($id)) {
        sendJsonResponse(false, 'User ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("
            SELECT
                u.id, u.name, u.email, u.phone, u.role, u.referral_code, u.referred_by, u.created_at,
                (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
                (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = u.id AND payment_status = 'confirmed') as total_spent,
                (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as referral_count
            FROM users u
            WHERE u.id = ?
        ");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) {
            sendJsonResponse(false, 'User not found', null, 404);
        }

        // Get user's orders
        $stmt = $db->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10");
        $stmt->execute([$id]);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$order) {
            $order['items'] = json_decode($order['items'], true);
        }

        $user['recent_orders'] = $orders;

        // Get user's referrals
        $stmt = $db->prepare("
            SELECT r.*, u.name as referred_name
            FROM referrals r
            LEFT JOIN users u ON r.referred_user_id = u.id
            WHERE r.referrer_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$id]);
        $user['referrals'] = $stmt->fetchAll();

        sendJsonResponse(true, 'User retrieved successfully', $user);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch user: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleDeleteUser($db) {
    requireAdmin();
    $data = getRequestBody();

    $id = sanitizeInput($data['id'] ?? '');

    if (empty($id)) {
        sendJsonResponse(false, 'User ID is required', null, 400);
    }

    try {
        // Check if user is admin
        $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) {
            sendJsonResponse(false, 'User not found', null, 404);
        }

        if ($user['role'] === 'admin') {
            sendJsonResponse(false, 'Cannot delete admin user', null, 403);
        }

        // Delete user (cascades to related tables)
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);

        sendJsonResponse(true, 'User deleted successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to delete user: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleUserStats($db) {
    requireAdmin();

    try {
        // Total customers
        $stmt = $db->query("SELECT COUNT(*) as total FROM users WHERE role = 'customer'");
        $totalCustomers = $stmt->fetch()['total'];

        // New customers this month
        $stmt = $db->query("
            SELECT COUNT(*) as new_this_month
            FROM users
            WHERE role = 'customer'
            AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
        ");
        $newThisMonth = $stmt->fetch()['new_this_month'];

        // Customers with orders
        $stmt = $db->query("
            SELECT COUNT(DISTINCT user_id) as with_orders
            FROM orders
            WHERE user_id IS NOT NULL
        ");
        $withOrders = $stmt->fetch()['with_orders'];

        // Top customers by spending
        $stmt = $db->query("
            SELECT
                u.name,
                u.email,
                COALESCE(SUM(o.total), 0) as total_spent,
                COUNT(o.id) as order_count
            FROM users u
            JOIN orders o ON u.id = o.user_id
            WHERE o.payment_status = 'confirmed'
            GROUP BY u.id, u.name, u.email
            ORDER BY total_spent DESC
            LIMIT 5
        ");
        $topCustomers = $stmt->fetchAll();

        sendJsonResponse(true, 'User stats retrieved successfully', [
            'totalCustomers' => (int)$totalCustomers,
            'newThisMonth' => (int)$newThisMonth,
            'withOrders' => (int)$withOrders,
            'topCustomers' => $topCustomers
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch stats: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}
?>
