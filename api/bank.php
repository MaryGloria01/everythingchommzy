<?php
// ============================================
// BANK ACCOUNTS API
// Handles: List, Create, Update, Delete bank accounts
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
        handleListBankAccounts($db);
        break;

    case 'active':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetActiveBankAccounts($db);
        break;

    case 'create':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleCreateBankAccount($db);
        break;

    case 'update':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUpdateBankAccount($db);
        break;

    case 'delete':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleDeleteBankAccount($db);
        break;

    case 'toggle':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleToggleBankAccount($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

function handleListBankAccounts($db) {
    requireAdmin();

    try {
        $stmt = $db->query("SELECT * FROM bank_accounts ORDER BY created_at DESC");
        $accounts = $stmt->fetchAll();

        sendJsonResponse(true, 'Bank accounts retrieved successfully', ['accounts' => $accounts]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch bank accounts: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleGetActiveBankAccounts($db) {
    // Public - used on checkout page
    try {
        $stmt = $db->query("SELECT id, bank_name, account_number, account_name FROM bank_accounts WHERE is_active = TRUE ORDER BY created_at");
        $accounts = $stmt->fetchAll();

        sendJsonResponse(true, 'Active bank accounts retrieved successfully', ['accounts' => $accounts]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch bank accounts: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleCreateBankAccount($db) {
    requireAdmin();
    $data = getRequestBody();

    $bankName = sanitizeInput($data['bankName'] ?? '');
    $accountNumber = sanitizeInput($data['accountNumber'] ?? '');
    $accountName = sanitizeInput($data['accountName'] ?? '');
    $isActive = isset($data['isActive']) ? (bool)$data['isActive'] : true;

    if (empty($bankName) || empty($accountNumber) || empty($accountName)) {
        sendJsonResponse(false, 'Bank name, account number, and account name are required', null, 400);
    }

    try {
        $id = 'BANK-' . strtoupper(bin2hex(random_bytes(4)));

        $stmt = $db->prepare("
            INSERT INTO bank_accounts (id, bank_name, account_number, account_name, is_active)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$id, $bankName, $accountNumber, $accountName, $isActive ? 1 : 0]);

        sendJsonResponse(true, 'Bank account added successfully', ['id' => $id], 201);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to create bank account: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleUpdateBankAccount($db) {
    requireAdmin();
    $data = getRequestBody();

    $id = sanitizeInput($data['id'] ?? '');
    $bankName = sanitizeInput($data['bankName'] ?? '');
    $accountNumber = sanitizeInput($data['accountNumber'] ?? '');
    $accountName = sanitizeInput($data['accountName'] ?? '');

    if (empty($id) || empty($bankName) || empty($accountNumber) || empty($accountName)) {
        sendJsonResponse(false, 'All fields are required', null, 400);
    }

    try {
        $stmt = $db->prepare("
            UPDATE bank_accounts
            SET bank_name = ?, account_number = ?, account_name = ?
            WHERE id = ?
        ");
        $stmt->execute([$bankName, $accountNumber, $accountName, $id]);

        if ($stmt->rowCount() === 0) {
            sendJsonResponse(false, 'Bank account not found', null, 404);
        }

        sendJsonResponse(true, 'Bank account updated successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update bank account: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleDeleteBankAccount($db) {
    requireAdmin();
    $data = getRequestBody();

    $id = sanitizeInput($data['id'] ?? '');

    if (empty($id)) {
        sendJsonResponse(false, 'Bank account ID is required', null, 400);
    }

    try {
        // Check if it's the last active account
        $stmt = $db->query("SELECT COUNT(*) as count FROM bank_accounts WHERE is_active = TRUE");
        $activeCount = $stmt->fetch()['count'];

        $stmt = $db->prepare("SELECT is_active FROM bank_accounts WHERE id = ?");
        $stmt->execute([$id]);
        $account = $stmt->fetch();

        if (!$account) {
            sendJsonResponse(false, 'Bank account not found', null, 404);
        }

        if ($account['is_active'] && $activeCount <= 1) {
            sendJsonResponse(false, 'Cannot delete the last active bank account', null, 400);
        }

        $stmt = $db->prepare("DELETE FROM bank_accounts WHERE id = ?");
        $stmt->execute([$id]);

        sendJsonResponse(true, 'Bank account deleted successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to delete bank account: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleToggleBankAccount($db) {
    requireAdmin();
    $data = getRequestBody();

    $id = sanitizeInput($data['id'] ?? '');
    $isActive = isset($data['isActive']) ? (bool)$data['isActive'] : null;

    if (empty($id) || $isActive === null) {
        sendJsonResponse(false, 'Bank account ID and active status are required', null, 400);
    }

    try {
        // If deactivating, check if it's the last active account
        if (!$isActive) {
            $stmt = $db->query("SELECT COUNT(*) as count FROM bank_accounts WHERE is_active = TRUE");
            $activeCount = $stmt->fetch()['count'];

            if ($activeCount <= 1) {
                sendJsonResponse(false, 'Cannot deactivate the last active bank account', null, 400);
            }
        }

        $stmt = $db->prepare("UPDATE bank_accounts SET is_active = ? WHERE id = ?");
        $stmt->execute([$isActive ? 1 : 0, $id]);

        if ($stmt->rowCount() === 0) {
            sendJsonResponse(false, 'Bank account not found', null, 404);
        }

        sendJsonResponse(true, $isActive ? 'Bank account activated' : 'Bank account deactivated');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to toggle bank account: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}
?>
