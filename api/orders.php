<?php
// ============================================
// ORDERS API
// Handles: Create, List, Update orders
// ============================================

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        // Accept both GET and POST (POST bypasses cache)
        handleListOrders($db);
        break;

    case 'get':
        // Accept both GET and POST (POST bypasses cache)
        handleGetOrder($db);
        break;

    case 'create':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleCreateOrder($db);
        break;

    case 'update-status':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUpdateOrderStatus($db);
        break;

    case 'confirm-payment':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleConfirmPayment($db);
        break;

    case 'user-orders':
        // Accept both GET and POST (POST bypasses cache)
        handleUserOrders($db);
        break;

    case 'stats':
        // Accept both GET and POST (POST bypasses cache)
        handleOrderStats($db);
        break;

    case 'confirm-receipt':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleConfirmReceipt($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

function handleListOrders($db) {
    // Prevent caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');

    requireAdmin();

    $status = $_GET['status'] ?? null;
    $paymentStatus = $_GET['payment_status'] ?? null;
    $limit = (int)($_GET['limit'] ?? 50);
    $offset = (int)($_GET['offset'] ?? 0);

    try {
        $where = [];
        $params = [];

        if ($status) {
            $where[] = "order_status = ?";
            $params[] = $status;
        }

        if ($paymentStatus) {
            $where[] = "payment_status = ?";
            $params[] = $paymentStatus;
        }

        $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

        $stmt = $db->prepare("
            SELECT * FROM orders
            $whereClause
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ");

        $paramIndex = 1;
        foreach ($params as $param) {
            $stmt->bindValue($paramIndex++, $param);
        }
        $stmt->bindValue($paramIndex++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($paramIndex, $offset, PDO::PARAM_INT);

        $stmt->execute();
        $orders = $stmt->fetchAll();

        // Parse items JSON
        foreach ($orders as &$order) {
            $order['items'] = json_decode($order['items'], true);
        }

        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM orders $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        sendJsonResponse(true, 'Orders retrieved successfully', [
            'orders' => $orders,
            'total' => $total
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch orders: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleGetOrder($db) {
    // Prevent caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');

    $id = sanitizeInput($_GET['id'] ?? '');

    if (empty($id)) {
        sendJsonResponse(false, 'Order ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch();

        if (!$order) {
            sendJsonResponse(false, 'Order not found', null, 404);
        }

        $order['items'] = json_decode($order['items'], true);

        sendJsonResponse(true, 'Order retrieved successfully', $order);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch order: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleCreateOrder($db) {
    $data = getRequestBody();

    // Validation
    $customerName = sanitizeInput($data['customerName'] ?? '');
    $customerEmail = sanitizeInput($data['customerEmail'] ?? '');
    $customerPhone = sanitizeInput($data['customerPhone'] ?? '');
    $shippingAddress = sanitizeInput($data['shippingAddress'] ?? '');
    $shippingCity = sanitizeInput($data['shippingCity'] ?? '');
    $shippingState = sanitizeInput($data['shippingState'] ?? '');
    $items = $data['items'] ?? [];
    $subtotal = (float)($data['subtotal'] ?? 0);
    $shippingFee = (float)($data['shippingFee'] ?? 0);
    $discount = (float)($data['discount'] ?? 0);
    $total = (float)($data['total'] ?? 0);
    $paymentMethod = sanitizeInput($data['paymentMethod'] ?? 'bank_transfer');
    $referralCodeUsed = sanitizeInput($data['referralCodeUsed'] ?? '');
    $notes = sanitizeInput($data['notes'] ?? '');

    if (empty($customerName) || empty($customerEmail) || empty($shippingAddress) || empty($items)) {
        sendJsonResponse(false, 'Customer name, email, address, and items are required', null, 400);
    }

    if (!validateEmail($customerEmail)) {
        sendJsonResponse(false, 'Invalid email format', null, 400);
    }

    // Get user ID if logged in
    $userId = null;
    $user = getAuthUser();
    if ($user) {
        $userId = $user['user_id'];
    }

    try {
        $orderId = generateOrderId();

        $stmt = $db->prepare("
            INSERT INTO orders (
                id, user_id, customer_name, customer_email, customer_phone,
                shipping_address, shipping_city, shipping_state, items,
                subtotal, shipping_fee, discount, total, payment_method,
                referral_code_used, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $orderId, $userId, $customerName, $customerEmail, $customerPhone,
            $shippingAddress, $shippingCity, $shippingState, json_encode($items),
            $subtotal, $shippingFee, $discount, $total, $paymentMethod,
            $referralCodeUsed ?: null, $notes
        ]);

        // If referral code was used and this is the first order, complete the referral
        if ($referralCodeUsed && $userId) {
            $stmt = $db->prepare("
                UPDATE referrals
                SET status = 'completed', completed_at = NOW()
                WHERE referred_user_id = ? AND status = 'pending'
            ");
            $stmt->execute([$userId]);
        }

        // Create notification for admin
        $stmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type)
            SELECT id, 'New Order Received', ?, 'order'
            FROM users WHERE role = 'admin'
        ");
        $stmt->execute(["New order $orderId from $customerName for " . number_format($total, 2)]);

        sendJsonResponse(true, 'Order placed successfully!', ['orderId' => $orderId], 201);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to create order: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleUpdateOrderStatus($db) {
    requireAdmin();
    $data = getRequestBody();

    $orderId = sanitizeInput($data['orderId'] ?? '');
    $status = sanitizeInput($data['status'] ?? '');

    if (empty($orderId) || empty($status)) {
        sendJsonResponse(false, 'Order ID and status are required', null, 400);
    }

    $validStatuses = ['pending', 'confirmed', 'processing', 'delivering', 'shipped', 'delivered', 'completed', 'cancelled', 'rejected'];
    if (!in_array($status, $validStatuses)) {
        sendJsonResponse(false, 'Invalid order status', null, 400);
    }

    try {
        // Get current order status first
        $stmt = $db->prepare("SELECT order_status, user_id, customer_name FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if (!$order) {
            sendJsonResponse(false, 'Order not found', null, 404);
        }

        // Define status order for validation (prevent going backwards)
        $statusOrder = ['pending', 'confirmed', 'processing', 'delivering', 'shipped', 'delivered', 'completed'];
        $currentIdx = array_search($order['order_status'], $statusOrder);
        $newIdx = array_search($status, $statusOrder);

        // Allow rejected/cancelled from any state, but otherwise enforce forward progression
        if (!in_array($status, ['rejected', 'cancelled']) && $currentIdx !== false && $newIdx !== false && $newIdx <= $currentIdx) {
            sendJsonResponse(false, 'Cannot move order status backwards', null, 400);
        }

        // Update order status
        $stmt = $db->prepare("UPDATE orders SET order_status = ? WHERE id = ?");
        $stmt->execute([$status, $orderId]);

        // Notify customer if they have an account
        if ($order['user_id']) {
            $statusMessages = [
                'confirmed' => 'Your order has been confirmed! We are preparing it for shipment.',
                'processing' => 'Your order is being processed.',
                'delivering' => 'Great news! Your order is on its way to you!',
                'shipped' => 'Your order has been shipped!',
                'delivered' => 'Your order has been delivered! Please confirm receipt.',
                'completed' => 'Your order is complete. Thank you for shopping with us!',
                'cancelled' => 'Your order has been cancelled.',
                'rejected' => 'Your order payment could not be verified.'
            ];

            if (isset($statusMessages[$status])) {
                $stmt = $db->prepare("
                    INSERT INTO notifications (user_id, title, message, type)
                    VALUES (?, 'Order Update', ?, 'delivery')
                ");
                $stmt->execute([$order['user_id'], "Order $orderId: " . $statusMessages[$status]]);
            }
        }

        sendJsonResponse(true, 'Order status updated successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update order status: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleConfirmPayment($db) {
    requireAdmin();
    $data = getRequestBody();

    $orderId = sanitizeInput($data['orderId'] ?? '');
    $status = sanitizeInput($data['status'] ?? 'confirmed');

    if (empty($orderId)) {
        sendJsonResponse(false, 'Order ID is required', null, 400);
    }

    $validStatuses = ['pending', 'confirmed', 'failed'];
    if (!in_array($status, $validStatuses)) {
        sendJsonResponse(false, 'Invalid payment status', null, 400);
    }

    try {
        // Update payment status
        $stmt = $db->prepare("UPDATE orders SET payment_status = ? WHERE id = ?");
        $stmt->execute([$status, $orderId]);

        if ($stmt->rowCount() === 0) {
            sendJsonResponse(false, 'Order not found', null, 404);
        }

        // If confirmed, also set order status to processing
        if ($status === 'confirmed') {
            $stmt = $db->prepare("UPDATE orders SET order_status = 'processing' WHERE id = ? AND order_status = 'pending'");
            $stmt->execute([$orderId]);
        }

        // Notify customer
        $stmt = $db->prepare("SELECT user_id FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if ($order['user_id'] && $status === 'confirmed') {
            $stmt = $db->prepare("
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, 'Payment Confirmed', ?, 'payment')
            ");
            $stmt->execute([$order['user_id'], "Payment for order $orderId has been confirmed. Your order is now being processed."]);
        }

        sendJsonResponse(true, 'Payment status updated successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update payment status: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleUserOrders($db) {
    // Prevent caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');

    $user = requireAuth();

    try {
        $stmt = $db->prepare("
            SELECT * FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$user['user_id']]);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$order) {
            $order['items'] = json_decode($order['items'], true);
        }

        sendJsonResponse(true, 'Orders retrieved successfully', ['orders' => $orders]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch orders: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleOrderStats($db) {
    // Prevent caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');

    requireAdmin();

    try {
        // Total orders
        $stmt = $db->query("SELECT COUNT(*) as total FROM orders");
        $totalOrders = $stmt->fetch()['total'];

        // Total revenue (confirmed payments)
        $stmt = $db->query("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE payment_status = 'confirmed'");
        $totalRevenue = $stmt->fetch()['revenue'];

        // Pending payments
        $stmt = $db->query("SELECT COUNT(*) as pending FROM orders WHERE payment_status = 'pending'");
        $pendingPayments = $stmt->fetch()['pending'];

        // Orders by status
        $stmt = $db->query("
            SELECT order_status, COUNT(*) as count
            FROM orders
            GROUP BY order_status
        ");
        $ordersByStatus = $stmt->fetchAll();

        // Recent orders (last 5)
        $stmt = $db->query("
            SELECT id, customer_name, total, order_status, payment_status, created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 5
        ");
        $recentOrders = $stmt->fetchAll();

        sendJsonResponse(true, 'Stats retrieved successfully', [
            'totalOrders' => $totalOrders,
            'totalRevenue' => $totalRevenue,
            'pendingPayments' => $pendingPayments,
            'ordersByStatus' => $ordersByStatus,
            'recentOrders' => $recentOrders
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch stats: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleConfirmReceipt($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $orderId = sanitizeInput($data['orderId'] ?? '');

    if (empty($orderId)) {
        sendJsonResponse(false, 'Order ID is required', null, 400);
    }

    try {
        // Verify the order belongs to this user and is in delivered status
        $stmt = $db->prepare("
            SELECT id, order_status, customer_confirmed_receipt
            FROM orders
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$orderId, $user['user_id']]);
        $order = $stmt->fetch();

        if (!$order) {
            sendJsonResponse(false, 'Order not found', null, 404);
        }

        if ($order['customer_confirmed_receipt']) {
            sendJsonResponse(false, 'Receipt already confirmed', null, 400);
        }

        if (!in_array($order['order_status'], ['delivered', 'delivering', 'shipped'])) {
            sendJsonResponse(false, 'Order must be delivered before confirming receipt', null, 400);
        }

        // Update order
        $stmt = $db->prepare("
            UPDATE orders
            SET customer_confirmed_receipt = TRUE,
                receipt_confirmed_at = NOW(),
                order_status = 'completed'
            WHERE id = ?
        ");
        $stmt->execute([$orderId]);

        // Notify admin
        $stmt = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type)
            SELECT id, 'Receipt Confirmed', ?, 'order'
            FROM users WHERE role = 'admin'
        ");
        $stmt->execute(["Customer confirmed receipt for order $orderId"]);

        sendJsonResponse(true, 'Receipt confirmed! Thank you for shopping with us.');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to confirm receipt: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}
?>
