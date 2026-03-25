<?php
// ============================================
// STORE API v6.0 - Fixed CRUD operations
// ============================================

require_once 'config.php';

// Prevent caching of API responses
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Return version if requested
if (isset($_GET['version'])) {
    header('Content-Type: application/json');
    echo json_encode(['api_version' => '6.4', 'file' => 'store.php', 'time' => date('H:i:s')]);
    exit;
}

// LIST PRODUCTS - Direct simple code
if (($_GET['action'] ?? 'list') === 'list') {
    // CRITICAL: Disable LiteSpeed Cache for this endpoint
    header('X-LiteSpeed-Cache-Control: no-cache');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    $database = new Database();
    $db = $database->getConnection();

    $products = $db->query("SELECT * FROM products")->fetchAll(PDO::FETCH_ASSOC);

    foreach ($products as &$p) {
        $p['sizes'] = !empty($p['sizes']) ? explode(',', $p['sizes']) : [];
        $p['inStock'] = isset($p['in_stock']) ? (bool)$p['in_stock'] : true;
        $p['originalPrice'] = $p['original_price'] ?? null;
    }

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Products from store.php',
        'data' => ['products' => $products, 'total' => count($products)]
    ]);
    exit;
}

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';


// Create products table if not exists
try {
    $db->exec("
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(12, 2) NOT NULL,
            original_price DECIMAL(12, 2),
            image TEXT,
            category VARCHAR(50) NOT NULL,
            color VARCHAR(100),
            sizes VARCHAR(255),
            description TEXT,
            badge VARCHAR(50),
            in_stock TINYINT(1) DEFAULT 1,
            reviews INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_badge (badge)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Add reviews column if it doesn't exist (for existing tables)
    try {
        $db->exec("ALTER TABLE products ADD COLUMN reviews INT DEFAULT 0");
    } catch (Exception $e) {
        // Column already exists, ignore
    }

    // Create custom categories table
    $db->exec("
        CREATE TABLE IF NOT EXISTS custom_categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create custom colors table
    $db->exec("
        CREATE TABLE IF NOT EXISTS custom_colors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create reviews table
    $db->exec("
        CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            user_id INT NOT NULL,
            order_id INT NOT NULL,
            rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
            review_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_product (product_id),
            INDEX idx_user (user_id),
            UNIQUE KEY unique_review (product_id, user_id, order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Create flash deals table
    $db->exec("
        CREATE TABLE IF NOT EXISTS flash_deals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            subtitle VARCHAR(255),
            start_date DATE NOT NULL,
            start_time TIME DEFAULT '00:00:00',
            end_date DATE NOT NULL,
            end_time TIME DEFAULT '23:59:00',
            discount INT DEFAULT 20,
            enabled TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
} catch (Exception $e) {
    // Tables might already exist, continue
}

switch ($action) {
    case 'list':
        // DIRECTLY use test endpoint code that works - bypass function
        $category = $_GET['category'] ?? null;
        $allProducts = $db->query("SELECT * FROM products")->fetchAll(PDO::FETCH_ASSOC);

        // Filter by category if needed
        if ($category && $category !== 'all') {
            $allProducts = array_filter($allProducts, function($p) use ($category) {
                return strtolower($p['category'] ?? '') === strtolower($category);
            });
            $allProducts = array_values($allProducts);
        }

        // Process for JS
        foreach ($allProducts as &$p) {
            $p['sizes'] = !empty($p['sizes']) ? explode(',', $p['sizes']) : [];
            $p['inStock'] = isset($p['in_stock']) ? (bool)$p['in_stock'] : true;
            $p['originalPrice'] = $p['original_price'] ?? null;
        }

        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'message' => 'Products retrieved',
            'data' => [
                'products' => $allProducts,
                'total' => count($allProducts),
                'limit' => 100,
                'offset' => 0
            ]
        ]);
        exit;

    case 'get':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetProduct($db);
        break;

    case 'create':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleCreateProduct($db);
        break;

    case 'update':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUpdateProduct($db);
        break;

    case 'delete':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleDeleteProduct($db);
        break;

    case 'search':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleSearchProducts($db);
        break;

    case 'test':
        // Debug endpoint - check database directly
        try {
            $products = $db->query("SELECT * FROM products")->fetchAll(PDO::FETCH_ASSOC);
            $count = count($products);
            echo json_encode([
                'status' => 'OK',
                'database' => 'Connected',
                'products_count' => $count,
                'products' => $products,
                'message' => $count > 0 ? 'Products found in database!' : 'No products in database. Add products via admin panel.'
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'status' => 'ERROR',
                'database' => 'Failed',
                'error' => $e->getMessage()
            ]);
        }
        exit;

    case 'test-create':
        // Debug: Test create and immediately verify
        $body = getRequestBody();
        $token = $body['_auth_token'] ?? null;

        if (!$token) {
            echo json_encode(['error' => 'No token provided']);
            exit;
        }

        $user = verifyToken($token);
        if (!$user || $user['role'] !== 'admin') {
            echo json_encode(['error' => 'Not admin', 'user' => $user]);
            exit;
        }

        // Create test product
        try {
            $testName = 'TEST_PRODUCT_' . time();
            $stmt = $db->prepare("INSERT INTO products (name, price, category, in_stock) VALUES (?, ?, ?, ?)");
            $stmt->execute([$testName, 1000, 'test', 1]);
            $newId = $db->lastInsertId();

            // Immediately query it back
            $stmt2 = $db->prepare("SELECT * FROM products WHERE id = ?");
            $stmt2->execute([$newId]);
            $found = $stmt2->fetch();

            // Count total products
            $total = $db->query("SELECT COUNT(*) FROM products")->fetchColumn();

            // Delete the test product
            $db->prepare("DELETE FROM products WHERE id = ?")->execute([$newId]);

            echo json_encode([
                'success' => true,
                'inserted_id' => $newId,
                'found_after_insert' => $found ? true : false,
                'product_data' => $found,
                'total_products_before_delete' => $total,
                'message' => $found ? 'Database INSERT/SELECT working!' : 'INSERT succeeded but SELECT failed!'
            ]);
        } catch (Exception $e) {
            echo json_encode(['error' => $e->getMessage()]);
        }
        exit;

    case 'debug-auth':
        // Debug authentication - helps diagnose token issues
        $headers = getallheaders();
        $body = getRequestBody();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? 'NOT FOUND';
        $xAuthToken = $headers['X-Auth-Token'] ?? $headers['x-auth-token'] ?? $_SERVER['HTTP_X_AUTH_TOKEN'] ?? 'NOT FOUND';
        $bodyToken = $body['_auth_token'] ?? 'NOT FOUND';
        $user = getAuthUser();
        echo json_encode([
            'auth_header_present' => strpos($authHeader, 'Bearer') !== false,
            'x_auth_token_present' => $xAuthToken !== 'NOT FOUND',
            'body_token_present' => $bodyToken !== 'NOT FOUND',
            'body_token_preview' => $bodyToken !== 'NOT FOUND' ? substr($bodyToken, 0, 20) . '...' : 'NOT FOUND',
            'user_authenticated' => $user !== false,
            'user_role' => $user ? $user['role'] : null,
            'is_admin' => $user && $user['role'] === 'admin',
            'request_method' => $_SERVER['REQUEST_METHOD']
        ]);
        exit;

    case 'categories':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetCategories($db);
        break;

    case 'colors':
        if ($method !== 'GET') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleGetColors($db);
        break;

    // ===== FLASH DEALS ENDPOINTS =====
    case 'flash-deals-list':
        // Accept both GET and POST (POST bypasses cache)
        handleListFlashDeals($db);
        break;

    case 'flash-deals-active':
        handleGetActiveFlashDeal($db);
        break;

    case 'flash-deals-create':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleCreateFlashDeal($db);
        break;

    case 'flash-deals-update':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleUpdateFlashDeal($db);
        break;

    case 'flash-deals-delete':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleDeleteFlashDeal($db);
        break;

    // ===== REVIEWS ENDPOINTS =====
    case 'reviews-list':
        handleListReviews($db);
        break;

    case 'reviews-submit':
        if ($method !== 'POST') {
            sendJsonResponse(false, 'Method not allowed', null, 405);
        }
        handleSubmitReview($db);
        break;

    case 'reviews-check-eligibility':
        handleCheckReviewEligibility($db);
        break;

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

function handleListProducts($db) {
    $category = $_GET['category'] ?? null;

    // Use EXACT same approach as test endpoint (which works)
    $products = $db->query("SELECT * FROM products")->fetchAll(PDO::FETCH_ASSOC);
    $total = count($products);

    // Filter by category if specified
    if ($category && $category !== 'all') {
        $products = array_filter($products, function($p) use ($category) {
            return strtolower($p['category'] ?? '') === strtolower($category);
        });
        $products = array_values($products);
    }

    // Process products for JavaScript
    foreach ($products as &$product) {
        $product['sizes'] = !empty($product['sizes']) ? explode(',', $product['sizes']) : [];
        $product['inStock'] = isset($product['in_stock']) ? (bool)$product['in_stock'] : true;
        $product['originalPrice'] = $product['original_price'] ?? null;
    }

    // Use DIRECT echo like test endpoint (bypass sendJsonResponse)
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'Products retrieved successfully',
        'data' => [
            'products' => $products,
            'total' => $total,
            'limit' => 100,
            'offset' => 0
        ]
    ]);
    exit;
}

function handleGetProduct($db) {
    $id = (int)($_GET['id'] ?? 0);

    if (!$id) {
        sendJsonResponse(false, 'Product ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();

        if (!$product) {
            sendJsonResponse(false, 'Product not found', null, 404);
        }

        $product['sizes'] = $product['sizes'] ? explode(',', $product['sizes']) : [];
        $product['inStock'] = (bool)$product['in_stock'];
        $product['originalPrice'] = $product['original_price'];
        unset($product['in_stock'], $product['original_price']);

        sendJsonResponse(true, 'Product retrieved successfully', $product);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch product: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleCreateProduct($db) {
    requireAdmin();
    $data = getRequestBody();

    // Debug: Log received data
    error_log("CREATE PRODUCT - Received data: " . json_encode($data));

    $name = sanitizeInput($data['name'] ?? '');
    $price = (float)($data['price'] ?? 0);
    $originalPrice = isset($data['originalPrice']) && $data['originalPrice'] ? (float)$data['originalPrice'] : null;
    $image = sanitizeInput($data['image'] ?? '');
    $category = sanitizeInput($data['category'] ?? '');
    $color = sanitizeInput($data['color'] ?? '');
    $sizes = is_array($data['sizes'] ?? null) ? implode(',', $data['sizes']) : ($data['sizes'] ?? '');
    $description = sanitizeInput($data['description'] ?? '');
    $badge = sanitizeInput($data['badge'] ?? '');
    $inStock = isset($data['inStock']) ? (bool)$data['inStock'] : true;

    if (empty($name) || $price <= 0 || empty($category)) {
        error_log("CREATE PRODUCT - Validation failed: name=$name, price=$price, category=$category");
        sendJsonResponse(false, 'Name, price, and category are required', null, 400);
    }

    // Save custom category if not a standard one
    $standardCategories = ['wigs', 'clothing', 'shoes', 'accessories'];
    if (!in_array($category, $standardCategories)) {
        try {
            $stmt = $db->prepare("INSERT IGNORE INTO custom_categories (name) VALUES (?)");
            $stmt->execute([$category]);
        } catch (Exception $e) {
            // Ignore if already exists
        }
    }

    // Save custom colors if not standard
    $standardColors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Brown', 'Gold', 'Pink', 'Purple', 'Orange', 'Grey', 'Multi'];
    $colorList = array_map('trim', explode(',', $color));
    foreach ($colorList as $c) {
        if ($c && !in_array($c, $standardColors)) {
            try {
                $stmt = $db->prepare("INSERT IGNORE INTO custom_colors (name) VALUES (?)");
                $stmt->execute([$c]);
            } catch (Exception $e) {
                // Ignore if already exists
            }
        }
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO products (name, price, original_price, image, category, color, sizes, description, badge, in_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $name, $price, $originalPrice, $image, $category, $color, $sizes, $description,
            $badge ?: null, $inStock ? 1 : 0
        ]);

        $productId = $db->lastInsertId();

        sendJsonResponse(true, 'Product created successfully', ['id' => $productId], 201);

    } catch (PDOException $e) {
        // Temporary debug - show actual error
        sendJsonResponse(false, 'Failed to create product: ' . $e->getMessage(), null, 500);
    }
}

function handleUpdateProduct($db) {
    requireAdmin();
    $data = getRequestBody();

    $id = (int)($data['id'] ?? 0);
    if (!$id) {
        sendJsonResponse(false, 'Product ID is required', null, 400);
    }

    $name = sanitizeInput($data['name'] ?? '');
    $price = (float)($data['price'] ?? 0);
    $originalPrice = isset($data['originalPrice']) && $data['originalPrice'] ? (float)$data['originalPrice'] : null;
    $image = sanitizeInput($data['image'] ?? '');
    $category = sanitizeInput($data['category'] ?? '');
    $color = sanitizeInput($data['color'] ?? '');
    $sizes = is_array($data['sizes'] ?? null) ? implode(',', $data['sizes']) : ($data['sizes'] ?? '');
    $description = sanitizeInput($data['description'] ?? '');
    $badge = sanitizeInput($data['badge'] ?? '');
    $inStock = isset($data['inStock']) ? (bool)$data['inStock'] : true;

    if (empty($name) || $price <= 0 || empty($category)) {
        sendJsonResponse(false, 'Name, price, and category are required', null, 400);
    }

    try {
        $stmt = $db->prepare("
            UPDATE products SET
                name = ?, price = ?, original_price = ?, image = ?, category = ?,
                color = ?, sizes = ?, description = ?, badge = ?, in_stock = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $name, $price, $originalPrice, $image, $category, $color, $sizes, $description,
            $badge ?: null, $inStock ? 1 : 0, $id
        ]);

        if ($stmt->rowCount() === 0) {
            sendJsonResponse(false, 'Product not found or no changes made', null, 404);
        }

        sendJsonResponse(true, 'Product updated successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update product: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleDeleteProduct($db) {
    requireAdmin();
    $data = getRequestBody();

    $id = (int)($data['id'] ?? 0);
    if (!$id) {
        sendJsonResponse(false, 'Product ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            sendJsonResponse(false, 'Product not found', null, 404);
        }

        sendJsonResponse(true, 'Product deleted successfully');

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to delete product: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleSearchProducts($db) {
    $query = sanitizeInput($_GET['q'] ?? '');

    if (strlen($query) < 2) {
        sendJsonResponse(false, 'Search query must be at least 2 characters', null, 400);
    }

    try {
        $searchTerm = "%$query%";
        $stmt = $db->prepare("
            SELECT * FROM products
            WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
            ORDER BY
                CASE
                    WHEN name LIKE ? THEN 1
                    WHEN category LIKE ? THEN 2
                    ELSE 3
                END
            LIMIT 20
        ");
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        $products = $stmt->fetchAll();

        foreach ($products as &$product) {
            $product['sizes'] = $product['sizes'] ? explode(',', $product['sizes']) : [];
            $product['inStock'] = (bool)$product['in_stock'];
            $product['originalPrice'] = $product['original_price'];
            unset($product['in_stock'], $product['original_price']);
        }

        sendJsonResponse(true, 'Search results', ['products' => $products]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Search failed: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
}

function handleGetCategories($db) {
    try {
        $stmt = $db->query("SELECT name FROM custom_categories ORDER BY name");
        $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);
        sendJsonResponse(true, 'Categories retrieved', ['categories' => $categories]);
    } catch (PDOException $e) {
        sendJsonResponse(true, 'Categories retrieved', ['categories' => []]);
    }
}

function handleGetColors($db) {
    try {
        $stmt = $db->query("SELECT name FROM custom_colors ORDER BY name");
        $colors = $stmt->fetchAll(PDO::FETCH_COLUMN);
        sendJsonResponse(true, 'Colors retrieved', ['colors' => $colors]);
    } catch (PDOException $e) {
        sendJsonResponse(true, 'Colors retrieved', ['colors' => []]);
    }
}

// ===== FLASH DEALS HANDLERS =====

function handleListFlashDeals($db) {
    // Aggressively prevent ALL caching (LiteSpeed, CDN, browser)
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('X-LiteSpeed-Purge: *');
    header('Pragma: no-cache');
    header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
    header('Vary: *');

    try {
        // Ensure table exists
        $db->exec("
            CREATE TABLE IF NOT EXISTS flash_deals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                start_date DATE NOT NULL,
                start_time TIME DEFAULT '00:00:00',
                end_date DATE NOT NULL,
                end_time TIME DEFAULT '23:59:00',
                discount INT DEFAULT 20,
                enabled TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Debug: Check table exists and get row count
        $tableCheck = $db->query("SHOW TABLES LIKE 'flash_deals'")->fetch();
        $countCheck = $db->query("SELECT COUNT(*) as cnt FROM flash_deals")->fetch();

        $deals = $db->query("SELECT * FROM flash_deals ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);

        // Format for JavaScript
        foreach ($deals as &$deal) {
            $deal['startDate'] = $deal['start_date'];
            $deal['startTime'] = substr($deal['start_time'], 0, 5); // HH:MM
            $deal['endDate'] = $deal['end_date'];
            $deal['endTime'] = substr($deal['end_time'], 0, 5); // HH:MM
            $deal['enabled'] = (bool)$deal['enabled'];
        }

        sendJsonResponse(true, 'Flash deals retrieved', [
            'deals' => $deals,
            'count' => count($deals),
            'debug' => [
                'table_exists' => $tableCheck ? true : false,
                'db_count' => $countCheck['cnt'] ?? 0
            ]
        ]);
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch flash deals: ' . $e->getMessage(), null, 500);
    }
}

function handleGetActiveFlashDeal($db) {
    // Aggressively prevent ALL caching
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
    header('X-LiteSpeed-Cache-Control: no-cache, no-store, esi=off');
    header('Pragma: no-cache');
    header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

    try {
        // Ensure table exists
        $db->exec("
            CREATE TABLE IF NOT EXISTS flash_deals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                start_date DATE NOT NULL,
                start_time TIME DEFAULT '00:00:00',
                end_date DATE NOT NULL,
                end_time TIME DEFAULT '23:59:00',
                discount INT DEFAULT 20,
                enabled TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        // Get currently active flash deal (between start and end datetime, enabled)
        $nowDate = date('Y-m-d');
        $nowTime = date('H:i:s');
        $stmt = $db->prepare("
            SELECT * FROM flash_deals
            WHERE enabled = 1
            AND (start_date < ? OR (start_date = ? AND start_time <= ?))
            AND (end_date > ? OR (end_date = ? AND end_time >= ?))
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$nowDate, $nowDate, $nowTime, $nowDate, $nowDate, $nowTime]);
        $deal = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($deal) {
            $deal['startDate'] = $deal['start_date'];
            $deal['startTime'] = substr($deal['start_time'], 0, 5);
            $deal['endDate'] = $deal['end_date'];
            $deal['endTime'] = substr($deal['end_time'], 0, 5);
            $deal['enabled'] = (bool)$deal['enabled'];
            sendJsonResponse(true, 'Active flash deal found', $deal);
        } else {
            // No active deal right now - return the most recent enabled deal for display
            $stmt = $db->prepare("SELECT * FROM flash_deals WHERE enabled = 1 ORDER BY created_at DESC LIMIT 1");
            $stmt->execute();
            $deal = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($deal) {
                $deal['startDate'] = $deal['start_date'];
                $deal['startTime'] = substr($deal['start_time'], 0, 5);
                $deal['endDate'] = $deal['end_date'];
                $deal['endTime'] = substr($deal['end_time'], 0, 5);
                $deal['enabled'] = (bool)$deal['enabled'];
                sendJsonResponse(true, 'Flash deal found (scheduled)', $deal);
            } else {
                sendJsonResponse(true, 'No active flash deal', null);
            }
        }
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch active flash deal: ' . $e->getMessage(), null, 500);
    }
}

function handleCreateFlashDeal($db) {
    // Check admin auth - but don't exit on failure, just log it
    $adminUser = null;
    try {
        $adminUser = requireAdmin();
    } catch (Exception $e) {
        // Auth failed - this will have already sent response
        return;
    }

    $data = getRequestBody();

    $title = sanitizeInput($data['title'] ?? '');
    $subtitle = sanitizeInput($data['subtitle'] ?? '');
    $startDate = $data['startDate'] ?? '';
    $startTime = $data['startTime'] ?? '00:00';
    $endDate = $data['endDate'] ?? '';
    $endTime = $data['endTime'] ?? '23:59';
    $discount = (int)($data['discount'] ?? 20);
    $enabled = isset($data['enabled']) ? ($data['enabled'] ? 1 : 0) : 1;

    if (empty($title) || empty($startDate) || empty($endDate)) {
        sendJsonResponse(false, 'Title, start date, and end date are required', null, 400);
    }

    try {
        // Ensure table exists first
        $db->exec("
            CREATE TABLE IF NOT EXISTS flash_deals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                start_date DATE NOT NULL,
                start_time TIME DEFAULT '00:00:00',
                end_date DATE NOT NULL,
                end_time TIME DEFAULT '23:59:00',
                discount INT DEFAULT 20,
                enabled TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $stmt = $db->prepare("
            INSERT INTO flash_deals (title, subtitle, start_date, start_time, end_date, end_time, discount, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $result = $stmt->execute([$title, $subtitle, $startDate, $startTime, $endDate, $endTime, $discount, $enabled]);

        if (!$result) {
            sendJsonResponse(false, 'Insert failed: ' . implode(', ', $stmt->errorInfo()), null, 500);
        }

        $dealId = $db->lastInsertId();

        // Verify the insert worked by reading it back
        $verify = $db->query("SELECT COUNT(*) as cnt FROM flash_deals")->fetch();

        sendJsonResponse(true, 'Flash deal created successfully', [
            'id' => $dealId,
            'total_deals' => $verify['cnt'],
            'inserted' => [
                'title' => $title,
                'startDate' => $startDate,
                'endDate' => $endDate
            ]
        ], 201);
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to create flash deal: ' . $e->getMessage(), null, 500);
    }
}

function handleUpdateFlashDeal($db) {
    requireAdmin();
    $data = getRequestBody();

    $id = (int)($data['id'] ?? 0);
    if (!$id) {
        sendJsonResponse(false, 'Flash deal ID is required', null, 400);
    }

    $title = sanitizeInput($data['title'] ?? '');
    $subtitle = sanitizeInput($data['subtitle'] ?? '');
    $startDate = $data['startDate'] ?? '';
    $startTime = $data['startTime'] ?? '00:00';
    $endDate = $data['endDate'] ?? '';
    $endTime = $data['endTime'] ?? '23:59';
    $discount = (int)($data['discount'] ?? 20);
    $enabled = isset($data['enabled']) ? ($data['enabled'] ? 1 : 0) : 1;

    try {
        $stmt = $db->prepare("
            UPDATE flash_deals
            SET title = ?, subtitle = ?, start_date = ?, start_time = ?, end_date = ?, end_time = ?, discount = ?, enabled = ?
            WHERE id = ?
        ");
        $stmt->execute([$title, $subtitle, $startDate, $startTime, $endDate, $endTime, $discount, $enabled, $id]);

        if ($stmt->rowCount() === 0) {
            sendJsonResponse(false, 'Flash deal not found', null, 404);
        }

        sendJsonResponse(true, 'Flash deal updated successfully');
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to update flash deal', null, 500);
    }
}

function handleDeleteFlashDeal($db) {
    requireAdmin();
    $data = getRequestBody();

    $id = (int)($data['id'] ?? 0);
    if (!$id) {
        sendJsonResponse(false, 'Flash deal ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("DELETE FROM flash_deals WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            sendJsonResponse(false, 'Flash deal not found', null, 404);
        }

        sendJsonResponse(true, 'Flash deal deleted successfully');
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to delete flash deal', null, 500);
    }
}

// ===== REVIEWS HANDLERS =====

function handleListReviews($db) {
    $productId = (int)($_GET['product_id'] ?? 0);

    if (!$productId) {
        sendJsonResponse(false, 'Product ID is required', null, 400);
    }

    try {
        $stmt = $db->prepare("
            SELECT r.*, u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$productId]);
        $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format reviews for display
        foreach ($reviews as &$review) {
            $review['userName'] = $review['user_name'];
            $review['text'] = $review['review_text'];
            $review['date'] = date('M j, Y', strtotime($review['created_at']));
            // Get user initials
            $nameParts = explode(' ', $review['user_name']);
            $initials = strtoupper(substr($nameParts[0], 0, 1));
            if (count($nameParts) > 1) {
                $initials .= strtoupper(substr(end($nameParts), 0, 1));
            }
            $review['initials'] = $initials;
        }

        // Calculate average rating
        $avgRating = 0;
        if (count($reviews) > 0) {
            $avgRating = array_sum(array_column($reviews, 'rating')) / count($reviews);
        }

        sendJsonResponse(true, 'Reviews retrieved', [
            'reviews' => $reviews,
            'total' => count($reviews),
            'averageRating' => round($avgRating, 1)
        ]);
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch reviews', null, 500);
    }
}

function handleCheckReviewEligibility($db) {
    $user = getAuthUser();
    if (!$user) {
        sendJsonResponse(true, 'Not logged in', ['eligible' => false, 'reason' => 'login']);
        return;
    }

    $productId = (int)($_GET['product_id'] ?? 0);
    if (!$productId) {
        sendJsonResponse(false, 'Product ID is required', null, 400);
    }

    try {
        // Check if user has already reviewed this product
        $stmt = $db->prepare("SELECT id FROM reviews WHERE product_id = ? AND user_id = ?");
        $stmt->execute([$productId, $user['id']]);
        if ($stmt->fetch()) {
            sendJsonResponse(true, 'Already reviewed', ['eligible' => false, 'reason' => 'already_reviewed']);
            return;
        }

        // Check if user has a delivered order containing this product
        $stmt = $db->prepare("
            SELECT o.id as order_id
            FROM orders o
            WHERE o.user_id = ?
            AND o.status IN ('delivered', 'completed')
            AND o.items LIKE ?
        ");
        $productPattern = '%\"productId\":' . $productId . '%';
        $stmt->execute([$user['id'], $productPattern]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($order) {
            sendJsonResponse(true, 'Eligible to review', [
                'eligible' => true,
                'orderId' => $order['order_id']
            ]);
        } else {
            sendJsonResponse(true, 'Not eligible', [
                'eligible' => false,
                'reason' => 'not_purchased_or_not_delivered'
            ]);
        }
    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to check eligibility', null, 500);
    }
}

function handleSubmitReview($db) {
    $user = getAuthUser();
    if (!$user) {
        sendJsonResponse(false, 'You must be logged in to submit a review', null, 401);
    }

    $data = getRequestBody();
    $productId = (int)($data['productId'] ?? 0);
    $orderId = (int)($data['orderId'] ?? 0);
    $rating = (int)($data['rating'] ?? 0);
    $reviewText = sanitizeInput($data['reviewText'] ?? '');

    if (!$productId || !$orderId || !$rating) {
        sendJsonResponse(false, 'Product ID, Order ID, and rating are required', null, 400);
    }

    if ($rating < 1 || $rating > 5) {
        sendJsonResponse(false, 'Rating must be between 1 and 5', null, 400);
    }

    try {
        // Verify the user actually has this delivered order with this product
        $stmt = $db->prepare("
            SELECT id FROM orders
            WHERE id = ? AND user_id = ?
            AND status IN ('delivered', 'completed')
            AND items LIKE ?
        ");
        $productPattern = '%\"productId\":' . $productId . '%';
        $stmt->execute([$orderId, $user['id'], $productPattern]);

        if (!$stmt->fetch()) {
            sendJsonResponse(false, 'You can only review products from delivered orders', null, 403);
        }

        // Check if already reviewed
        $stmt = $db->prepare("SELECT id FROM reviews WHERE product_id = ? AND user_id = ? AND order_id = ?");
        $stmt->execute([$productId, $user['id'], $orderId]);
        if ($stmt->fetch()) {
            sendJsonResponse(false, 'You have already reviewed this product', null, 400);
        }

        // Insert the review
        $stmt = $db->prepare("
            INSERT INTO reviews (product_id, user_id, order_id, rating, review_text)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$productId, $user['id'], $orderId, $rating, $reviewText]);

        // Update product review count
        $stmt = $db->prepare("UPDATE products SET reviews = reviews + 1 WHERE id = ?");
        $stmt->execute([$productId]);

        sendJsonResponse(true, 'Review submitted successfully', ['id' => $db->lastInsertId()], 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            sendJsonResponse(false, 'You have already reviewed this product', null, 400);
        }
        sendJsonResponse(false, 'Failed to submit review', null, 500);
    }
}
?>
