-- ============================================
-- EVERYTHING CHOMMZY - Database Schema
-- Run this SQL in your Hostinger phpMyAdmin
-- ============================================

-- Create database (if not exists)
-- Note: On Hostinger, the database is usually already created
-- CREATE DATABASE IF NOT EXISTS your_database_name;
-- USE your_database_name;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    referral_code VARCHAR(20) UNIQUE,
    referred_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_referral_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    original_price DECIMAL(12, 2),
    image TEXT,
    category ENUM('wigs', 'clothing', 'shoes', 'accessories') NOT NULL,
    color VARCHAR(100),
    sizes TEXT,
    description TEXT,
    rating DECIMAL(2, 1) DEFAULT 0,
    reviews INT DEFAULT 0,
    badge VARCHAR(20),
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_in_stock (in_stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    items TEXT NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    shipping_fee DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    payment_status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
    order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_proof TEXT,
    notes TEXT,
    referral_code_used VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_status (order_status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REFERRALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_id VARCHAR(50) NOT NULL,
    referred_user_id VARCHAR(50) NOT NULL,
    referred_user_name VARCHAR(100),
    status ENUM('pending', 'completed') DEFAULT 'pending',
    reward DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_referrer_id (referrer_id),
    INDEX idx_referred_user_id (referred_user_id),
    INDEX idx_status (status),
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BANK ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
    id VARCHAR(50) PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_wishlist (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CART TABLE (for persistent cart)
-- ============================================
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    selected_size VARCHAR(20),
    selected_color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cart_item (user_id, product_id, selected_size, selected_color),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('order', 'payment', 'referral', 'promo', 'system') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT ADMIN USER
-- Password: admin123 (hashed with password_hash)
-- ============================================
INSERT INTO users (id, name, email, password, phone, role, referral_code) VALUES
('admin-001', 'Chommzy Admin', 'admin@everythingchommzy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '07062719113', 'admin', 'ECADMIN001')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- INSERT DEFAULT BANK ACCOUNT
-- ============================================
INSERT INTO bank_accounts (id, bank_name, account_number, account_name, is_active) VALUES
('default-opay', 'Opay', '7062719113', 'Ezeugo Chioma', TRUE)
ON DUPLICATE KEY UPDATE bank_name = VALUES(bank_name);

-- ============================================
-- INSERT SAMPLE PRODUCTS
-- ============================================
INSERT INTO products (name, price, original_price, image, category, color, sizes, description, rating, reviews, badge, in_stock) VALUES
-- Wigs
('Luxury Body Wave Lace Front Wig', 85000, 110000, 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=600', 'wigs', 'Black', '14",16",18",20",22"', 'Premium 100% human hair body wave lace front wig. Pre-plucked natural hairline with baby hairs for the most natural look.', 4.8, 24, 'hot', TRUE),
('Deep Wave HD Lace Closure Wig', 120000, 150000, 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=600', 'wigs', 'Black', '16",18",20",24"', 'Invisible HD lace closure wig with deep wave texture. Melts seamlessly into all skin tones.', 4.9, 31, 'new', TRUE),
('Straight Bone Silk Wig', 95000, NULL, 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg?auto=compress&cs=tinysrgb&w=600', 'wigs', 'Black', '14",16",18",20"', 'Sleek and silky straight bone wig made from virgin human hair.', 4.7, 18, NULL, TRUE),
('Kinky Curly Human Hair Wig', 110000, 135000, 'https://images.pexels.com/photos/973406/pexels-photo-973406.jpeg?auto=compress&cs=tinysrgb&w=600', 'wigs', 'Brown', '14",16",18"', 'Beautiful kinky curly texture wig that mimics natural African hair.', 4.6, 15, 'sale', TRUE),
('Short Bob Cut Lace Front Wig', 65000, NULL, 'https://images.pexels.com/photos/3651597/pexels-photo-3651597.jpeg?auto=compress&cs=tinysrgb&w=600', 'wigs', 'Black', '8",10",12"', 'Chic and trendy bob cut wig perfect for a bold look.', 4.5, 22, NULL, TRUE),
('Water Wave Frontal Wig', 135000, 165000, 'https://images.pexels.com/photos/2878741/pexels-photo-2878741.jpeg?auto=compress&cs=tinysrgb&w=600', 'wigs', 'Black', '18",20",22",26"', 'Stunning water wave texture on a 13x4 lace frontal.', 4.9, 28, 'hot', TRUE),
('Pixie Cut Short Wig', 45000, NULL, 'https://images.pexels.com/photos/3764579/pexels-photo-3764579.jpeg?auto=compress&cs=tinysrgb&w=600', 'wigs', 'Black', '6"', 'Bold and confident pixie cut wig. Low maintenance, high impact style.', 4.4, 12, NULL, TRUE),
('Burgundy Highlight Wig', 98000, 120000, 'https://images.pexels.com/photos/2531556/pexels-photo-2531556.jpeg?auto=compress&cs=tinysrgb&w=600', 'wigs', 'Red', '16",18",20"', 'Eye-catching burgundy highlight wig with body wave texture.', 4.7, 19, 'sale', TRUE),

-- Clothing
('Silk Evening Gown', 67500, 85000, 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600', 'clothing', 'Black', 'S,M,L,XL', 'Stunning silk evening gown perfect for formal occasions.', 4.8, 16, 'hot', TRUE),
('Casual Linen Jumpsuit', 38000, NULL, 'https://images.pexels.com/photos/2220316/pexels-photo-2220316.jpeg?auto=compress&cs=tinysrgb&w=600', 'clothing', 'White', 'S,M,L', 'Effortlessly chic linen jumpsuit for casual outings.', 4.5, 11, NULL, TRUE),
('Ankara Print Maxi Dress', 25000, NULL, 'https://images.pexels.com/photos/2065195/pexels-photo-2065195.jpeg?auto=compress&cs=tinysrgb&w=600', 'clothing', 'Multi', 'S,M,L,XL,XXL', 'Beautiful Ankara print maxi dress celebrating African heritage.', 4.6, 20, NULL, TRUE),
('Off-Shoulder Cocktail Dress', 42000, 55000, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=600', 'clothing', 'Red', 'S,M,L', 'Elegant off-shoulder cocktail dress perfect for parties.', 4.7, 14, 'sale', TRUE),
('Sequin Party Dress', 55000, NULL, 'https://images.pexels.com/photos/3622614/pexels-photo-3622614.jpeg?auto=compress&cs=tinysrgb&w=600', 'clothing', 'Gold', 'S,M,L', 'Dazzling sequin party dress that commands attention.', 4.8, 9, 'new', TRUE),
('Chiffon Blouse', 18000, NULL, 'https://images.pexels.com/photos/1030946/pexels-photo-1030946.jpeg?auto=compress&cs=tinysrgb&w=600', 'clothing', 'White', 'S,M,L,XL', 'Lightweight chiffon blouse with delicate details.', 4.3, 8, NULL, TRUE),
('High-Waist Palazzo Pants', 22000, NULL, 'https://images.pexels.com/photos/2529157/pexels-photo-2529157.jpeg?auto=compress&cs=tinysrgb&w=600', 'clothing', 'Black', 'S,M,L,XL', 'Flowing high-waist palazzo pants for a sophisticated look.', 4.4, 7, NULL, TRUE),
('Denim Jacket', 35000, 42000, 'https://images.pexels.com/photos/1021693/pexels-photo-1021693.jpeg?auto=compress&cs=tinysrgb&w=600', 'clothing', 'Blue', 'S,M,L,XL', 'Classic denim jacket with a modern fit.', 4.6, 13, NULL, TRUE),

-- Shoes
('Stiletto Heel Pumps', 42000, 52000, 'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=600', 'shoes', 'Red', '37,38,39,40,41', 'Classic stiletto heel pumps in a bold red.', 4.7, 21, 'sale', TRUE),
('Leather Ankle Boots', 54000, NULL, 'https://images.pexels.com/photos/2562992/pexels-photo-2562992.jpeg?auto=compress&cs=tinysrgb&w=600', 'shoes', 'Black', '37,38,39,40,41,42', 'Premium leather ankle boots with a comfortable block heel.', 4.8, 17, 'hot', TRUE),
('Platform Sandals', 28000, NULL, 'https://images.pexels.com/photos/1240892/pexels-photo-1240892.jpeg?auto=compress&cs=tinysrgb&w=600', 'shoes', 'Brown', '37,38,39,40', 'Trendy platform sandals perfect for summer.', 4.4, 10, NULL, TRUE),
('Pointed Toe Flats', 19500, NULL, 'https://images.pexels.com/photos/1102777/pexels-photo-1102777.jpeg?auto=compress&cs=tinysrgb&w=600', 'shoes', 'Black', '36,37,38,39,40', 'Elegant pointed toe flats for everyday sophistication.', 4.5, 14, NULL, TRUE),
('Block Heel Mules', 33000, 40000, 'https://images.pexels.com/photos/1537671/pexels-photo-1537671.jpeg?auto=compress&cs=tinysrgb&w=600', 'shoes', 'White', '37,38,39,40', 'Stylish block heel mules that combine comfort and fashion.', 4.6, 11, NULL, TRUE),
('Embellished Sneakers', 26000, NULL, 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=600', 'shoes', 'White', '37,38,39,40,41', 'Fashion-forward embellished sneakers for the style-conscious.', 4.3, 8, 'new', TRUE),

-- Accessories
('Gold Statement Necklace', 33000, NULL, 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=600', 'accessories', 'Gold', '', 'Bold gold statement necklace that transforms any outfit.', 4.7, 19, 'hot', TRUE),
('Designer Handbag', 157000, 195000, 'https://images.pexels.com/photos/1204464/pexels-photo-1204464.jpeg?auto=compress&cs=tinysrgb&w=600', 'accessories', 'Brown', '', 'Luxurious designer handbag crafted from premium leather.', 4.9, 26, 'hot', TRUE),
('Pearl Earring Set', 15000, NULL, 'https://images.pexels.com/photos/1413420/pexels-photo-1413420.jpeg?auto=compress&cs=tinysrgb&w=600', 'accessories', 'White', '', 'Elegant pearl earring set for a timeless look.', 4.5, 12, NULL, TRUE),
('Leather Belt', 12000, NULL, 'https://images.pexels.com/photos/904350/pexels-photo-904350.jpeg?auto=compress&cs=tinysrgb&w=600', 'accessories', 'Black', 'S,M,L', 'Premium leather belt with a polished buckle.', 4.4, 9, NULL, TRUE),
('Silk Head Scarf', 8500, NULL, 'https://images.pexels.com/photos/2584269/pexels-photo-2584269.jpeg?auto=compress&cs=tinysrgb&w=600', 'accessories', 'Multi', '', 'Luxurious silk head scarf with a beautiful print.', 4.6, 15, NULL, TRUE),
('Oversized Sunglasses', 18000, 22000, 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=600', 'accessories', 'Black', '', 'Fashion-forward oversized sunglasses with UV400 protection.', 4.5, 11, 'sale', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);
