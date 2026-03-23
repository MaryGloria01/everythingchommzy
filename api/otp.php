<?php
// ============================================
// OTP (One-Time Password) API
// Handles: Send OTP, Verify OTP, Resend OTP
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

// Create OTP table if not exists
try {
    $db->exec("
        CREATE TABLE IF NOT EXISTS otp_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp_code VARCHAR(6) NOT NULL,
            purpose VARCHAR(20) NOT NULL,
            expires_at DATETIME NOT NULL,
            verified TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email_purpose (email, purpose)
        )
    ");
} catch (Exception $e) {
    // Table might already exist, continue
}

// Resend API configuration
// IMPORTANT: Replace with your actual Resend API key from https://resend.com
define('RESEND_API_KEY', 'your_resend_api_key_here');
define('RESEND_FROM_EMAIL', 'Your Brand <noreply@yourdomain.com>');

// Handle actions
switch ($action) {
    case 'send':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleSendOTP($db);
        break;

    case 'verify':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleVerifyOTP($db);
        break;

    case 'resend':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleSendOTP($db); // Same as send
        break;

    case 'reset-password':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleResetPassword($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

// Generate 6-digit OTP
function generateOTP() {
    return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

// Send OTP email via Resend API
function sendOTPEmail($email, $otp, $purpose) {
    $subject = $purpose === 'signup'
        ? 'Verify Your Email - Everything Chommzy'
        : 'Reset Your Password - Everything Chommzy';

    $purposeText = $purpose === 'signup'
        ? 'complete your registration'
        : 'reset your password';

    $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f5f5f5;">
        <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#1a365d 0%,#2d4a6f 100%);padding:30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:24px;">Everything Chommzy</h1>
            </div>
            <div style="padding:40px 30px;text-align:center;">
                <h2 style="color:#1a365d;margin:0 0 10px;font-size:22px;">Your Verification Code</h2>
                <p style="color:#666;margin:0 0 30px;font-size:15px;">Use this code to ' . $purposeText . '</p>
                <div style="background:#f8f9fa;border-radius:12px;padding:25px;margin-bottom:30px;">
                    <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a365d;font-family:monospace;">' . $otp . '</span>
                </div>
                <p style="color:#999;font-size:13px;margin:0;">This code expires in <strong>10 minutes</strong></p>
            </div>
        </div>
    </body></html>';

    $data = [
        'from' => RESEND_FROM_EMAIL,
        'to' => [$email],
        'subject' => $subject,
        'html' => $html
    ];

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . RESEND_API_KEY,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode >= 200 && $httpCode < 300;
}

// Handle Send OTP
function handleSendOTP($db) {
    $data = getRequestBody();
    $email = sanitizeInput($data['email'] ?? '');
    $purpose = sanitizeInput($data['purpose'] ?? 'signup');

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse(false, 'Valid email is required', null, 400);
    }

    // For signup, check if email already exists
    if ($purpose === 'signup') {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            sendJsonResponse(false, 'Email already registered. Please login instead.', null, 400);
        }
    }

    // For password reset, check if email exists
    if ($purpose === 'reset_password') {
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if (!$stmt->fetch()) {
            sendJsonResponse(false, 'No account found with this email address.', null, 404);
        }
    }

    try {
        // Delete old OTPs for this email
        $stmt = $db->prepare("DELETE FROM otp_codes WHERE email = ? AND purpose = ?");
        $stmt->execute([$email, $purpose]);

        // Generate and store new OTP
        $otp = generateOTP();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        $stmt = $db->prepare("INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([$email, $otp, $purpose, $expiresAt]);

        // Send email
        if (sendOTPEmail($email, $otp, $purpose)) {
            sendJsonResponse(true, 'Verification code sent to your email', ['email' => $email, 'expiresIn' => 600]);
        } else {
            sendJsonResponse(false, 'Failed to send email. Please try again.', null, 500);
        }

    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to process request. Please try again.', null, 500);
    }
}

// Handle Verify OTP
function handleVerifyOTP($db) {
    $data = getRequestBody();
    $email = sanitizeInput($data['email'] ?? '');
    $otp = sanitizeInput($data['otp'] ?? '');
    $purpose = sanitizeInput($data['purpose'] ?? 'signup');

    if (empty($email) || empty($otp)) {
        sendJsonResponse(false, 'Email and verification code are required', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT id, otp_code, expires_at FROM otp_codes WHERE email = ? AND purpose = ? AND verified = 0 ORDER BY created_at DESC LIMIT 1");
        $stmt->execute([$email, $purpose]);
        $record = $stmt->fetch();

        if (!$record) {
            sendJsonResponse(false, 'No pending verification found. Please request a new code.', null, 400);
        }

        if (strtotime($record['expires_at']) < time()) {
            sendJsonResponse(false, 'Verification code has expired. Please request a new one.', null, 400);
        }

        if ($record['otp_code'] !== $otp) {
            sendJsonResponse(false, 'Invalid verification code. Please try again.', null, 400);
        }

        // Mark as verified
        $stmt = $db->prepare("UPDATE otp_codes SET verified = 1 WHERE id = ?");
        $stmt->execute([$record['id']]);

        sendJsonResponse(true, 'Email verified successfully', ['email' => $email, 'verified' => true]);

    } catch (Exception $e) {
        sendJsonResponse(false, 'Verification failed. Please try again.', null, 500);
    }
}

// Handle Reset Password
function handleResetPassword($db) {
    $data = getRequestBody();
    $email = sanitizeInput($data['email'] ?? '');
    $otp = sanitizeInput($data['otp'] ?? '');
    $newPassword = $data['newPassword'] ?? '';

    if (empty($email) || empty($otp) || empty($newPassword)) {
        sendJsonResponse(false, 'Email, verification code, and new password are required', null, 400);
    }

    if (strlen($newPassword) < 8) {
        sendJsonResponse(false, 'Password must be at least 8 characters', null, 400);
    }

    try {
        // Verify OTP (allow verified = 1 since user already verified it in previous step)
        $stmt = $db->prepare("SELECT id FROM otp_codes WHERE email = ? AND otp_code = ? AND purpose = 'reset_password' AND expires_at > NOW() LIMIT 1");
        $stmt->execute([$email, $otp]);
        $otpRecord = $stmt->fetch();

        if (!$otpRecord) {
            sendJsonResponse(false, 'Invalid or expired verification code', null, 400);
        }

        // Update password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE email = ?");
        $stmt->execute([$hashedPassword, $email]);

        // Mark OTP as used
        $stmt = $db->prepare("UPDATE otp_codes SET verified = 1 WHERE id = ?");
        $stmt->execute([$otpRecord['id']]);

        sendJsonResponse(true, 'Password reset successfully. You can now login.');

    } catch (Exception $e) {
        sendJsonResponse(false, 'Failed to reset password. Please try again.', null, 500);
    }
}
?>
