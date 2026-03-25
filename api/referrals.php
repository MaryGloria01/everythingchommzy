<?php
// ============================================
// REFERRALS API
// Handles: List, Stats, User referrals
// ============================================

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        // Accept both GET and POST (POST bypasses cache)
        handleListReferrals($db);
        break;

    case 'user-referrals':
        // Accept both GET and POST (POST bypasses cache)
        handleUserReferrals($db);
        break;

    case 'user-stats':
        // Accept both GET and POST (POST bypasses cache)
        handleUserReferralStats($db);
        break;

    case 'all-stats':
        // Accept both GET and POST (POST bypasses cache)
        handleAllReferralStats($db);
        break;

    case 'validate-code':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleValidateCode($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

function handleListReferrals($db) {
    // Prevent caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');

    requireAdmin();

    $limit = (int)($_GET['limit'] ?? 50);
    $offset = (int)($_GET['offset'] ?? 0);

    try {
        $stmt = $db->prepare("
            SELECT
                r.*,
                u1.name as referrer_name,
                u1.email as referrer_email,
                u2.name as referred_name,
                u2.email as referred_email
            FROM referrals r
            LEFT JOIN users u1 ON r.referrer_id = u1.id
            LEFT JOIN users u2 ON r.referred_user_id = u2.id
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $referrals = $stmt->fetchAll();

        // Get total
        $countStmt = $db->query("SELECT COUNT(*) as total FROM referrals");
        $total = $countStmt->fetch()['total'];

        sendJsonResponse(true, 'Referrals retrieved successfully', [
            'referrals' => $referrals,
            'total' => $total
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch referrals: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleUserReferrals($db) {
    // Prevent caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');

    $user = requireAuth();

    try {
        $stmt = $db->prepare("
            SELECT
                r.*,
                u.name as referred_name,
                u.email as referred_email
            FROM referrals r
            LEFT JOIN users u ON r.referred_user_id = u.id
            WHERE r.referrer_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$user['user_id']]);
        $referrals = $stmt->fetchAll();

        sendJsonResponse(true, 'User referrals retrieved successfully', ['referrals' => $referrals]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch referrals: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleUserReferralStats($db) {
    // Prevent caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');

    $user = requireAuth();

    try {
        // Get user's referral code
        $stmt = $db->prepare("SELECT referral_code FROM users WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch();

        // Total referrals
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM referrals WHERE referrer_id = ?");
        $stmt->execute([$user['user_id']]);
        $totalReferrals = $stmt->fetch()['total'];

        // Successful (completed) referrals
        $stmt = $db->prepare("SELECT COUNT(*) as successful FROM referrals WHERE referrer_id = ? AND status = 'completed'");
        $stmt->execute([$user['user_id']]);
        $successfulReferrals = $stmt->fetch()['successful'];

        // Total earnings (sum of rewards from completed referrals)
        $stmt = $db->prepare("SELECT COALESCE(SUM(reward), 0) as earnings FROM referrals WHERE referrer_id = ? AND status = 'completed'");
        $stmt->execute([$user['user_id']]);
        $totalEarnings = $stmt->fetch()['earnings'];

        sendJsonResponse(true, 'Referral stats retrieved successfully', [
            'referralCode' => $userData['referral_code'],
            'totalReferrals' => (int)$totalReferrals,
            'successfulReferrals' => (int)$successfulReferrals,
            'totalEarnings' => (float)$totalEarnings
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch referral stats: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleAllReferralStats($db) {
    // Prevent caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');

    requireAdmin();

    try {
        // Get all users with their referral counts
        $stmt = $db->query("
            SELECT
                u.id,
                u.name,
                u.email,
                u.referral_code,
                COUNT(r.id) as total_referrals,
                SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) as successful_referrals,
                COALESCE(SUM(CASE WHEN r.status = 'completed' THEN r.reward ELSE 0 END), 0) as total_earnings
            FROM users u
            LEFT JOIN referrals r ON u.id = r.referrer_id
            WHERE u.role = 'customer'
            GROUP BY u.id, u.name, u.email, u.referral_code
            HAVING COUNT(r.id) > 0 OR u.referral_code IS NOT NULL
            ORDER BY total_referrals DESC
        ");
        $usersWithReferrals = $stmt->fetchAll();

        // Overall stats
        $stmt = $db->query("SELECT COUNT(*) as total FROM referrals");
        $totalReferrals = $stmt->fetch()['total'];

        $stmt = $db->query("SELECT COUNT(*) as completed FROM referrals WHERE status = 'completed'");
        $completedReferrals = $stmt->fetch()['completed'];

        $stmt = $db->query("SELECT COUNT(*) as pending FROM referrals WHERE status = 'pending'");
        $pendingReferrals = $stmt->fetch()['pending'];

        // Top referrers
        $stmt = $db->query("
            SELECT
                u.name,
                u.email,
                COUNT(r.id) as referral_count
            FROM referrals r
            JOIN users u ON r.referrer_id = u.id
            GROUP BY r.referrer_id, u.name, u.email
            ORDER BY referral_count DESC
            LIMIT 10
        ");
        $topReferrers = $stmt->fetchAll();

        sendJsonResponse(true, 'All referral stats retrieved successfully', [
            'usersWithReferrals' => $usersWithReferrals,
            'totalReferrals' => (int)$totalReferrals,
            'completedReferrals' => (int)$completedReferrals,
            'pendingReferrals' => (int)$pendingReferrals,
            'topReferrers' => $topReferrers
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch referral stats: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleValidateCode($db) {
    $code = sanitizeInput($_GET['code'] ?? '');

    if (empty($code)) {
        sendJsonResponse(false, 'Referral code is required', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT id, name FROM users WHERE referral_code = ?");
        $stmt->execute([strtoupper($code)]);
        $user = $stmt->fetch();

        if ($user) {
            sendJsonResponse(true, 'Valid referral code', [
                'valid' => true,
                'referrerName' => $user['name']
            ]);
        } else {
            sendJsonResponse(true, 'Invalid referral code', ['valid' => false]);
        }

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to validate code: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}
?>
