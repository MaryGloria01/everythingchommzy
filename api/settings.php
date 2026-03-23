<?php
// ============================================
// SETTINGS API
// Handles: Flash Deals settings, Site settings
// ============================================

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'get';

switch ($action) {
    case 'get':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetSettings($db);
        break;

    case 'update':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUpdateSettings($db);
        break;

    case 'flash-deals':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetFlashDeals($db);
        break;

    case 'update-flash-deals':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUpdateFlashDeals($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

// Create settings table if not exists
function ensureSettingsTable($db) {
    $db->exec("
        CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
}

function handleGetSettings($db) {
    ensureSettingsTable($db);

    try {
        $stmt = $db->query("SELECT setting_key, setting_value FROM settings");
        $rows = $stmt->fetchAll();

        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['setting_key']] = json_decode($row['setting_value'], true) ?? $row['setting_value'];
        }

        sendJsonResponse(true, 'Settings retrieved', $settings);
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to get settings: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleUpdateSettings($db) {
    requireAdmin();
    ensureSettingsTable($db);

    $data = getRequestBody();
    $key = sanitizeInput($data['key'] ?? '');
    $value = $data['value'] ?? '';

    if (empty($key)) {
        sendJsonResponse(false, 'Setting key is required', null, 400);
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO settings (setting_key, setting_value)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE setting_value = ?
        ");
        $jsonValue = json_encode($value);
        $stmt->execute([$key, $jsonValue, $jsonValue]);

        sendJsonResponse(true, 'Setting updated');
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update setting: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleGetFlashDeals($db) {
    ensureSettingsTable($db);

    try {
        $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'flash_deals'");
        $stmt->execute();
        $row = $stmt->fetch();

        $defaults = [
            'enabled' => true,
            'endDate' => '',
            'endTime' => '23:59',
            'title' => 'Flash Deals',
            'subtitle' => "Hurry, these deals won't last long!"
        ];

        if ($row) {
            $saved = json_decode($row['setting_value'], true);
            $settings = array_merge($defaults, $saved ?? []);
        } else {
            $settings = $defaults;
        }

        sendJsonResponse(true, 'Flash deals settings retrieved', $settings);
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to get flash deals settings: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleUpdateFlashDeals($db) {
    requireAdmin();
    ensureSettingsTable($db);

    $data = getRequestBody();

    $settings = [
        'enabled' => (bool)($data['enabled'] ?? true),
        'endDate' => sanitizeInput($data['endDate'] ?? ''),
        'endTime' => sanitizeInput($data['endTime'] ?? '23:59'),
        'title' => sanitizeInput($data['title'] ?? 'Flash Deals'),
        'subtitle' => sanitizeInput($data['subtitle'] ?? "Hurry, these deals won't last long!")
    ];

    try {
        $stmt = $db->prepare("
            INSERT INTO settings (setting_key, setting_value)
            VALUES ('flash_deals', ?)
            ON DUPLICATE KEY UPDATE setting_value = ?
        ");
        $jsonValue = json_encode($settings);
        $stmt->execute([$jsonValue, $jsonValue]);

        sendJsonResponse(true, 'Flash deals settings updated', $settings);
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update flash deals settings: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}
?>
