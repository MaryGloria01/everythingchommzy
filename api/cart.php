<?php
// ============================================
// CART & WISHLIST API
// Handles: Cart and wishlist operations for logged-in users
// ============================================

require_once 'config.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'get';

switch ($action) {
    // Cart actions
    case 'get':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetCart($db);
        break;

    case 'add':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleAddToCart($db);
        break;

    case 'update':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUpdateCartItem($db);
        break;

    case 'remove':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleRemoveFromCart($db);
        break;

    case 'clear':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleClearCart($db);
        break;

    // Wishlist actions
    case 'wishlist-get':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetWishlist($db);
        break;

    case 'wishlist-add':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleAddToWishlist($db);
        break;

    case 'wishlist-remove':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleRemoveFromWishlist($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

// ============================================
// CART HANDLERS
// ============================================

function handleGetCart($db) {
    $user = requireAuth();

    try {
        $stmt = $db->prepare("
            SELECT
                c.id, c.product_id, c.quantity, c.selected_size, c.selected_color,
                p.name, p.price, p.original_price, p.image, p.category, p.in_stock
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$user['user_id']]);
        $cartItems = $stmt->fetchAll();

        // Format items
        foreach ($cartItems as &$item) {
            $item['productId'] = $item['product_id'];
            $item['selectedSize'] = $item['selected_size'];
            $item['selectedColor'] = $item['selected_color'];
            $item['originalPrice'] = $item['original_price'];
            $item['inStock'] = (bool)$item['in_stock'];
            unset($item['product_id'], $item['selected_size'], $item['selected_color'], $item['original_price'], $item['in_stock']);
        }

        sendJsonResponse(true, 'Cart retrieved successfully', ['items' => $cartItems]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch cart: ' . $e->getMessage(), null, 500);
    }
}

function handleAddToCart($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $productId = (int)($data['productId'] ?? 0);
    $quantity = (int)($data['quantity'] ?? 1);
    $selectedSize = sanitizeInput($data['selectedSize'] ?? '');
    $selectedColor = sanitizeInput($data['selectedColor'] ?? '');

    if (!$productId) {
        sendJsonResponse(false, 'Product ID is required', null, 400);
    }

    if ($quantity < 1) {
        $quantity = 1;
    }

    try {
        // Check if product exists
        $stmt = $db->prepare("SELECT id, in_stock FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        $product = $stmt->fetch();

        if (!$product) {
            sendJsonResponse(false, 'Product not found', null, 404);
        }

        if (!$product['in_stock']) {
            sendJsonResponse(false, 'Product is out of stock', null, 400);
        }

        // Check if item already in cart
        $stmt = $db->prepare("
            SELECT id, quantity FROM cart
            WHERE user_id = ? AND product_id = ? AND selected_size = ? AND selected_color = ?
        ");
        $stmt->execute([$user['user_id'], $productId, $selectedSize, $selectedColor]);
        $existingItem = $stmt->fetch();

        if ($existingItem) {
            // Update quantity
            $newQuantity = $existingItem['quantity'] + $quantity;
            $stmt = $db->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
            $stmt->execute([$newQuantity, $existingItem['id']]);
        } else {
            // Add new item
            $stmt = $db->prepare("
                INSERT INTO cart (user_id, product_id, quantity, selected_size, selected_color)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$user['user_id'], $productId, $quantity, $selectedSize, $selectedColor]);
        }

        // Get updated cart count
        $stmt = $db->prepare("SELECT SUM(quantity) as total FROM cart WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $cartCount = $stmt->fetch()['total'] ?? 0;

        sendJsonResponse(true, 'Item added to cart', ['cartCount' => (int)$cartCount]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to add to cart: ' . $e->getMessage(), null, 500);
    }
}

function handleUpdateCartItem($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $itemId = (int)($data['itemId'] ?? 0);
    $quantity = (int)($data['quantity'] ?? 1);

    if (!$itemId) {
        sendJsonResponse(false, 'Cart item ID is required', null, 400);
    }

    if ($quantity < 1) {
        $quantity = 1;
    }

    try {
        $stmt = $db->prepare("UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$quantity, $itemId, $user['user_id']]);

        if ($stmt->rowCount() === 0) {
            sendJsonResponse(false, 'Cart item not found', null, 404);
        }

        sendJsonResponse(true, 'Cart updated successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update cart: ' . $e->getMessage(), null, 500);
    }
}

function handleRemoveFromCart($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $itemId = (int)($data['itemId'] ?? 0);

    if (!$itemId) {
        sendJsonResponse(false, 'Cart item ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
        $stmt->execute([$itemId, $user['user_id']]);

        if ($stmt->rowCount() === 0) {
            sendJsonResponse(false, 'Cart item not found', null, 404);
        }

        sendJsonResponse(true, 'Item removed from cart');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to remove from cart: ' . $e->getMessage(), null, 500);
    }
}

function handleClearCart($db) {
    $user = requireAuth();

    try {
        $stmt = $db->prepare("DELETE FROM cart WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);

        sendJsonResponse(true, 'Cart cleared successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to clear cart: ' . $e->getMessage(), null, 500);
    }
}

// ============================================
// WISHLIST HANDLERS
// ============================================

function handleGetWishlist($db) {
    $user = requireAuth();

    try {
        $stmt = $db->prepare("
            SELECT
                w.id, w.product_id,
                p.name, p.price, p.original_price, p.image, p.category, p.in_stock, p.badge
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        ");
        $stmt->execute([$user['user_id']]);
        $wishlistItems = $stmt->fetchAll();

        foreach ($wishlistItems as &$item) {
            $item['productId'] = $item['product_id'];
            $item['originalPrice'] = $item['original_price'];
            $item['inStock'] = (bool)$item['in_stock'];
            unset($item['product_id'], $item['original_price'], $item['in_stock']);
        }

        sendJsonResponse(true, 'Wishlist retrieved successfully', ['items' => $wishlistItems]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch wishlist: ' . $e->getMessage(), null, 500);
    }
}

function handleAddToWishlist($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $productId = (int)($data['productId'] ?? 0);

    if (!$productId) {
        sendJsonResponse(false, 'Product ID is required', null, 400);
    }

    try {
        // Check if product exists
        $stmt = $db->prepare("SELECT id FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        if (!$stmt->fetch()) {
            sendJsonResponse(false, 'Product not found', null, 404);
        }

        // Add to wishlist (ignore if already exists)
        $stmt = $db->prepare("
            INSERT IGNORE INTO wishlist (user_id, product_id)
            VALUES (?, ?)
        ");
        $stmt->execute([$user['user_id'], $productId]);

        // Get updated wishlist count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM wishlist WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $wishlistCount = $stmt->fetch()['total'];

        sendJsonResponse(true, 'Item added to wishlist', ['wishlistCount' => (int)$wishlistCount]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to add to wishlist: ' . $e->getMessage(), null, 500);
    }
}

function handleRemoveFromWishlist($db) {
    $user = requireAuth();
    $data = getRequestBody();

    $productId = (int)($data['productId'] ?? 0);

    if (!$productId) {
        sendJsonResponse(false, 'Product ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$user['user_id'], $productId]);

        sendJsonResponse(true, 'Item removed from wishlist');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to remove from wishlist: ' . $e->getMessage(), null, 500);
    }
}
?>
