<?php
// ============================================
// AUTHENTICATION API
// Handles: Login, Signup, Password Reset
// ============================================

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Ensure login_attempts table exists for rate limiting
$db->exec("
    CREATE TABLE IF NOT EXISTS login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        email VARCHAR(255),
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip_time (ip_address, attempted_at)
    )
");

// Rate limiting function for login
function checkLoginRateLimit($db, $ip, $email = null) {
    // Clean old attempts (older than 15 minutes)
    $db->exec("DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)");

    // Check attempts from this IP in last 15 minutes
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM login_attempts WHERE ip_address = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)");
    $stmt->execute([$ip]);
    $result = $stmt->fetch();

    if ($result['count'] >= 10) {
        sendJsonResponse(false, 'Too many login attempts. Please try again in 15 minutes.', null, 429);
    }
}

function recordLoginAttempt($db, $ip, $email = null) {
    $stmt = $db->prepare("INSERT INTO login_attempts (ip_address, email) VALUES (?, ?)");
    $stmt->execute([$ip, $email]);
}

// Generic rate limiting function for any action
function checkRateLimit($db, $ip, $action, $maxAttempts = 5, $windowMinutes = 15) {
    // Clean old attempts
    $db->exec("DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL $windowMinutes MINUTE)");

    // Check attempts from this IP for this action
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM login_attempts WHERE ip_address = ? AND email = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)");
    $stmt->execute([$ip, $action, $windowMinutes]);
    $result = $stmt->fetch();

    if ($result['count'] >= $maxAttempts) {
        sendJsonResponse(false, "Too many attempts. Please try again in $windowMinutes minutes.", null, 429);
    }

    // Record this attempt
    $stmt = $db->prepare("INSERT INTO login_attempts (ip_address, email) VALUES (?, ?)");
    $stmt->execute([$ip, $action]);
}

