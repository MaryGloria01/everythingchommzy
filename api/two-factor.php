<?php
// ============================================
// TWO-FACTOR AUTHENTICATION API
// Handles: Setup 2FA, Verify 2FA, Disable 2FA
// ============================================

require_once 'config.php';

// Get database connection
try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    sendJsonResponse(false, 'Database connection failed', null, 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Create 2FA table if not exists (without foreign key constraint)
try {
    $db->exec("
        CREATE TABLE IF NOT EXISTS two_factor_auth (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL,
            secret_key VARCHAR(32) NOT NULL,
            is_enabled TINYINT(1) DEFAULT 0,
            backup_codes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user (user_id)
        )
    ");
} catch (Exception $e) {
    // Table might already exist, continue
}

// Handle actions
switch ($action) {
    case 'setup':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleSetup2FA($db);
        break;

    case 'enable':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleEnable2FA($db);
        break;

    case 'disable':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleDisable2FA($db);
        break;

    case 'status':
        handleStatus2FA($db);
        break;

    case 'verify-login':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleVerifyLogin2FA($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

// Generate a random base32 secret key
function generateSecretKey($length = 16) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $secret = '';
    for ($i = 0; $i < $length; $i++) {
        $secret .= $chars[random_int(0, 31)];
    }
    return $secret;
}

// Base32 decode
function base32Decode($input) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $input = strtoupper($input);
    $buffer = 0;
    $bitsLeft = 0;
    $output = '';

    for ($i = 0; $i < strlen($input); $i++) {
        $val = strpos($chars, $input[$i]);
        if ($val === false) continue;

        $buffer = ($buffer << 5) | $val;
        $bitsLeft += 5;

        if ($bitsLeft >= 8) {
            $bitsLeft -= 8;
            $output .= chr(($buffer >> $bitsLeft) & 0xFF);
        }
    }

    return $output;
}

// Generate TOTP code
function generateTOTP($secret, $timeSlice = null) {
    if ($timeSlice === null) {
        $timeSlice = floor(time() / 30);
    }

    $secret = base32Decode($secret);
    $time = pack('N*', 0, $timeSlice);
    $hmac = hash_hmac('sha1', $time, $secret, true);
    $offset = ord(substr($hmac, -1)) & 0x0F;

    $code = (
        ((ord($hmac[$offset]) & 0x7F) << 24) |
        ((ord($hmac[$offset + 1]) & 0xFF) << 16) |
        ((ord($hmac[$offset + 2]) & 0xFF) << 8) |
        (ord($hmac[$offset + 3]) & 0xFF)
    ) % 1000000;

    return str_pad($code, 6, '0', STR_PAD_LEFT);
}

// Verify TOTP code (with time window tolerance)
function verifyTOTP($secret, $code, $window = 1) {
    $timeSlice = floor(time() / 30);
    for ($i = -$window; $i <= $window; $i++) {
        if (generateTOTP($secret, $timeSlice + $i) === $code) {
            return true;
        }
    }
    return false;
}

// Generate backup codes
function generateBackupCodes($count = 8) {
    $codes = [];
    for ($i = 0; $i < $count; $i++) {
        $codes[] = strtoupper(bin2hex(random_bytes(4)));
    }
    return $codes;
}

// Setup 2FA
function handleSetup2FA($db) {
    $user = requireAuth();
    if (!$user) {
        sendJsonResponse(false, 'Authentication required', null, 401);
    }

    try {
        $secret = generateSecretKey();
        $backupCodes = generateBackupCodes();

        // Check if user already has 2FA setup
        $stmt = $db->prepare("SELECT id FROM two_factor_auth WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $db->prepare("UPDATE two_factor_auth SET secret_key = ?, backup_codes = ?, is_enabled = 0 WHERE user_id = ?");
            $stmt->execute([$secret, json_encode($backupCodes), $user['user_id']]);
        } else {
            $stmt = $db->prepare("INSERT INTO two_factor_auth (user_id, secret_key, backup_codes) VALUES (?, ?, ?)");
            $stmt->execute([$user['user_id'], $secret, json_encode($backupCodes)]);
        }

        $issuer = urlencode(SITE_NAME);
        $email = urlencode($user['email']);
        $otpauthUrl = "otpauth://totp/{$issuer}:{$email}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";

        sendJsonResponse(true, '2FA setup initiated', [
            'secret' => $secret,
            'otpauth_url' => $otpauthUrl,
            'backup_codes' => $backupCodes,
            'qr_url' => "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" . urlencode($otpauthUrl)
        ]);

    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to setup 2FA. Please try again.', null, 500);
    }
}

// Enable 2FA after verifying code
function handleEnable2FA($db) {
    $user = requireAuth();
    if (!$user) {
        sendJsonResponse(false, 'Authentication required', null, 401);
    }

    $data = getRequestBody();
    $code = sanitizeInput($data['code'] ?? '');

    if (empty($code) || strlen($code) !== 6) {
        sendJsonResponse(false, 'Valid 6-digit code is required', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT secret_key FROM two_factor_auth WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $twoFactor = $stmt->fetch();

        if (!$twoFactor) {
            sendJsonResponse(false, 'Please setup 2FA first', null, 400);
        }

        if (!verifyTOTP($twoFactor['secret_key'], $code)) {
            sendJsonResponse(false, 'Invalid verification code', null, 401);
        }

        $stmt = $db->prepare("UPDATE two_factor_auth SET is_enabled = 1 WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);

        sendJsonResponse(true, '2FA has been enabled successfully');

    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to enable 2FA. Please try again.', null, 500);
    }
}

// Disable 2FA
function handleDisable2FA($db) {
    $user = requireAuth();
    if (!$user) {
        sendJsonResponse(false, 'Authentication required', null, 401);
    }

    $data = getRequestBody();
    $code = sanitizeInput($data['code'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($code) || empty($password)) {
        sendJsonResponse(false, 'Verification code and password are required', null, 400);
    }

    try {
        // Verify password
        $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch();

        if (!$userData || !password_verify($password, $userData['password'])) {
            sendJsonResponse(false, 'Invalid password', null, 401);
        }

        // Verify 2FA code
        $stmt = $db->prepare("SELECT secret_key FROM two_factor_auth WHERE user_id = ? AND is_enabled = 1");
        $stmt->execute([$user['user_id']]);
        $twoFactor = $stmt->fetch();

        if (!$twoFactor) {
            sendJsonResponse(false, '2FA is not enabled', null, 400);
        }

        if (!verifyTOTP($twoFactor['secret_key'], $code)) {
            sendJsonResponse(false, 'Invalid verification code', null, 401);
        }

        $stmt = $db->prepare("DELETE FROM two_factor_auth WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);

        sendJsonResponse(true, '2FA has been disabled');

    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to disable 2FA. Please try again.', null, 500);
    }
}

// Check 2FA status
function handleStatus2FA($db) {
    $user = requireAuth();
    if (!$user) {
        sendJsonResponse(false, 'Authentication required', null, 401);
    }

    try {
        $stmt = $db->prepare("SELECT is_enabled, created_at FROM two_factor_auth WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $twoFactor = $stmt->fetch();

        sendJsonResponse(true, '2FA status retrieved', [
            'enabled' => $twoFactor ? (bool)$twoFactor['is_enabled'] : false,
            'setup_date' => $twoFactor ? $twoFactor['created_at'] : null
        ]);

    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to get 2FA status', null, 500);
    }
}

// Verify 2FA during login
function handleVerifyLogin2FA($db) {
    $data = getRequestBody();
    $tempToken = $data['temp_token'] ?? '';
    $code = sanitizeInput($data['code'] ?? '');

    if (empty($tempToken) || empty($code)) {
        sendJsonResponse(false, 'Temporary token and verification code are required', null, 400);
    }

    $payload = verifyToken($tempToken);
    if (!$payload || !isset($payload['pending_2fa']) || !$payload['pending_2fa']) {
        sendJsonResponse(false, 'Invalid or expired session', null, 401);
    }

    try {
        $stmt = $db->prepare("SELECT secret_key, backup_codes FROM two_factor_auth WHERE user_id = ? AND is_enabled = 1");
        $stmt->execute([$payload['user_id']]);
        $twoFactor = $stmt->fetch();

        if (!$twoFactor) {
            sendJsonResponse(false, '2FA not configured', null, 400);
        }

        $isValid = verifyTOTP($twoFactor['secret_key'], $code);

        // Check backup codes if TOTP fails
        if (!$isValid && strlen($code) === 8) {
            $backupCodes = json_decode($twoFactor['backup_codes'], true) ?? [];
            $codeIndex = array_search(strtoupper($code), $backupCodes);

            if ($codeIndex !== false) {
                unset($backupCodes[$codeIndex]);
                $stmt = $db->prepare("UPDATE two_factor_auth SET backup_codes = ? WHERE user_id = ?");
                $stmt->execute([json_encode(array_values($backupCodes)), $payload['user_id']]);
                $isValid = true;
            }
        }

        if (!$isValid) {
            sendJsonResponse(false, 'Invalid verification code', null, 401);
        }

        // Generate full auth token
        $token = generateToken($payload['user_id'], $payload['email'], $payload['role']);

        // Get user data
        $stmt = $db->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch();
        $user['token'] = $token;

        sendJsonResponse(true, 'Login successful', $user);

    } catch (Exception $e) {
        sendJsonResponse(false, 'Verification failed. Please try again.', null, 500);
    }
}
?>
