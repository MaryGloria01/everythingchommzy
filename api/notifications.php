<?php
// ============================================
// NOTIFICATIONS API
// Handles: List, Create, Mark Read, Announcements
// ============================================

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleListNotifications($db);
        break;

    case 'mark-read':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleMarkRead($db);
        break;

    case 'mark-all-read':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleMarkAllRead($db);
        break;

    case 'delete':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleDeleteNotification($db);
        break;

    case 'send-announcement':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleSendAnnouncement($db);
        break;

    case 'announcements':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleListAnnouncements($db);
        break;

    case 'delete-announcement':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleDeleteAnnouncement($db);
        break;

    case 'unread-count':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUnreadCount($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

function handleListNotifications($db) {
    $user = requireAuth();

    try {
        $stmt = $db->prepare("
            SELECT id, title, message, type, is_read, created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$user['user_id']]);
        $notifications = $stmt->fetchAll();

        sendJsonResponse(true, 'Notifications retrieved successfully', [
            'notifications' => $notifications
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch notifications: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleMarkRead($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $notificationId = sanitizeInput($data['notificationId'] ?? '');

    if (empty($notificationId)) {
        sendJsonResponse(false, 'Notification ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("
            UPDATE notifications
            SET is_read = 1
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$notificationId, $user['user_id']]);

        sendJsonResponse(true, 'Notification marked as read');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update notification: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleMarkAllRead($db) {
    $user = requireAuth();

    try {
        $stmt = $db->prepare("
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = ? AND is_read = 0
        ");
        $stmt->execute([$user['user_id']]);

        sendJsonResponse(true, 'All notifications marked as read');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update notifications: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleDeleteNotification($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $notificationId = sanitizeInput($data['notificationId'] ?? '');

    if (empty($notificationId)) {
        sendJsonResponse(false, 'Notification ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("
            DELETE FROM notifications
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$notificationId, $user['user_id']]);

        sendJsonResponse(true, 'Notification deleted');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to delete notification: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleSendAnnouncement($db) {
    requireAdmin();
    $data = getRequestBody();

    $title = sanitizeInput($data['title'] ?? '');
    $message = sanitizeInput($data['message'] ?? '');
    $recipients = sanitizeInput($data['recipients'] ?? 'all');
    $userIds = $data['userIds'] ?? [];

    if (empty($title) || empty($message)) {
        sendJsonResponse(false, 'Title and message are required', null, 400);
    }

    try {
        // Get users based on recipient setting
        if ($recipients === 'selected' && !empty($userIds)) {
            // Get specific users
            $placeholders = str_repeat('?,', count($userIds) - 1) . '?';
            $stmt = $db->prepare("SELECT id FROM users WHERE id IN ($placeholders) AND role != 'admin'");
            $stmt->execute($userIds);
        } else {
            // Get all non-admin users
            $stmt = $db->query("SELECT id FROM users WHERE role != 'admin'");
        }
        $users = $stmt->fetchAll();

        $recipientCount = 0;
        $announcementId = 'ANN-' . strtoupper(base_convert(time(), 10, 36));
        $fullMessage = "📢 $title: $message";

        // Send notification to each user
        $insertStmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, announcement_id)
            VALUES (?, ?, ?, 'announcement', ?)
        ");

        foreach ($users as $user) {
            $insertStmt->execute([$user['id'], $title, $fullMessage, $announcementId]);
            $recipientCount++;
        }

        // Save announcement record
        $stmt = $db->prepare("
            INSERT INTO announcements (id, title, message, recipient_count)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$announcementId, $title, $message, $recipientCount]);

        sendJsonResponse(true, "Announcement sent to $recipientCount users", [
            'announcementId' => $announcementId,
            'recipientCount' => $recipientCount
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to send announcement: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleListAnnouncements($db) {
    requireAdmin();

    try {
        $stmt = $db->query("
            SELECT id, title, message, recipient_count, created_at
            FROM announcements
            ORDER BY created_at DESC
            LIMIT 50
        ");
        $announcements = $stmt->fetchAll();

        sendJsonResponse(true, 'Announcements retrieved successfully', [
            'announcements' => $announcements
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch announcements: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleDeleteAnnouncement($db) {
    requireAdmin();
    $data = getRequestBody();

    $announcementId = sanitizeInput($data['announcementId'] ?? '');

    if (empty($announcementId)) {
        sendJsonResponse(false, 'Announcement ID is required', null, 400);
    }

    try {
        // Delete notifications related to this announcement
        $stmt = $db->prepare("DELETE FROM notifications WHERE announcement_id = ?");
        $stmt->execute([$announcementId]);

        // Delete the announcement record
        $stmt = $db->prepare("DELETE FROM announcements WHERE id = ?");
        $stmt->execute([$announcementId]);

        sendJsonResponse(true, 'Announcement deleted successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to delete announcement: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleUnreadCount($db) {
    $user = requireAuth();

    try {
        $stmt = $db->prepare("
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = ? AND is_read = 0
        ");
        $stmt->execute([$user['user_id']]);
        $result = $stmt->fetch();

        sendJsonResponse(true, 'Unread count retrieved', [
            'unreadCount' => (int)$result['count']
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to get count: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}
?>