switch ($action) {
    case 'login':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        checkLoginRateLimit($db, $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
        handleLogin($db);
        break;

    case 'signup':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        checkRateLimit($db, $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 'signup', 5, 15);
        handleSignup($db);
        break;

    case 'admin-login':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        checkLoginRateLimit($db, $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
        handleAdminLogin($db);
        break;

    case 'forgot-password':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        checkRateLimit($db, $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 'forgot-password', 3, 15);
        handleForgotPassword($db);
        break;

    case 'reset-password':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        checkRateLimit($db, $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 'reset-password', 5, 15);
        handleResetPassword($db);
        break;

    case 'verify-token':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleVerifyToken();
        break;

    case 'update-profile':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUpdateProfile($db);
        break;

    case 'change-password':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleChangePassword($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

function handleLogin($db) {
    $data = getRequestBody();

    $email = sanitizeInput($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        sendJsonResponse(false, 'Email and password are required', null, 400);
    }

    if (!validateEmail($email)) {
        sendJsonResponse(false, 'Invalid email format', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND role = 'customer'");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            // Generic error message - don't reveal if account exists
            $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
            recordLoginAttempt($db, $ip, $email);
            logSecurityEvent($db, null, "Failed login attempt for: $email", $ip, 'medium', 'failed_login');
            sendJsonResponse(false, 'Invalid email or password', null, 401);
        }

        $ip = $_SERVER['REMOTE_ADDR'] ?? '';

        // Check if 2FA is enabled for this user
        $stmt = $db->prepare("SELECT is_enabled FROM two_factor_auth WHERE user_id = ? AND is_enabled = TRUE");
        $stmt->execute([$user['id']]);
        $has2FA = $stmt->fetch();

        if ($has2FA) {
            // Generate temporary token for 2FA verification
            $tempPayload = [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'pending_2fa' => true,
                'exp' => time() + 300 // 5 minutes
            ];
            $tempToken = base64_encode(json_encode($tempPayload)) . '.' . hash_hmac('sha256', json_encode($tempPayload), JWT_SECRET);

            logSecurityEvent($db, $user['id'], 'Customer login - 2FA required', $ip, 'low', 'login_2fa_pending');

            sendJsonResponse(true, '2FA verification required', [
                'requires_2fa' => true,
                'temp_token' => $tempToken
            ]);
        }

        // Generate token and set httpOnly cookie
        $token = generateToken($user['id'], $user['email'], $user['role']);
        setAuthCookie($token);

        // Log successful login
        logSecurityEvent($db, $user['id'], 'Successful customer login', $ip, 'low', 'successful_login');

        // Return user data (without password)
        unset($user['password']);
        $user['token'] = $token;

        sendJsonResponse(true, 'Login successful', $user);

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage('Login failed: ' . safeErrorMessage($e->getMessage()), 'Login failed. Please try again.'), null, 500);
    }
}

function handleAdminLogin($db) {
    $data = getRequestBody();

    $email = sanitizeInput($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';

    if (empty($email) || empty($password)) {
        sendJsonResponse(false, 'Email and password are required', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND role = 'admin'");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            // Log failed attempt
            logSecurityEvent($db, null, "Failed admin login attempt for: $email", $ip, 'medium', 'failed_login');
            sendJsonResponse(false, 'Invalid credentials', null, 401);
        }

        // Check if 2FA is enabled
        $stmt = $db->prepare("SELECT is_enabled FROM two_factor_auth WHERE user_id = ? AND is_enabled = TRUE");
        $stmt->execute([$user['id']]);
        $has2FA = $stmt->fetch();

        if ($has2FA) {
            // Generate temporary token for 2FA verification
            $tempPayload = [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'pending_2fa' => true,
                'exp' => time() + 300 // 5 minutes
            ];
            $tempToken = base64_encode(json_encode($tempPayload)) . '.' . hash_hmac('sha256', json_encode($tempPayload), JWT_SECRET);

            logSecurityEvent($db, $user['id'], 'Admin login - 2FA required', $ip, 'low', 'login_2fa_pending');

            sendJsonResponse(true, '2FA verification required', [
                'requires_2fa' => true,
                'temp_token' => $tempToken
            ]);
        }

        // Generate token and set httpOnly cookie
        $token = generateToken($user['id'], $user['email'], $user['role']);
        setAuthCookie($token);

        // Log successful login
        logSecurityEvent($db, $user['id'], 'Successful admin login', $ip, 'low', 'successful_login');

        // Return user data (without password)
        unset($user['password']);
        $user['token'] = $token;

        sendJsonResponse(true, 'Admin login successful', $user);

    } catch (PDOException $e) {
        sendJsonResponse(false, safeErrorMessage('Login failed: ' . safeErrorMessage($e->getMessage()), 'Login failed. Please try again.'), null, 500);
    }
}

function handleSignup($db) {
    $data = getRequestBody();

    $name = sanitizeInput($data['name'] ?? '');
    $email = sanitizeInput($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $phone = sanitizeInput($data['phone'] ?? '');
    $referralCode = sanitizeInput($data['referralCode'] ?? '');

    // Validation
    if (empty($name) || empty($email) || empty($password)) {
        sendJsonResponse(false, 'Name, email, and password are required', null, 400);
    }

    if (strlen($name) < 2) {
        sendJsonResponse(false, 'Name must be at least 2 characters', null, 400);
    }

    if (!validateEmail($email)) {
        sendJsonResponse(false, 'Invalid email format', null, 400);
    }

    if (strlen($password) < 8) {
        sendJsonResponse(false, 'Password must be at least 8 characters', null, 400);
    }

    // Strong password requirements
    if (!preg_match('/[A-Z]/', $password)) {
        sendJsonResponse(false, 'Password must include at least 1 uppercase letter', null, 400);
    }
    if (!preg_match('/[a-z]/', $password)) {
        sendJsonResponse(false, 'Password must include at least 1 lowercase letter', null, 400);
    }
    if (!preg_match('/[0-9]/', $password)) {
        sendJsonResponse(false, 'Password must include at least 1 number', null, 400);
    }
    if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
        sendJsonResponse(false, 'Password must include at least 1 special character', null, 400);
    }

    try {
        // Check if email exists
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            sendJsonResponse(false, 'Email already registered. Please login.', null, 409);
        }

        // Generate user ID and referral code
        $userId = 'USR-' . strtoupper(bin2hex(random_bytes(4)));
        $userReferralCode = generateReferralCode($name);
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Check referral code
        $referrerId = null;
        if (!empty($referralCode)) {
            $stmt = $db->prepare("SELECT id, name FROM users WHERE referral_code = ?");
            $stmt->execute([strtoupper($referralCode)]);
            $referrer = $stmt->fetch();

            if ($referrer) {
                $referrerId = $referrer['id'];
            }
        }

        // Insert new user
        $stmt = $db->prepare("
            INSERT INTO users (id, name, email, password, phone, role, referral_code, referred_by)
            VALUES (?, ?, ?, ?, ?, 'customer', ?, ?)
        ");
        $stmt->execute([$userId, $name, $email, $hashedPassword, $phone, $userReferralCode, $referrerId]);

        // If referred, create referral record
        if ($referrerId) {
            $stmt = $db->prepare("
                INSERT INTO referrals (referrer_id, referred_user_id, referred_user_name, status)
                VALUES (?, ?, ?, 'pending')
            ");
            $stmt->execute([$referrerId, $userId, $name]);
        }

        // Generate token
        $token = generateToken($userId, $email, 'customer');

        $userData = [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'role' => 'customer',
            'referral_code' => $userReferralCode,
            'token' => $token
        ];

        sendJsonResponse(true, 'Account created successfully!', $userData, 201);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Signup failed: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleForgotPassword($db) {
    $data = getRequestBody();
    $email = sanitizeInput($data['email'] ?? '');

    if (empty($email) || !validateEmail($email)) {
        sendJsonResponse(false, 'Valid email is required', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT id, name FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            // Don't reveal if email exists
            sendJsonResponse(true, 'If an account exists with this email, you will receive a password reset link.');
        }

        // Generate reset token
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        // Delete old tokens for this email
        $stmt = $db->prepare("DELETE FROM password_resets WHERE email = ?");
        $stmt->execute([$email]);

        // Insert new token
        $stmt = $db->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
        $stmt->execute([$email, $token, $expiresAt]);

        // In production, send email here
        // For now, return the token (you should integrate with email service)
        $resetLink = SITE_URL . '/forgot-password.html?token=' . $token;

        // In production, you would send an email instead of returning the link
        sendJsonResponse(true, 'Password reset link has been sent to your email.', [
            'debug_link' => $resetLink // Remove this in production!
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to process request: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleResetPassword($db) {
    $data = getRequestBody();
    $token = sanitizeInput($data['token'] ?? '');
    $newPassword = $data['password'] ?? '';

    if (empty($token) || empty($newPassword)) {
        sendJsonResponse(false, 'Token and new password are required', null, 400);
    }

    if (strlen($newPassword) < 8) {
        sendJsonResponse(false, 'Password must be at least 8 characters', null, 400);
    }

    try {
        $stmt = $db->prepare("
            SELECT * FROM password_resets
            WHERE token = ? AND expires_at > NOW() AND used = FALSE
        ");
        $stmt->execute([$token]);
        $reset = $stmt->fetch();

        if (!$reset) {
            sendJsonResponse(false, 'Invalid or expired reset token', null, 400);
        }

        // Update password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE email = ?");
        $stmt->execute([$hashedPassword, $reset['email']]);

        // Mark token as used
        $stmt = $db->prepare("UPDATE password_resets SET used = TRUE WHERE token = ?");
        $stmt->execute([$token]);

        sendJsonResponse(true, 'Password has been reset successfully. Please login.');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to reset password: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleVerifyToken() {
    $user = getAuthUser();
    if ($user) {
        sendJsonResponse(true, 'Token is valid', $user);
    } else {
        sendJsonResponse(false, 'Invalid or expired token', null, 401);
    }
}

function handleUpdateProfile($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $name = sanitizeInput($data['name'] ?? '');
    $phone = sanitizeInput($data['phone'] ?? '');

    if (empty($name)) {
        sendJsonResponse(false, 'Name is required', null, 400);
    }

    try {
        $stmt = $db->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
        $stmt->execute([$name, $phone, $user['user_id']]);

        // Get updated user
        $stmt = $db->prepare("SELECT id, name, email, phone, role, referral_code FROM users WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $updatedUser = $stmt->fetch();

        sendJsonResponse(true, 'Profile updated successfully', $updatedUser);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update profile: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleChangePassword($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $currentPassword = $data['currentPassword'] ?? '';
    $newPassword = $data['newPassword'] ?? '';

    if (empty($currentPassword) || empty($newPassword)) {
        sendJsonResponse(false, 'Current and new passwords are required', null, 400);
    }

    if (strlen($newPassword) < 8) {
        sendJsonResponse(false, 'New password must be at least 8 characters', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch();

        if (!password_verify($currentPassword, $userData['password'])) {
            logSecurityEvent($db, $user['user_id'], 'Failed password change - wrong current password', $_SERVER['REMOTE_ADDR'] ?? '', 'medium', 'failed_password_change');
            sendJsonResponse(false, 'Current password is incorrect', null, 401);
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$hashedPassword, $user['user_id']]);

        // Log successful password change
        logSecurityEvent($db, $user['user_id'], 'Password changed successfully', $_SERVER['REMOTE_ADDR'] ?? '', 'medium', 'password_changed');

        sendJsonResponse(true, 'Password changed successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to change password: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}
?>
