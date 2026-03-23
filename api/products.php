<?php
// ============================================
// PRODUCTS API
// Handles: List, Get, Create, Update, Delete products
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
        handleListProducts($db);
        break;

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

    default:
        sendJsonResponse(false, 'Invalid action', null, 400);
}

function handleListProducts($db) {
    $category = $_GET['category'] ?? null;
    $inStock = $_GET['in_stock'] ?? null;
    $badge = $_GET['badge'] ?? null;
    $limit = (int)($_GET['limit'] ?? 100);
    $offset = (int)($_GET['offset'] ?? 0);

    try {
        $where = [];
        $params = [];

        if ($category && $category !== 'all') {
            $where[] = "category = ?";
            $params[] = $category;
        }

        if ($inStock !== null) {
            $where[] = "in_stock = ?";
            $params[] = $inStock === 'true' ? 1 : 0;
        }

        if ($badge) {
            $where[] = "badge = ?";
            $params[] = $badge;
        }

        $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

        $stmt = $db->prepare("SELECT * FROM products $whereClause ORDER BY id DESC LIMIT ? OFFSET ?");

        // Bind parameters
        $paramIndex = 1;
        foreach ($params as $param) {
            $stmt->bindValue($paramIndex++, $param);
        }
        $stmt->bindValue($paramIndex++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($paramIndex, $offset, PDO::PARAM_INT);

        $stmt->execute();
        $products = $stmt->fetchAll();

        // Convert sizes back to array
        foreach ($products as &$product) {
            $product['sizes'] = $product['sizes'] ? explode(',', $product['sizes']) : [];
            $product['inStock'] = (bool)$product['in_stock'];
            $product['originalPrice'] = $product['original_price'];
            unset($product['in_stock'], $product['original_price']);
        }

        // Get total count
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM products $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        sendJsonResponse(true, 'Products retrieved successfully', [
            'products' => $products,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ]);

    } catch (PDOException $e) {
        sendJsonResponse(false, 'Failed to fetch products: ' . safeErrorMessage($e->getMessage()), null, 500);
    }
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

    $validCategories = ['wigs', 'clothing', 'shoes', 'accessories'];
    if (!in_array($category, $validCategories)) {
        sendJsonResponse(false, 'Invalid category', null, 400);
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
        sendJsonResponse(false, 'Failed to create product: ' . safeErrorMessage($e->getMessage()), null, 500);
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
?>
