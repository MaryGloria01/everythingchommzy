<?php
// ============================================
// PRODUCTS API v5.0 - FIXED require order
// ============================================

// MUST load config FIRST before using Database class
require_once 'config.php';

// Return version if requested
if (isset($_GET['version'])) {
    header('Content-Type: application/json');
    echo json_encode(['api_version' => '5.0', 'file' => 'products.php', 'time' => date('H:i:s')]);
    exit;
}

// LIST PRODUCTS - Simple direct code at top
if (($_GET['action'] ?? '') === 'list' || $_GET['action'] === 'list') {
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
        'message' => 'Products retrieved v5',
        'data' => ['products' => $products, 'total' => count($products), 'limit' => 100, 'offset' => 0]
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_category (category),
            INDEX idx_badge (badge)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

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
?>
