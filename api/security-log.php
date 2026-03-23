<?php
// ============================================
// SECURITY LOGGING & MONITORING API
// Handles: Log events, View logs, Alerts
// ============================================

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

// Ensure security_logs table exists
$db->exec("
    CREATE TABLE IF NOT EXISTS security_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50),
        event_type VARCHAR(100) NOT NULL,
        description TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSON,
        severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_event (event_type),
        INDEX idx_severity (severity),
        INDEX idx_created (created_at)
    )
");

switch ($action) {
    case 'list':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleListLogs($db);
        break;

    case 'stats':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleLogStats($db);
        break;

    case 'alerts':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetAlerts($db);
        break;

    case 'clear-old':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleClearOldLogs($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

// List security logs
function handleListLogs($db) {
    requireAdmin();

    $limit = (int)($_GET['limit'] ?? 50);
    $offset = (int)($_GET['offset'] ?? 0);
    $severity = $_GET['severity'] ?? null;
    $eventType = $_GET['event_type'] ?? null;
    $userId = $_GET['user_id'] ?? null;

    try {
        $where = "WHERE 1=1";
        $params = [];

        if ($severity) {
            $where .= " AND severity = ?";
            $params[] = $severity;
        }

        if ($eventType) {
            $where .= " AND event_type LIKE ?";
            $params[] = "%$eventType%";
        }

        if ($userId) {
            $where .= " AND user_id = ?";
            $params[] = $userId;
        }

        $stmt = $db->prepare("
            SELECT sl.*, u.name as user_name, u.email as user_email
            FROM security_logs sl
            LEFT JOIN users u ON sl.user_id = u.id
            $where
            ORDER BY sl.created_at DESC
            LIMIT ? OFFSET ?
        ");

        $paramIndex = 1;
        foreach ($params as $param) {
            $stmt->bindValue($paramIndex++, $param);
        }
        $stmt->bindValue($paramIndex++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($paramIndex, $offset, PDO::PARAM_INT);

        $stmt->execute();
        $logs = $stmt->fetchAll();

        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM security_logs $where");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        sendJsonResponse(true, 'Security logs retrieved', [
            'logs' => $logs,
            'total' => $total
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}

// Get log statistics
function handleLogStats($db) {
    requireAdmin();

    try {
        // Total events today
        $stmt = $db->query("SELECT COUNT(*) as count FROM security_logs WHERE DATE(created_at) = CURDATE()");
        $todayCount = $stmt->fetch()['count'];

        // Events by severity (last 7 days)
        $stmt = $db->query("
            SELECT severity, COUNT(*) as count
            FROM security_logs
            WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY severity
        ");
        $bySeverity = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        // Failed logins today
        $stmt = $db->query("
            SELECT COUNT(*) as count
            FROM security_logs
            WHERE event_type LIKE '%Failed%login%'
            AND DATE(created_at) = CURDATE()
        ");
        $failedLogins = $stmt->fetch()['count'];

        // Suspicious IPs (more than 10 failed attempts)
        $stmt = $db->query("
            SELECT ip_address, COUNT(*) as attempts
            FROM security_logs
            WHERE event_type LIKE '%Failed%'
            AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY ip_address
            HAVING attempts >= 5
            ORDER BY attempts DESC
            LIMIT 10
        ");
        $suspiciousIPs = $stmt->fetchAll();

        // Recent critical events
        $stmt = $db->query("
            SELECT * FROM security_logs
            WHERE severity IN ('high', 'critical')
            AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $criticalEvents = $stmt->fetchAll();

        // Events trend (last 7 days)
        $stmt = $db->query("
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM security_logs
            WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        ");
        $trend = $stmt->fetchAll();

        sendJsonResponse(true, 'Security statistics retrieved', [
            'today_count' => $todayCount,
            'by_severity' => $bySeverity,
            'failed_logins_today' => $failedLogins,
            'suspicious_ips' => $suspiciousIPs,
            'critical_events' => $criticalEvents,
            'trend' => $trend
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}

// Get security alerts
function handleGetAlerts($db) {
    requireAdmin();

    try {
        $alerts = [];

        // Check for brute force attempts
        $stmt = $db->query("
            SELECT ip_address, COUNT(*) as attempts
            FROM security_logs
            WHERE event_type LIKE '%Failed%'
            AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            GROUP BY ip_address
            HAVING attempts >= 5
        ");
        $bruteForce = $stmt->fetchAll();

        if (count($bruteForce) > 0) {
            $alerts[] = [
                'type' => 'brute_force',
                'severity' => 'high',
                'message' => count($bruteForce) . ' IP(s) with multiple failed attempts in last hour',
                'data' => $bruteForce
            ];
        }

        // Check for unusual login locations (multiple IPs for same user)
        $stmt = $db->query("
            SELECT user_id, COUNT(DISTINCT ip_address) as ip_count
            FROM security_logs
            WHERE event_type LIKE '%login%'
            AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY user_id
            HAVING ip_count > 3
        ");
        $multipleIPs = $stmt->fetchAll();

        if (count($multipleIPs) > 0) {
            $alerts[] = [
                'type' => 'multiple_locations',
                'severity' => 'medium',
                'message' => count($multipleIPs) . ' user(s) logged in from multiple IPs',
                'data' => $multipleIPs
            ];
        }

        // Check for 2FA disable attempts
        $stmt = $db->query("
            SELECT COUNT(*) as count
            FROM security_logs
            WHERE event_type LIKE '%2FA disable%'
            AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $twoFADisables = $stmt->fetch()['count'];

        if ($twoFADisables > 0) {
            $alerts[] = [
                'type' => '2fa_changes',
                'severity' => 'medium',
                'message' => $twoFADisables . ' 2FA disable attempt(s) in last 24 hours',
                'data' => ['count' => $twoFADisables]
            ];
        }

        // Check for admin password changes
        $stmt = $db->query("
            SELECT COUNT(*) as count
            FROM security_logs
            WHERE event_type LIKE '%password%'
            AND severity IN ('medium', 'high')
            AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        ");
        $passwordChanges = $stmt->fetch()['count'];

        if ($passwordChanges > 0) {
            $alerts[] = [
                'type' => 'password_changes',
                'severity' => 'low',
                'message' => $passwordChanges . ' password change(s) in last 24 hours',
                'data' => ['count' => $passwordChanges]
            ];
        }

        sendJsonResponse(true, 'Security alerts retrieved', [
            'alerts' => $alerts,
            'alert_count' => count($alerts)
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}

// Clear old logs (keep last 90 days)
function handleClearOldLogs($db) {
    requireAdmin();

    $data = getRequestBody();
    $days = (int)($data['days'] ?? 90);

    if ($days < 30) {
        sendJsonResponse(false, 'Must keep at least 30 days of logs', null, 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM security_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
        $stmt->execute([$days]);
        $deleted = $stmt->rowCount();

        logSecurityEvent($db, getAuthUser()['user_id'], "Cleared $deleted old security logs", $_SERVER['REMOTE_ADDR'] ?? '');

        sendJsonResponse(true, "Cleared $deleted log entries older than $days days");

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage($e->getMessage()), null, 500);
    }
}
?>
