// ============================================
// EVERYTHING CHOMMZY - Complete E-Commerce Engine
// ============================================

// ===========================================
// SECURITY: HTML Escape function to prevent XSS attacks
// ===========================================
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {

// ===========================================
// PASSWORD VISIBILITY TOGGLE - Universal handler (works on mobile + desktop)
// ===========================================
document.querySelectorAll('.password-toggle').forEach(toggle => {
    const handleToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = toggle.closest('.password-input-wrapper');
        const input = wrapper?.querySelector('input');
        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggle.innerHTML = isPassword
            ? '<i class="fas fa-eye-slash"></i>'
            : '<i class="fas fa-eye"></i>';
    };

    // Support both click and touch events for mobile compatibility
    toggle.addEventListener('click', handleToggle);
    toggle.addEventListener('touchend', handleToggle);
});

// ===========================================
// LOCAL FILE SYSTEM FIX - Add .html extensions when viewing locally
// ===========================================
// Helper function to get correct URL (adds .html for file:// protocol)
const INTERNAL_PAGES = ['home', 'products', 'product-detail', 'cart', 'checkout', 'wishlist', 'account',
                        'login', 'signup', 'forgot-password', 'contact', 'faq', 'privacy', 'terms', '404',
                        'ec-mgt-9k7x2', 'adminacc'];

function getPageUrl(url) {
    if (window.location.protocol !== 'file:') return url;
    if (!url || url.startsWith('http') || url.startsWith('#') || url.includes('.html')) return url;

    const [pagePart, queryPart] = url.split('?');
    if (INTERNAL_PAGES.includes(pagePart)) {
        return queryPart ? `${pagePart}.html?${queryPart}` : `${pagePart}.html`;
    }
    return url;
}

// Handle links with data-section attribute (for navigating to specific sections)
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-section]');
    if (!link) return;

    const section = link.getAttribute('data-section');
    const href = link.getAttribute('href');
    if (section && href) {
        e.preventDefault();
        const targetUrl = getPageUrl(href);
        // Store the section to activate in sessionStorage
        sessionStorage.setItem('activateSection', section);
        window.location.href = targetUrl;
    }
});

if (window.location.protocol === 'file:') {
    // Fix all internal links to include .html extension
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || link.hasAttribute('data-section')) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Skip external links, anchors, and links that already have extensions
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') ||
            href.startsWith('tel:') || href.startsWith('javascript:') || href.includes('.html')) return;

        const [pagePart, queryPart] = href.split('?');
        if (INTERNAL_PAGES.includes(pagePart)) {
            e.preventDefault();
            const newHref = queryPart ? `${pagePart}.html?${queryPart}` : `${pagePart}.html`;
            window.location.href = newHref;
        }
    });
}

// ===========================================
// 1. DATA STORE - Products, Default Admin, etc.
// ===========================================
const ALL_PRODUCTS = [
    // --- WIGS ---
    { id: 1, name: 'Luxury Body Wave Lace Front Wig', price: 85000, originalPrice: 110000, image: 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'wigs', color: 'Black', sizes: ['14"','16"','18"','20"','22"'], description: 'Premium 100% human hair body wave lace front wig. Pre-plucked natural hairline with baby hairs for the most natural look. Heat resistant and can be styled, colored, and bleached.', rating: 4.8, reviews: 24, badge: 'hot', inStock: true },
    { id: 2, name: 'Deep Wave HD Lace Closure Wig', price: 120000, originalPrice: 150000, image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'wigs', color: 'Black', sizes: ['16"','18"','20"','24"'], description: 'Invisible HD lace closure wig with deep wave texture. Melts seamlessly into all skin tones. Glueless design for easy wear and removal.', rating: 4.9, reviews: 31, badge: 'new', inStock: true },
    { id: 3, name: 'Straight Bone Silk Wig', price: 95000, originalPrice: null, image: 'https://images.pexels.com/photos/3065171/pexels-photo-3065171.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'wigs', color: 'Black', sizes: ['14"','16"','18"','20"'], description: 'Sleek and silky straight bone wig made from virgin human hair. Features a natural-looking hairline and comfortable adjustable cap.', rating: 4.7, reviews: 18, badge: null, inStock: true },
    { id: 4, name: 'Kinky Curly Human Hair Wig', price: 110000, originalPrice: 135000, image: 'https://images.pexels.com/photos/973406/pexels-photo-973406.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'wigs', color: 'Brown', sizes: ['14"','16"','18"'], description: 'Beautiful kinky curly texture wig that mimics natural African hair. Lightweight, breathable cap construction for all-day comfort.', rating: 4.6, reviews: 15, badge: 'sale', inStock: true },
    { id: 5, name: 'Short Bob Cut Lace Front Wig', price: 65000, originalPrice: null, image: 'https://images.pexels.com/photos/3651597/pexels-photo-3651597.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'wigs', color: 'Black', sizes: ['8"','10"','12"'], description: 'Chic and trendy bob cut wig perfect for a bold look. Easy to maintain and style for everyday wear.', rating: 4.5, reviews: 22, badge: null, inStock: true },
    { id: 6, name: 'Water Wave Frontal Wig', price: 135000, originalPrice: 165000, image: 'https://images.pexels.com/photos/2878741/pexels-photo-2878741.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'wigs', color: 'Black', sizes: ['18"','20"','22"','26"'], description: 'Stunning water wave texture on a 13x4 lace frontal. Creates beautiful, flowing waves that look completely natural.', rating: 4.9, reviews: 28, badge: 'hot', inStock: true },
    { id: 7, name: 'Pixie Cut Short Wig', price: 45000, originalPrice: null, image: 'https://images.pexels.com/photos/3764579/pexels-photo-3764579.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'wigs', color: 'Black', sizes: ['6"'], description: 'Bold and confident pixie cut wig. Low maintenance, high impact style perfect for the modern woman on the go.', rating: 4.4, reviews: 12, badge: null, inStock: true },
    { id: 8, name: 'Burgundy Highlight Wig', price: 98000, originalPrice: 120000, image: 'https://images.pexels.com/photos/2531556/pexels-photo-2531556.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'wigs', color: 'Red', sizes: ['16"','18"','20"'], description: 'Eye-catching burgundy highlight wig with body wave texture. Stand out from the crowd with this unique color blend.', rating: 4.7, reviews: 19, badge: 'sale', inStock: true },

    // --- CLOTHING ---
    { id: 9, name: 'Silk Evening Gown', price: 67500, originalPrice: 85000, image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'clothing', color: 'Black', sizes: ['S','M','L','XL'], description: 'Stunning silk evening gown perfect for formal occasions. Features an elegant drape and flattering silhouette.', rating: 4.8, reviews: 16, badge: 'hot', inStock: true },
    { id: 10, name: 'Casual Linen Jumpsuit', price: 38000, originalPrice: null, image: 'https://images.pexels.com/photos/2220316/pexels-photo-2220316.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'clothing', color: 'White', sizes: ['S','M','L'], description: 'Effortlessly chic linen jumpsuit for casual outings. Comfortable, breathable fabric perfect for warm weather.', rating: 4.5, reviews: 11, badge: null, inStock: true },
    { id: 11, name: 'Ankara Print Maxi Dress', price: 25000, originalPrice: null, image: 'https://images.pexels.com/photos/2065195/pexels-photo-2065195.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'clothing', color: 'Multi', sizes: ['S','M','L','XL','XXL'], description: 'Beautiful Ankara print maxi dress celebrating African heritage. Vibrant colors and comfortable fit for any occasion.', rating: 4.6, reviews: 20, badge: null, inStock: true },
    { id: 12, name: 'Off-Shoulder Cocktail Dress', price: 42000, originalPrice: 55000, image: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'clothing', color: 'Red', sizes: ['S','M','L'], description: 'Elegant off-shoulder cocktail dress perfect for parties and special events. Flattering fit with a modern twist.', rating: 4.7, reviews: 14, badge: 'sale', inStock: true },
    { id: 13, name: 'Sequin Party Dress', price: 55000, originalPrice: null, image: 'https://images.pexels.com/photos/3622614/pexels-photo-3622614.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'clothing', color: 'Gold', sizes: ['S','M','L'], description: 'Dazzling sequin party dress that commands attention. Perfect for nights out and celebrations.', rating: 4.8, reviews: 9, badge: 'new', inStock: true },
    { id: 14, name: 'Chiffon Blouse', price: 18000, originalPrice: null, image: 'https://images.pexels.com/photos/1030946/pexels-photo-1030946.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'clothing', color: 'White', sizes: ['S','M','L','XL'], description: 'Lightweight chiffon blouse with delicate details. Versatile piece that pairs beautifully with skirts or trousers.', rating: 4.3, reviews: 8, badge: null, inStock: true },
    { id: 15, name: 'High-Waist Palazzo Pants', price: 22000, originalPrice: null, image: 'https://images.pexels.com/photos/2529157/pexels-photo-2529157.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'clothing', color: 'Black', sizes: ['S','M','L','XL'], description: 'Flowing high-waist palazzo pants for a sophisticated look. Comfortable elastic waist with a flattering wide leg.', rating: 4.4, reviews: 7, badge: null, inStock: true },
    { id: 16, name: 'Denim Jacket', price: 35000, originalPrice: 42000, image: 'https://images.pexels.com/photos/1021693/pexels-photo-1021693.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'clothing', color: 'Blue', sizes: ['S','M','L','XL'], description: 'Classic denim jacket with a modern fit. A wardrobe essential that never goes out of style.', rating: 4.6, reviews: 13, badge: null, inStock: true },

    // --- SHOES ---
    { id: 17, name: 'Stiletto Heel Pumps', price: 42000, originalPrice: 52000, image: 'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'shoes', color: 'Red', sizes: ['37','38','39','40','41'], description: 'Classic stiletto heel pumps in a bold red. Elevate any outfit with these stunning statement shoes.', rating: 4.7, reviews: 21, badge: 'sale', inStock: true },
    { id: 18, name: 'Leather Ankle Boots', price: 54000, originalPrice: null, image: 'https://images.pexels.com/photos/2562992/pexels-photo-2562992.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'shoes', color: 'Black', sizes: ['37','38','39','40','41','42'], description: 'Premium leather ankle boots with a comfortable block heel. Perfect for both casual and dressed-up looks.', rating: 4.8, reviews: 17, badge: 'hot', inStock: true },
    { id: 19, name: 'Platform Sandals', price: 28000, originalPrice: null, image: 'https://images.pexels.com/photos/1240892/pexels-photo-1240892.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'shoes', color: 'Brown', sizes: ['37','38','39','40'], description: 'Trendy platform sandals perfect for summer. Comfortable sole with adjustable straps for the perfect fit.', rating: 4.4, reviews: 10, badge: null, inStock: true },
    { id: 20, name: 'Pointed Toe Flats', price: 19500, originalPrice: null, image: 'https://images.pexels.com/photos/1102777/pexels-photo-1102777.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'shoes', color: 'Black', sizes: ['36','37','38','39','40'], description: 'Elegant pointed toe flats for everyday sophistication. Cushioned insole for all-day comfort.', rating: 4.5, reviews: 14, badge: null, inStock: true },
    { id: 21, name: 'Block Heel Mules', price: 33000, originalPrice: 40000, image: 'https://images.pexels.com/photos/1537671/pexels-photo-1537671.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'shoes', color: 'White', sizes: ['37','38','39','40'], description: 'Stylish block heel mules that combine comfort and fashion. Easy slip-on design for effortless elegance.', rating: 4.6, reviews: 11, badge: null, inStock: true },
    { id: 22, name: 'Embellished Sneakers', price: 26000, originalPrice: null, image: 'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'shoes', color: 'White', sizes: ['37','38','39','40','41'], description: 'Fashion-forward embellished sneakers for the style-conscious. Comfortable enough for all-day wear with eye-catching details.', rating: 4.3, reviews: 8, badge: 'new', inStock: true },

    // --- ACCESSORIES ---
    { id: 23, name: 'Gold Statement Necklace', price: 33000, originalPrice: null, image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'accessories', color: 'Gold', sizes: [], description: 'Bold gold statement necklace that transforms any outfit. Hypoallergenic material with a stunning design.', rating: 4.7, reviews: 19, badge: 'hot', inStock: true },
    { id: 24, name: 'Designer Handbag', price: 157000, originalPrice: 195000, image: 'https://images.pexels.com/photos/1204464/pexels-photo-1204464.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'accessories', color: 'Brown', sizes: [], description: 'Luxurious designer handbag crafted from premium leather. Spacious interior with multiple compartments for organization.', rating: 4.9, reviews: 26, badge: 'hot', inStock: true },
    { id: 25, name: 'Pearl Earring Set', price: 15000, originalPrice: null, image: 'https://images.pexels.com/photos/1413420/pexels-photo-1413420.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'accessories', color: 'White', sizes: [], description: 'Elegant pearl earring set for a timeless look. Includes stud and drop styles for versatile wear.', rating: 4.5, reviews: 12, badge: null, inStock: true },
    { id: 26, name: 'Leather Belt', price: 12000, originalPrice: null, image: 'https://images.pexels.com/photos/904350/pexels-photo-904350.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'accessories', color: 'Black', sizes: ['S','M','L'], description: 'Premium leather belt with a polished buckle. A wardrobe essential that adds a finishing touch to any outfit.', rating: 4.4, reviews: 9, badge: null, inStock: true },
    { id: 27, name: 'Silk Head Scarf', price: 8500, originalPrice: null, image: 'https://images.pexels.com/photos/2584269/pexels-photo-2584269.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'accessories', color: 'Multi', sizes: [], description: 'Luxurious silk head scarf with a beautiful print. Can be worn as a headwrap, neck scarf, or bag accessory.', rating: 4.6, reviews: 15, badge: null, inStock: true },
    { id: 28, name: 'Oversized Sunglasses', price: 18000, originalPrice: 22000, image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=600', category: 'accessories', color: 'Black', sizes: [], description: 'Fashion-forward oversized sunglasses with UV400 protection. Make a statement while protecting your eyes in style.', rating: 4.5, reviews: 11, badge: 'sale', inStock: true }
];

const NIGERIAN_STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

const DEFAULT_ADMIN = { id: 'admin-001', name: 'Chommzy Admin', email: 'admin@everythingchommzy.com', phone: '07062719113', role: 'admin' };

const TESTIMONIALS = [
    { name: 'Desigo N.', location: 'Lagos', text: 'The wigs are absolutely stunning! The quality is top-notch and customer service was excellent. Will definitely be ordering again!', rating: 5 },
    { name: 'Ogochukwu G.', location: 'Kigali', text: 'I ordered the silk evening gown for a wedding and received so many compliments. Everything Chommzy never disappoints!', rating: 5 },
    { name: 'Chidera J.', location: 'Port Harcourt', text: 'Fast delivery and the products look exactly like the pictures. The handbag I ordered is now my favorite accessory.', rating: 4 },
    { name: 'Chidinma E.', location: 'Enugu', text: 'Best online fashion store! The deep wave wig is so natural looking. My friends could not believe it was a wig!', rating: 5 },
    { name: 'Amara U.', location: 'Owerri', text: 'Amazing quality shoes at great prices. The stiletto pumps are both gorgeous and comfortable. Love this store!', rating: 5 },
    { name: 'Ada M.', location: 'Anambra', text: 'Everything Chommzy has become my go-to shop. The Ankara dress I bought was perfect for my birthday celebration!', rating: 4 }
];

// ===========================================
// 2. UTILITY FUNCTIONS
// ===========================================
const formatPrice = (price) => `\u20A6${price.toLocaleString()}`;
const generateId = () => 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';

// Image optimization - resize Pexels images based on screen size
const optimizeImageUrl = (url, width = 400) => {
    if (!url) return url;
    // For Pexels images, adjust the width parameter for mobile
    if (url.includes('pexels.com')) {
        const isMobile = window.innerWidth <= 768;
        const targetWidth = isMobile ? Math.min(width, 300) : width;
        // Replace width parameter in Pexels URLs
        return url.replace(/w=\d+/, `w=${targetWidth}`).replace(/&dpr=\d+/, '');
    }
    return url;
};

// Lazy load images with Intersection Observer
const lazyLoadImages = () => {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '50px 0px', threshold: 0.01 });

        document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        });
    }
};

function getFromStorage(key, fallback = []) {
    try {
        // Try localStorage first, then sessionStorage as fallback (for Safari private mode)
        const value = localStorage.getItem(key) || sessionStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch { return fallback; }
}
function saveToStorage(key, data) {
    try {
        const json = JSON.stringify(data);
        localStorage.setItem(key, json);
        sessionStorage.setItem(key, json); // Backup for Safari
    } catch (e) {
        console.error('Storage error:', e);
    }
}

// ===========================================
// 2.1 API CONFIGURATION & UTILITIES
// ===========================================
const API_CONFIG = {
    // Set to true when deploying to Hostinger, false for local development
    useAPI: window.location.protocol !== 'file:' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'),
    baseURL: '/api',  // API endpoint base path
    timeout: 30000     // 30 second timeout
};

// API Helper Functions
const API = {
    // Get auth token from storage (check both user and admin sessions)
    getToken() {
        const user = getFromStorage('chommzyCurrentUser', null);
        if (user?.token) return user.token;
        const admin = getFromStorage('chommzyAdminSession', null);
        return admin?.token || null;
    },

    // Make API request
    async request(endpoint, options = {}) {
        if (!API_CONFIG.useAPI) {
            return { success: false, useLocalStorage: true };
        }

        const url = `${API_CONFIG.baseURL}/${endpoint}`;
        const token = this.getToken();

        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

            const response = await fetch(url, { ...config, signal: controller.signal });
            clearTimeout(timeoutId);

            // Check if response is empty
            const text = await response.text();
            if (!text) {
                console.error('Empty response from:', url);
                return { success: false, message: 'Server returned empty response. Please try again.' };
            }

            try {
                const data = JSON.parse(text);
                // Show debug info if available (temporary for troubleshooting)
                if (data.debug) {
                    console.error('Server debug:', data.debug);
                    data.message = data.message + ': ' + data.debug;
                }
                return data;
            } catch (parseError) {
                console.error('JSON parse error:', text.substring(0, 200));
                return { success: false, message: 'Server error. Please try again.' };
            }
        } catch (error) {
            console.error('API Error:', error);
            if (error.name === 'AbortError') {
                return { success: false, message: 'Request timed out. Please try again.' };
            }
            return { success: false, message: 'Connection error. Please check your internet.' };
        }
    },

    // GET request
    async get(endpoint, params = {}) {
        const queryString = Object.keys(params).length
            ? '?' + new URLSearchParams(params).toString()
            : '';
        return this.request(endpoint + queryString);
    },

    // POST request
    async post(endpoint, body = {}) {
        return this.request(endpoint, { method: 'POST', body });
    },

    // Auth endpoints
    auth: {
        async login(email, password) {
            return API.post('auth.php?action=login', { email, password });
        },
        async signup(data) {
            return API.post('auth.php?action=signup', data);
        },
        async adminLogin(email, password) {
            return API.post('auth.php?action=admin-login', { email, password });
        },
        async forgotPassword(email) {
            return API.post('auth.php?action=forgot-password', { email });
        },
        async updateProfile(data) {
            return API.post('auth.php?action=update-profile', data);
        },
        async changePassword(currentPassword, newPassword) {
            return API.post('auth.php?action=change-password', { currentPassword, newPassword });
        }
    },

    // OTP endpoints
    otp: {
        async send(email, purpose = 'signup') {
            return API.post('otp.php?action=send', { email, purpose });
        },
        async verify(email, otp, purpose = 'signup') {
            return API.post('otp.php?action=verify', { email, otp, purpose });
        },
        async resend(email, purpose = 'signup') {
            return API.post('otp.php?action=resend', { email, purpose });
        },
        async resetPassword(email, otp, newPassword) {
            return API.post('otp.php?action=reset-password', { email, otp, newPassword });
        }
    },

    // Products endpoints
    products: {
        async list(params = {}) {
            return API.get('products.php?action=list', params);
        },
        async get(id) {
            return API.get('products.php?action=get', { id });
        },
        async create(data) {
            return API.post('products.php?action=create', data);
        },
        async update(data) {
            return API.post('products.php?action=update', data);
        },
        async delete(id) {
            return API.post('products.php?action=delete', { id });
        },
        async search(query) {
            return API.get('products.php?action=search', { q: query });
        }
    },

    // Orders endpoints
    orders: {
        async list(params = {}) {
            return API.get('orders.php?action=list', params);
        },
        async get(id) {
            return API.get('orders.php?action=get', { id });
        },
        async create(data) {
            return API.post('orders.php?action=create', data);
        },
        async updateStatus(orderId, status) {
            return API.post('orders.php?action=update-status', { orderId, status });
        },
        async confirmPayment(orderId, status = 'confirmed') {
            return API.post('orders.php?action=confirm-payment', { orderId, status });
        },
        async userOrders() {
            return API.get('orders.php?action=user-orders');
        },
        async stats() {
            return API.get('orders.php?action=stats');
        },
        async confirmReceipt(orderId) {
            return API.post('orders.php?action=confirm-receipt', { orderId });
        }
    },

    // Referrals endpoints
    referrals: {
        async list() {
            return API.get('referrals.php?action=list');
        },
        async userReferrals() {
            return API.get('referrals.php?action=user-referrals');
        },
        async userStats() {
            return API.get('referrals.php?action=user-stats');
        },
        async allStats() {
            return API.get('referrals.php?action=all-stats');
        },
        async validateCode(code) {
            return API.get('referrals.php?action=validate-code', { code });
        }
    },

    // Users endpoints
    users: {
        async list(params = {}) {
            return API.get('users.php?action=list', params);
        },
        async get(id) {
            return API.get('users.php?action=get', { id });
        },
        async delete(id) {
            return API.post('users.php?action=delete', { id });
        },
        async stats() {
            return API.get('users.php?action=stats');
        }
    },

    // Bank accounts endpoints
    bank: {
        async list() {
            return API.get('bank.php?action=list');
        },
        async active() {
            return API.get('bank.php?action=active');
        },
        async create(data) {
            return API.post('bank.php?action=create', data);
        },
        async update(data) {
            return API.post('bank.php?action=update', data);
        },
        async delete(id) {
            return API.post('bank.php?action=delete', { id });
        },
        async toggle(id, isActive) {
            return API.post('bank.php?action=toggle', { id, isActive });
        }
    },

    // Cart endpoints (for logged-in users)
    cart: {
        async get() {
            return API.get('cart.php?action=get');
        },
        async add(productId, quantity, selectedSize, selectedColor) {
            return API.post('cart.php?action=add', { productId, quantity, selectedSize, selectedColor });
        },
        async update(itemId, quantity) {
            return API.post('cart.php?action=update', { itemId, quantity });
        },
        async remove(itemId) {
            return API.post('cart.php?action=remove', { itemId });
        },
        async clear() {
            return API.post('cart.php?action=clear');
        }
    },

    // Wishlist endpoints
    wishlist: {
        async get() {
            return API.get('cart.php?action=wishlist-get');
        },
        async add(productId) {
            return API.post('cart.php?action=wishlist-add', { productId });
        },
        async remove(productId) {
            return API.post('cart.php?action=wishlist-remove', { productId });
        }
    },

    // Settings endpoints
    settings: {
        async getFlashDeals() {
            return API.get('settings.php?action=flash-deals');
        },
        async updateFlashDeals(settings) {
            return API.post('settings.php?action=update-flash-deals', settings);
        },
        async get() {
            return API.get('settings.php?action=get');
        },
        async update(key, value) {
            return API.post('settings.php?action=update', { key, value });
        }
    },

    // Notifications endpoints
    notifications: {
        async list() {
            return API.get('notifications.php?action=list');
        },
        async markRead(notificationId) {
            return API.post('notifications.php?action=mark-read', { notificationId });
        },
        async markAllRead() {
            return API.post('notifications.php?action=mark-all-read');
        },
        async delete(notificationId) {
            return API.post('notifications.php?action=delete', { notificationId });
        },
        async unreadCount() {
            return API.get('notifications.php?action=unread-count');
        },
        async sendAnnouncement(title, message, recipients = 'all', userIds = []) {
            return API.post('notifications.php?action=send-announcement', { title, message, recipients, userIds });
        },
        async listAnnouncements() {
            return API.get('notifications.php?action=announcements');
        },
        async deleteAnnouncement(announcementId) {
            return API.post('notifications.php?action=delete-announcement', { announcementId });
        }
    }
};

// Initialize default admin user (for local development)
function initializeDefaults() {
    if (API_CONFIG.useAPI) return; // Skip for API mode

    let users = getFromStorage('chommzyUsers', []);
    if (!users.find(u => u.role === 'admin')) {
        users.push(DEFAULT_ADMIN);
        saveToStorage('chommzyUsers', users);
    }
    // Save products to storage so admin can manage them
    if (!localStorage.getItem('chommzyProducts')) {
        saveToStorage('chommzyProducts', ALL_PRODUCTS);
    }
}
initializeDefaults();

// ===========================================
// 2.2 DATA ACCESS FUNCTIONS (API + LocalStorage hybrid)
// ===========================================
// Products - fetches from API if available, falls back to localStorage
let cachedProducts = null;
async function fetchProducts(forceRefresh = false) {
    if (cachedProducts && !forceRefresh) return cachedProducts;

    if (API_CONFIG.useAPI) {
        const result = await API.products.list();
        if (result.success && result.data?.products) {
            cachedProducts = result.data.products;
            saveToStorage('chommzyProducts', cachedProducts);
            return cachedProducts;
        }
    }
    return getFromStorage('chommzyProducts', ALL_PRODUCTS);
}

// Synchronous getters (use cached/localStorage data)
function getProducts() { return cachedProducts || getFromStorage('chommzyProducts', ALL_PRODUCTS); }
function getCart() { return getFromStorage('chommzyCart', []); }
function getWishlist() { return getFromStorage('chommzyWishlist', []); }
function getOrders() { return getFromStorage('chommzyOrders', []); }
function getBankAccounts() {
    const defaultAccounts = [{
        id: 'default-opay',
        bankName: 'Opay',
        accountNumber: '7062719113',
        accountName: 'Ezeugo Chioma',
        isActive: true
    }];
    const stored = getFromStorage('chommzyBankAccounts', null);
    if (!stored || stored.length === 0) {
        saveToStorage('chommzyBankAccounts', defaultAccounts);
        return defaultAccounts;
    }
    return stored;
}
function getUsers() { return getFromStorage('chommzyUsers', []); }
function getCurrentUser() { return getFromStorage('chommzyCurrentUser', null); }
function getNotifications() { return getFromStorage('chommzyNotifications', []); }

// Initialize products cache on page load
fetchProducts();

// ===========================================
// 3. TOAST NOTIFICATION SYSTEM
// ===========================================
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: 'fa-check',
        error: 'fa-exclamation',
        info: 'fa-info'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon-wrap">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-body">
            <span class="toast-message">${message}</span>
            <button class="toast-close"><i class="fas fa-times"></i></button>
            <div class="toast-progress"></div>
        </div>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
    setTimeout(() => removeToast(toast), 4000);
}

function removeToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
}

// Custom Confirm Modal
function showConfirmModal({ title, message, icon, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
    // Remove existing modal if any
    document.querySelector('.confirm-modal-overlay')?.remove();

    const modal = document.createElement('div');
    modal.className = 'confirm-modal-overlay';
    modal.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-modal-icon">
                <i class="fas ${icon || 'fa-question-circle'}"></i>
            </div>
            <h3 class="confirm-modal-title">${title}</h3>
            <p class="confirm-modal-message">${message}</p>
            <div class="confirm-modal-actions">
                <button class="btn btn-outline confirm-modal-cancel">${cancelText}</button>
                <button class="btn btn-primary confirm-modal-confirm">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add('active'));

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.confirm-modal-confirm').addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });

    modal.querySelector('.confirm-modal-cancel').addEventListener('click', () => {
        closeModal();
        if (onCancel) onCancel();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
            if (onCancel) onCancel();
        }
    });
}

// ===========================================
// 4. HEADER & NAVIGATION
// ===========================================
// Update header based on auth state
function updateHeader() {
    const user = getCurrentUser();
    const cart = getCart();
    const wishlist = getWishlist();

    // Update cart count
    document.querySelectorAll('.cart-count').forEach(el => {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'flex' : 'none';
    });

    // Update wishlist count
    document.querySelectorAll('.wishlist-count').forEach(el => {
        el.textContent = wishlist.length;
        el.style.display = wishlist.length > 0 ? 'flex' : 'none';
    });

    // Update notification count
    if (user) {
        const notifications = getNotifications();
        const unreadCount = notifications.filter(n => !n.read && n.userId === user.id).length;
        document.querySelectorAll('.notif-count').forEach(el => {
            el.textContent = unreadCount;
            el.style.display = unreadCount > 0 ? 'flex' : 'none';
        });
    }

    // Update auth buttons and body class for logged-in state
    if (user && user.role !== 'admin') {
        document.body.classList.add('user-logged-in');
        document.querySelectorAll('.auth-header-btn').forEach(el => {
            el.innerHTML = `<i class="fas fa-user"></i>`;
            el.href = 'account';
            el.title = user.name;
        });
    } else {
        document.body.classList.remove('user-logged-in');
        document.querySelectorAll('.auth-header-btn').forEach(el => {
            el.innerHTML = `<i class="fas fa-user"></i>`;
            el.href = 'login';
            el.title = 'Login';
        });
    }
}

// Sticky header
const header = document.querySelector('.main-header');
if (header) {
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// Mobile nav toggle
const navToggle = document.getElementById('mobile-nav-toggle');
const mainNav = document.getElementById('main-nav');
if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => mainNav.classList.toggle('active'));
}

// Search functionality
const searchInputs = document.querySelectorAll('.search-bar-wrapper input');
searchInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = input.value.trim();
            if (query) window.location.href = getPageUrl(`products?search=${encodeURIComponent(query)}`);
        }
    });
    const btn = input.parentElement.querySelector('button');
    if (btn) {
        btn.addEventListener('click', () => {
            const query = input.value.trim();
            if (query) window.location.href = getPageUrl(`products?search=${encodeURIComponent(query)}`);
        });
    }
});

// ===========================================
// 5. HERO SLIDER
// ===========================================
const heroSection = document.querySelector('.hero-section');
if (heroSection) {
    const slides = heroSection.querySelectorAll('.hero-slide');
    const dots = heroSection.querySelectorAll('.hero-dot');
    let currentSlide = 0;
    let slideInterval;

    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
        currentSlide = index;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
        goToSlide((currentSlide + 1) % slides.length);
    }

    function startSlider() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            clearInterval(slideInterval);
            goToSlide(i);
            startSlider();
        });
    });

    if (slides.length > 1) startSlider();
}

// ===========================================
// 6. PRODUCT RENDERING
// ===========================================
function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) stars += '<i class="fas fa-star"></i>';
        else if (i - 0.5 <= rating) stars += '<i class="fas fa-star-half-alt"></i>';
        else stars += '<i class="far fa-star"></i>';
    }
    return stars;
}

function createProductCard(product) {
    const wishlist = getWishlist();
    const isWishlisted = wishlist.includes(product.id);
    const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
    const optimizedImage = optimizeImageUrl(product.image, 400);

    const card = document.createElement('div');
    card.className = 'product-card animate-fade-in';
    card.innerHTML = `
        <div class="product-image-wrapper">
            <a href="product-detail?id=${product.id}">
                <img src="${optimizedImage}" alt="${escapeHtml(product.name)}" loading="lazy">
            </a>
            ${product.badge ? `<span class="product-badge ${escapeHtml(product.badge)}">${escapeHtml(product.badge)}</span>` : ''}
            <div class="product-actions">
                <button class="product-action-btn wishlist-toggle ${isWishlisted ? 'wishlisted' : ''}" data-id="${product.id}" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                    <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="product-action-btn quick-view-btn" data-id="${product.id}" title="Quick View">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
        <div class="product-info">
            <div class="product-category-label">${escapeHtml(product.category)}</div>
            <h3><a href="product-detail?id=${product.id}">${escapeHtml(product.name)}</a></h3>
            <div class="product-rating">
                <span class="stars">${renderStars(product.rating)}</span>
                <span class="count">(${product.reviews})</span>
            </div>
            <div class="product-price-row">
                <span class="product-price">${formatPrice(product.price)}</span>
                ${product.originalPrice ? `<span class="product-original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                ${discount ? `<span class="product-discount">-${discount}%</span>` : ''}
            </div>
        </div>
        <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
    `;
    return card;
}

function displayProducts(container, products) {
    if (!container) return;
    container.innerHTML = '';
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-cart" style="grid-column:1/-1;"><i class="fas fa-search"></i><h3>No products found</h3><p>Try adjusting your filters or search terms.</p></div>';
        return;
    }
    products.forEach(product => container.appendChild(createProductCard(product)));
    // Initialize lazy loading for newly added images
    lazyLoadImages();
}

// ===========================================
// 7. HOMEPAGE SECTIONS
// ===========================================
// Featured products on home
const featuredGrid = document.getElementById('featured-products-grid');
if (featuredGrid) {
    const products = getProducts();
    const featured = products.filter(p => p.badge === 'hot' || p.badge === 'new').slice(0, 8);
    displayProducts(featuredGrid, featured.length ? featured : products.slice(0, 8));
}

// Flash deals
const flashGrid = document.getElementById('flash-deals-grid');
if (flashGrid) {
    const products = getProducts();
    const deals = products.filter(p => p.originalPrice).slice(0, 4);
    displayProducts(flashGrid, deals);
}

// New arrivals
const newGrid = document.getElementById('new-arrivals-grid');
if (newGrid) {
    const products = getProducts();
    const newItems = products.filter(p => p.badge === 'new').slice(0, 4);
    displayProducts(newGrid, newItems.length ? newItems : products.slice(4, 8));
}

// Testimonials
const testimonialsGrid = document.getElementById('testimonials-grid');
if (testimonialsGrid) {
    testimonialsGrid.innerHTML = TESTIMONIALS.slice(0, 3).map(t => `
        <div class="testimonial-card">
            <div class="stars">${renderStars(t.rating)}</div>
            <p>"${t.text}"</p>
            <div class="author">${t.name}<span>${t.location}</span></div>
        </div>
    `).join('');
}

// Countdown timer - Flash deals with admin settings
const flashDealSection = document.querySelector('.flash-deal-header')?.closest('section');
const countdownEls = document.querySelectorAll('.countdown-box .number');

function getFlashDealsSettingsLocal() {
    const defaults = {
        enabled: true,
        endDate: '',
        endTime: '23:59',
        title: 'Flash Deals',
        subtitle: "Hurry, these deals won't last long!"
    };
    const saved = localStorage.getItem('chommzyFlashDealsSettings');
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
}

// Fetch flash deals settings (from API or localStorage)
async function initFlashDeals() {
    let settings = getFlashDealsSettingsLocal();

    // Try API to get latest settings
    if (API_CONFIG.useAPI) {
        try {
            const result = await API.settings.getFlashDeals();
            if (result.success && result.data) {
                settings = result.data;
                // Cache in localStorage
                localStorage.setItem('chommzyFlashDealsSettings', JSON.stringify(settings));
            }
        } catch (e) {
            // Use cached settings
        }
    }

    if (flashDealSection) {
        // Hide section if disabled
        if (!settings.enabled) {
            flashDealSection.style.display = 'none';
        } else {
            flashDealSection.style.display = '';

            // Update title and subtitle
            const titleEl = flashDealSection.querySelector('h2');
            const subtitleEl = flashDealSection.querySelector('.text-muted');
            if (titleEl && settings.title) titleEl.textContent = settings.title;
            if (subtitleEl && settings.subtitle) subtitleEl.textContent = settings.subtitle;
        }
    }

    return settings;
}

if (countdownEls.length === 4) {
    let currentSettings = getFlashDealsSettingsLocal();

    // Initialize and get settings
    initFlashDeals().then(s => { currentSettings = s; });

    function updateCountdown() {
        const settings = currentSettings;
        const now = new Date();
        let cycleEnd;

        // Use admin-set end date if available
        if (settings.endDate) {
            const [year, month, day] = settings.endDate.split('-');
            const [hours, minutes] = (settings.endTime || '23:59').split(':');
            cycleEnd = new Date(year, month - 1, day, hours, minutes, 0);
        } else {
            // Default: Flash deal resets every 3 days from a fixed start point
            const cycleStart = new Date('2025-01-01T00:00:00');
            const cycleDuration = 3 * 24 * 60 * 60 * 1000; // 3 days in ms
            const elapsed = now - cycleStart;
            const currentCycleStart = new Date(cycleStart.getTime() + Math.floor(elapsed / cycleDuration) * cycleDuration);
            cycleEnd = new Date(currentCycleStart.getTime() + cycleDuration);
        }

        const diff = cycleEnd - now;
        if (diff <= 0) {
            countdownEls[0].textContent = '00';
            countdownEls[1].textContent = '00';
            countdownEls[2].textContent = '00';
            countdownEls[3].textContent = '00';
            return;
        }

        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);

        countdownEls[0].textContent = String(days).padStart(2, '0');
        countdownEls[1].textContent = String(hours).padStart(2, '0');
        countdownEls[2].textContent = String(minutes).padStart(2, '0');
        countdownEls[3].textContent = String(seconds).padStart(2, '0');
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
} else if (flashDealSection) {
    // No countdown elements, just apply settings
    initFlashDeals();
}

// ===========================================
// 8. PRODUCTS PAGE - FILTERING & SORTING
// ===========================================
const productGrid = document.getElementById('product-grid');
if (productGrid) {
    const products = getProducts();
    const urlParams = new URLSearchParams(window.location.search);

    let filters = {
        category: urlParams.get('category') || 'all',
        search: urlParams.get('search') || '',
        color: null,
        maxPrice: 250000,
        sort: 'default'
    };

    // Set search input value
    if (filters.search) {
        searchInputs.forEach(input => input.value = filters.search);
    }

    // Function to sync top nav category highlighting with sidebar
    function syncNavCategoryHighlight(category) {
        // Remove active from all category nav links (Wigs, Clothing, Shoes, Accessories)
        document.querySelectorAll('.main-nav .nav-link[href*="category="]').forEach(link => {
            link.classList.remove('active');
        });
        // Handle Shop link - active only when "all" is selected
        const shopLink = document.querySelector('.main-nav .nav-link[href="products"]');
        if (shopLink) {
            shopLink.classList.toggle('active', category === 'all');
        }
        // Add active to the matching category nav link
        if (category !== 'all') {
            const categoryLink = document.querySelector(`.main-nav .nav-link[href="products?category=${category}"]`);
            if (categoryLink) categoryLink.classList.add('active');
        }
    }

    // Set active category filter
    if (filters.category !== 'all') {
        document.querySelectorAll('.filter-option[data-category]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === filters.category);
        });
    }
    // Sync nav on initial load
    syncNavCategoryHighlight(filters.category);

    // Update title
    const titleEl = document.getElementById('category-title');
    function updateTitle() {
        if (!titleEl) return;
        if (filters.search) {
            titleEl.textContent = `Search: "${filters.search}"`;
        } else if (filters.category !== 'all') {
            titleEl.textContent = filters.category.charAt(0).toUpperCase() + filters.category.slice(1);
        } else {
            titleEl.textContent = 'All Products';
        }
    }
    updateTitle();

    function applyFilters() {
        let filtered = [...products];

        // Category filter
        if (filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        // Search filter
        if (filters.search) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.color.toLowerCase().includes(q)
            );
        }

        // Color filter
        if (filters.color) {
            filtered = filtered.filter(p => p.color === filters.color);
        }

        // Price filter
        filtered = filtered.filter(p => p.price <= filters.maxPrice);

        // Sorting
        switch (filters.sort) {
            case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
            case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
            case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
            case 'newest': filtered.sort((a, b) => b.id - a.id); break;
        }

        // Update result count
        const countEl = document.querySelector('.result-count');
        if (countEl) countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`;

        displayProducts(productGrid, filtered);
        updateTitle();
    }

    // Category filters
    document.querySelectorAll('.filter-option[data-category]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.filter-option[data-category]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filters.category = btn.dataset.category;
            syncNavCategoryHighlight(filters.category);
            applyFilters();
        });
    });

    // Color filters
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            if (swatch.classList.contains('active')) {
                swatch.classList.remove('active');
                filters.color = null;
            } else {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                filters.color = swatch.dataset.color;
            }
            applyFilters();
        });
    });

    // Price range
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            filters.maxPrice = parseInt(e.target.value);
            if (priceValue) priceValue.textContent = parseInt(e.target.value).toLocaleString();
            applyFilters();
        });
    }

    // Sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            filters.sort = sortSelect.value;
            applyFilters();
        });
    }

    // Reset
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            filters = { category: 'all', search: '', color: null, maxPrice: 250000, sort: 'default' };
            document.querySelectorAll('.filter-option[data-category]').forEach(b => b.classList.remove('active'));
            document.querySelector('.filter-option[data-category="all"]')?.classList.add('active');
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            if (priceRange) { priceRange.value = 250000; priceValue.textContent = '250,000'; }
            if (sortSelect) sortSelect.value = 'default';
            searchInputs.forEach(input => input.value = '');
            syncNavCategoryHighlight('all');
            applyFilters();
        });
    }

    // Mobile filter toggle
    const mobileFilterBtn = document.querySelector('.mobile-filter-btn');
    const filterSidebar = document.querySelector('.filter-sidebar');
    const filterOverlay = document.querySelector('.filter-overlay');
    if (mobileFilterBtn && filterSidebar) {
        mobileFilterBtn.addEventListener('click', () => {
            filterSidebar.classList.add('open');
            if (filterOverlay) filterOverlay.classList.add('active');
        });
        if (filterOverlay) {
            filterOverlay.addEventListener('click', () => {
                filterSidebar.classList.remove('open');
                filterOverlay.classList.remove('active');
            });
        }
    }

    applyFilters();
}

// ===========================================
// 9. PRODUCT DETAIL PAGE
// ===========================================
const productDetailSection = document.querySelector('.product-detail-section');
if (productDetailSection) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const products = getProducts();
    const product = products.find(p => p.id === productId);

    if (product) {
        // Fill in product data
        document.getElementById('detail-image').src = product.image;
        document.getElementById('detail-name').textContent = product.name;
        document.getElementById('detail-price').textContent = formatPrice(product.price);
        document.getElementById('detail-category-breadcrumb').textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
        document.getElementById('detail-category-breadcrumb').href = `products?category=${product.category}`;
        document.getElementById('detail-description').textContent = product.description;
        document.getElementById('detail-rating-stars').innerHTML = renderStars(product.rating);
        document.getElementById('detail-rating-count').textContent = `(${product.reviews} reviews)`;
        document.getElementById('detail-long-description').textContent = product.description;

        // Meta info
        document.getElementById('detail-meta-category').textContent = product.category.charAt(0).toUpperCase() + product.category.slice(1);
        document.getElementById('detail-meta-color').textContent = product.color;

        if (product.originalPrice) {
            document.getElementById('detail-original-price').textContent = formatPrice(product.originalPrice);
            document.getElementById('detail-original-price').style.display = 'inline';
            const discount = Math.round((1 - product.price / product.originalPrice) * 100);
            document.getElementById('detail-discount').textContent = `-${discount}%`;
            document.getElementById('detail-discount').style.display = 'inline';
        }

        // Sizes
        const sizesContainer = document.getElementById('detail-sizes');
        if (sizesContainer && product.sizes.length > 0) {
            sizesContainer.innerHTML = product.sizes.map((s, i) =>
                `<button class="size-btn ${i === 0 ? 'active' : ''}" data-size="${escapeHtml(s)}">${escapeHtml(s)}</button>`
            ).join('');
            sizesContainer.querySelectorAll('.size-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    sizesContainer.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
            document.getElementById('detail-sizes-section').style.display = 'block';
        }

        // Quantity
        let quantity = 1;
        const qtyInput = document.getElementById('detail-qty');
        const qtyMinus = document.getElementById('detail-qty-minus');
        const qtyPlus = document.getElementById('detail-qty-plus');
        if (qtyMinus) qtyMinus.addEventListener('click', () => { if (quantity > 1) { quantity--; qtyInput.value = quantity; } });
        if (qtyPlus) qtyPlus.addEventListener('click', () => { quantity++; qtyInput.value = quantity; });
        if (qtyInput) qtyInput.addEventListener('change', () => { quantity = Math.max(1, parseInt(qtyInput.value) || 1); qtyInput.value = quantity; });

        // Add to cart
        const addBtn = document.getElementById('detail-add-to-cart');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const selectedSize = sizesContainer?.querySelector('.size-btn.active')?.dataset.size || '';
                addToCart(product, quantity, selectedSize);
            });
        }

        // Wishlist toggle
        const wishBtn = document.getElementById('detail-wishlist-btn');
        if (wishBtn) {
            const wl = getWishlist();
            if (wl.includes(product.id)) {
                wishBtn.classList.add('wishlisted');
                wishBtn.innerHTML = '<i class="fas fa-heart"></i> Wishlisted';
            }
            wishBtn.addEventListener('click', () => toggleWishlist(product.id));
        }

        // Tabs
        document.querySelectorAll('.tab-header').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab-header').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab)?.classList.add('active');
            });
        });

        // Reviews
        const reviewsContainer = document.getElementById('detail-reviews');
        if (reviewsContainer) {
            const sampleReviews = [
                { name: 'Chioma A.', date: '2 weeks ago', rating: 5, text: 'Absolutely love this! The quality exceeded my expectations. Will order again.' },
                { name: 'Ngozi E.', date: '1 month ago', rating: 4, text: 'Great product, fast delivery. The color is exactly as shown in the pictures.' },
                { name: 'Amaka O.', date: '1 month ago', rating: 5, text: 'Perfect! Received so many compliments. Everything Chommzy is the best.' }
            ];
            reviewsContainer.innerHTML = sampleReviews.map(r => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="review-avatar">${escapeHtml(getInitials(r.name))}</div>
                        <div>
                            <div class="review-author">${escapeHtml(r.name)}</div>
                            <div class="review-date">${escapeHtml(r.date)}</div>
                        </div>
                    </div>
                    <div class="review-stars">${renderStars(r.rating)}</div>
                    <div class="review-text">${escapeHtml(r.text)}</div>
                </div>
            `).join('');
        }

        // Related products
        const relatedGrid = document.getElementById('related-products-grid');
        if (relatedGrid) {
            const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
            displayProducts(relatedGrid, related);
        }

        // Page title
        document.title = `${product.name} - Everything Chommzy`;
    }
}

// ===========================================
// 10. CART SYSTEM
// ===========================================
function addToCart(product, quantity = 1, size = '') {
    let cart = getCart();
    const existingIndex = cart.findIndex(item => item.productId === product.id && item.size === size);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            color: product.color,
            size: size,
            quantity: quantity
        });
    }

    saveToStorage('chommzyCart', cart);
    updateHeader();
    showToast(`${product.name} added to cart!`, 'success');

    // Animate cart icon
    document.querySelectorAll('.cart-count').forEach(el => {
        el.style.animation = 'cartBounce 0.4s ease';
        setTimeout(() => el.style.animation = '', 400);
    });
}

function removeFromCart(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveToStorage('chommzyCart', cart);
    updateHeader();
    renderCart();
}

function updateCartQuantity(index, newQty) {
    let cart = getCart();
    if (newQty < 1) {
        removeFromCart(index);
        return;
    }
    cart[index].quantity = newQty;
    saveToStorage('chommzyCart', cart);
    updateHeader();
    renderCart();
}

// Global add-to-cart handler (for product cards)
document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (btn) {
        e.preventDefault();
        const productId = parseInt(btn.dataset.id);
        const products = getProducts();
        const product = products.find(p => p.id === productId);
        if (product) addToCart(product);
    }
});

// Cart page rendering
function renderCart() {
    const cartContainer = document.getElementById('cart-items-container');
    if (!cartContainer) return;

    const cart = getCart();

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-bag"></i>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added anything yet.</p>
                <a href="products" class="btn btn-primary">Start Shopping</a>
            </div>`;
        document.getElementById('cart-subtotal').textContent = formatPrice(0);
        document.getElementById('cart-shipping').textContent = formatPrice(0);
        document.getElementById('cart-total').textContent = formatPrice(0);
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) checkoutBtn.disabled = true;
        return;
    }

    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-image">
                <a href="product-detail?id=${item.productId}"><img src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy"></a>
            </div>
            <div class="cart-item-details">
                <h3>${escapeHtml(item.name)}</h3>
                <div class="cart-item-meta">Color: ${escapeHtml(item.color)}${item.size ? ' | Size: ' + escapeHtml(item.size) : ''}</div>
                <button class="remove-btn" data-index="${index}"><i class="fas fa-trash-alt"></i> Remove</button>
            </div>
            <div class="quantity-selector">
                <button class="qty-change" data-index="${index}" data-action="minus">-</button>
                <input type="number" value="${item.quantity}" min="1" data-index="${index}" class="qty-input">
                <button class="qty-change" data-index="${index}" data-action="plus">+</button>
            </div>
            <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join('');

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 100000 ? 0 : 5000;
    const total = subtotal + shipping;

    document.getElementById('cart-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('cart-shipping').textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
    document.getElementById('cart-total').textContent = formatPrice(total);

    // Event listeners for cart actions
    cartContainer.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.index)));
    });

    cartContainer.querySelectorAll('.qty-change').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            const cart = getCart();
            const newQty = btn.dataset.action === 'plus' ? cart[idx].quantity + 1 : cart[idx].quantity - 1;
            updateCartQuantity(idx, newQty);
        });
    });

    cartContainer.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', () => {
            updateCartQuantity(parseInt(input.dataset.index), parseInt(input.value) || 1);
        });
    });
}

const cartItemsContainer = document.getElementById('cart-items-container');
if (cartItemsContainer) renderCart();

// Checkout button
document.querySelector('.checkout-btn')?.addEventListener('click', () => {
    const user = getCurrentUser();
    const cart = getCart();
    if (cart.length === 0) { showToast('Your cart is empty!', 'error'); return; }
    if (!user) {
        showToast('Please login to proceed to checkout', 'info');
        window.location.href = getPageUrl('login?redirect=checkout');
        return;
    }
    window.location.href = getPageUrl('checkout');
});

// ===========================================
// 11. WISHLIST SYSTEM
// ===========================================
function toggleWishlist(productId) {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please login to add items to your wishlist', 'info');
        return;
    }

    let wishlist = getWishlist();
    const index = wishlist.indexOf(productId);

    if (index > -1) {
        wishlist.splice(index, 1);
        showToast('Removed from wishlist', 'info');
    } else {
        wishlist.push(productId);
        showToast('Added to wishlist!', 'success');
    }

    saveToStorage('chommzyWishlist', wishlist);
    updateHeader();

    // Update UI
    document.querySelectorAll(`.wishlist-toggle[data-id="${productId}"]`).forEach(btn => {
        btn.classList.toggle('wishlisted');
        const icon = btn.querySelector('i');
        if (icon) icon.className = btn.classList.contains('wishlisted') ? 'fas fa-heart' : 'far fa-heart';
    });

    // Update wishlist page if on it
    renderWishlistPage();

    // Update detail page wishlist button
    const detailBtn = document.getElementById('detail-wishlist-btn');
    if (detailBtn) {
        const isWished = getWishlist().includes(productId);
        detailBtn.classList.toggle('wishlisted', isWished);
        detailBtn.innerHTML = isWished ? '<i class="fas fa-heart"></i> Wishlisted' : '<i class="far fa-heart"></i> Add to Wishlist';
    }
}

// Wishlist click handler
document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.wishlist-toggle');
    if (btn) {
        e.preventDefault();
        toggleWishlist(parseInt(btn.dataset.id));
    }
});

// Wishlist page
function renderWishlistPage() {
    const wishlistGrid = document.getElementById('wishlist-grid');
    if (!wishlistGrid) return;

    const wishlist = getWishlist();
    const products = getProducts();
    const wishlistProducts = products.filter(p => wishlist.includes(p.id));

    if (wishlistProducts.length === 0) {
        wishlistGrid.innerHTML = `
            <div class="empty-cart" style="grid-column:1/-1;">
                <i class="far fa-heart"></i>
                <h3>Your wishlist is empty</h3>
                <p>Save items you love for later.</p>
                <a href="products" class="btn btn-primary">Browse Products</a>
            </div>`;
        return;
    }

    displayProducts(wishlistGrid, wishlistProducts);
}
renderWishlistPage();

// ===========================================
// 12. AUTHENTICATION SYSTEM
// ===========================================
// Signup form with OTP verification
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    const step1 = document.getElementById('signup-step-1');
    const step2 = document.getElementById('signup-step-2');
    const step3 = document.getElementById('signup-step-3');
    const otpForm = document.getElementById('signup-otp-form');
    const emailDisplay = document.getElementById('signup-email-display');
    const countdownEl = document.getElementById('signup-otp-countdown');
    const resendBtn = document.getElementById('signup-resend-otp');
    const backBtn = document.getElementById('signup-back-btn');

    // Store signup data temporarily
    let signupData = {};
    let stopCountdown = null;

    // Initialize OTP inputs
    if (step2) initOTPInputs(step2);

    // Pre-fill referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const referralInputEl = document.getElementById('signup-referral');
    if (refCode && referralInputEl) {
        referralInputEl.value = refCode;
        referralInputEl.parentElement.classList.add('has-referral');
    }

    // Step 1: Validate and send OTP
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const phoneInput = document.getElementById('signup-phone').value.trim();
        const countryCodeSelect = document.getElementById('phone-country-code');
        const countryCode = countryCodeSelect ? countryCodeSelect.value : '+234';
        const phoneNumber = phoneInput.replace(/^0+/, '');
        const phone = phoneNumber ? `${countryCode}${phoneNumber}` : '';
        const password = document.getElementById('signup-password').value;
        const referralInput = document.getElementById('signup-referral');
        const referralCode = referralInput ? referralInput.value.trim().toUpperCase() : '';
        const submitBtn = signupForm.querySelector('button[type="submit"]');

        if (!name || !email || !password) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        // Strong password validation
        if (password.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            showToast('Password must include at least 1 uppercase letter', 'error');
            return;
        }
        if (!/[a-z]/.test(password)) {
            showToast('Password must include at least 1 lowercase letter', 'error');
            return;
        }
        if (!/[0-9]/.test(password)) {
            showToast('Password must include at least 1 number', 'error');
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            showToast('Password must include at least 1 special character (!@#$%^&*)', 'error');
            return;
        }

        // Store signup data for later use
        signupData = { name, email, phone, password, referralCode };

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending code...';

        // Try API with OTP
        if (API_CONFIG.useAPI) {
            const result = await API.otp.send(email, 'signup');
            if (result.success) {
                emailDisplay.textContent = email;
                step1.style.display = 'none';
                step2.style.display = 'block';
                clearOTPInputs(step2);
                stopCountdown = startOTPCountdown(countdownEl, 600);
                showToast('Verification code sent to your email', 'success');
            } else {
                showToast(result.message || 'Failed to send code', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
            return;
        }

        // Fallback to localStorage (skip OTP)
        let users = getUsers();
        if (users.find(u => u.email === email)) {
            showToast('An account with this email already exists', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
            return;
        }

        // For local dev, skip OTP and create account directly
        createAccountLocally(signupData);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
    });

    // Step 2: Verify OTP and create account
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = getOTPValue(step2);
            const submitBtn = otpForm.querySelector('button[type="submit"]');

            if (otp.length !== 6) {
                showToast('Please enter the 6-digit code', 'error');
                showOTPError(step2);
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            // Verify OTP
            const verifyResult = await API.otp.verify(signupData.email, otp, 'signup');
            if (!verifyResult.success) {
                showToast(verifyResult.message || 'Invalid code', 'error');
                showOTPError(step2);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify & Create Account';
                return;
            }

            // OTP verified, now create account
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            const signupResult = await API.auth.signup(signupData);

            if (signupResult.success && signupResult.data) {
                const user = signupResult.data;
                saveToStorage('chommzyCurrentUser', {
                    id: user.id, name: user.name, email: user.email, phone: user.phone || '',
                    role: user.role, referralCode: user.referral_code, token: user.token
                });
                if (stopCountdown) stopCountdown();
                step2.style.display = 'none';
                step3.style.display = 'block';
                showToast('Account created successfully!', 'success');
            } else {
                showToast(signupResult.message || 'Failed to create account', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify & Create Account';
            }
        });
    }

    // Resend OTP
    if (resendBtn) {
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            resendBtn.style.pointerEvents = 'none';
            resendBtn.textContent = 'Sending...';

            const result = await API.otp.resend(signupData.email, 'signup');
            if (result.success) {
                clearOTPInputs(step2);
                if (stopCountdown) stopCountdown();
                stopCountdown = startOTPCountdown(countdownEl, 600);
                showToast('New code sent!', 'success');
            } else {
                showToast(result.message || 'Failed to resend', 'error');
            }

            resendBtn.style.pointerEvents = 'auto';
            resendBtn.textContent = 'Resend Code';
        });
    }

    // Back to step 1
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (stopCountdown) stopCountdown();
            step2.style.display = 'none';
            step1.style.display = 'block';
        });
    }

    // Helper function for local account creation (fallback)
    function createAccountLocally(data) {
        let users = getUsers();

        const newReferralCode = 'EC' + data.name.substring(0, 2).toUpperCase() + Date.now().toString(36).substring(-4).toUpperCase();
        const userId = 'USR-' + Date.now().toString(36).toUpperCase();

        let referredBy = null;
        if (data.referralCode) {
            const referrer = users.find(u => u.referralCode && u.referralCode.toUpperCase() === data.referralCode);
            if (referrer) {
                referredBy = referrer.id;
                let referrals = getFromStorage('chommzyReferrals', []);
                referrals.push({
                    id: 'REF-' + Date.now().toString(36).toUpperCase(),
                    referrerId: referrer.id,
                    referrerName: referrer.name,
                    newUserId: userId,
                    newUserName: data.name,
                    status: 'pending',
                    reward: 0,
                    createdAt: new Date().toISOString()
                });
                saveToStorage('chommzyReferrals', referrals);
            } else {
                showToast('Invalid referral code, but account will still be created', 'info');
            }
        }

        const newUser = {
            id: userId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            password: data.password,
            role: 'customer',
            referralCode: newReferralCode,
            referredBy: referredBy,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveToStorage('chommzyUsers', users);
        saveToStorage('chommzyCurrentUser', {
            id: newUser.id, name: newUser.name, email: newUser.email,
            role: newUser.role, referralCode: newUser.referralCode
        });

        step1.style.display = 'none';
        step3.style.display = 'block';
        showToast('Account created successfully!', 'success');
    }
}

// Login form
const loginForm = document.getElementById('login-form');
if (loginForm) {
    let pending2FAToken = null;
    const twoFASection = document.getElementById('login-2fa-section');
    const twoFAForm = document.getElementById('login-2fa-form');
    const backBtn = document.getElementById('login-back-btn');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.auth.login(email, password);
            if (result.success && result.data) {
                // Check if 2FA is required
                if (result.data.requires_2fa) {
                    pending2FAToken = result.data.temp_token;
                    loginForm.style.display = 'none';
                    if (twoFASection) twoFASection.style.display = 'block';
                    document.getElementById('login-2fa-code')?.focus();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                    return;
                }

                const user = result.data;
                const userData = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    referralCode: user.referral_code || user.referralCode || '',
                    token: user.token
                };

                // Try to save to localStorage
                try {
                    localStorage.setItem('chommzyCurrentUser', JSON.stringify(userData));
                    // Also save to sessionStorage as backup for Safari
                    sessionStorage.setItem('chommzyCurrentUser', JSON.stringify(userData));
                } catch (e) {
                    console.error('Storage error:', e);
                    showToast('Login successful but storage is blocked. Check browser settings.', 'warning');
                }

                showToast(`Welcome back, ${user.name}!`, 'success');

                // Use location.replace to avoid back button issues
                const redirect = new URLSearchParams(window.location.search).get('redirect');
                const targetUrl = getPageUrl(redirect || 'account');
                setTimeout(() => {
                    window.location.replace(targetUrl);
                }, 1000);
                return;
            } else if (!result.useLocalStorage) {
                showToast(result.message || 'Invalid email or password', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
                return;
            }
        }

        // Fallback to localStorage
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            showToast('Invalid email or password', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            return;
        }

        if (user.role === 'admin') {
            showToast('Please use admin login page', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            return;
        }

        saveToStorage('chommzyCurrentUser', { id: user.id, name: user.name, email: user.email, role: user.role, referralCode: user.referralCode || '' });
        showToast(`Welcome back, ${user.name}!`, 'success');

        const redirect = new URLSearchParams(window.location.search).get('redirect');
        const targetUrl = getPageUrl(redirect || 'account');
        setTimeout(() => {
            window.location.replace(targetUrl);
        }, 1000);
    });

    // 2FA Form submission
    twoFAForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('login-2fa-code').value;
        const verifyBtn = twoFAForm.querySelector('button[type="submit"]');

        if (!pending2FAToken) {
            showToast('Session expired. Please login again.', 'error');
            backBtn?.click();
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

        try {
            const response = await fetch('/api/two-factor.php?action=verify-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temp_token: pending2FAToken, code })
            });
            const result = await response.json();

            if (result.success && result.data) {
                const user = result.data;
                saveToStorage('chommzyCurrentUser', {
                    id: user.id, name: user.name, email: user.email,
                    role: user.role, token: user.token
                });
                showToast(`Welcome back, ${user.name}!`, 'success');
                setTimeout(() => {
                    const redirect = new URLSearchParams(window.location.search).get('redirect');
                    window.location.href = getPageUrl(redirect || 'home');
                }, 1000);
                return;
            }

            showToast(result.message || 'Invalid verification code', 'error');
        } catch {
            showToast('Verification failed. Please try again.', 'error');
        }

        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify';
    });

    // Back to login
    backBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (twoFASection) twoFASection.style.display = 'none';
        loginForm.style.display = 'block';
        document.getElementById('login-2fa-code').value = '';
        pending2FAToken = null;
    });
}

// Logout
document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentUser = getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'admin';
        // Clear both localStorage and sessionStorage
        localStorage.removeItem('chommzyCurrentUser');
        localStorage.removeItem('chommzyAdminSession');
        sessionStorage.removeItem('chommzyCurrentUser');
        sessionStorage.removeItem('chommzyAdminSession');
        // Clear auth cookie if exists
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        showToast('You have been logged out', 'info');
        setTimeout(() => window.location.href = getPageUrl(isAdmin ? 'ec-mgt-9k7x2' : 'home'), 800);
    });
});

// ===========================================
// OTP INPUT HANDLER (Shared)
// ===========================================
function initOTPInputs(container) {
    const inputs = container.querySelectorAll('.otp-input');
    if (inputs.length === 0) return;

    inputs.forEach((input, index) => {
        // Only allow numbers
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            e.target.value = value;

            if (value) {
                e.target.classList.add('filled');
                // Move to next input
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            } else {
                e.target.classList.remove('filled');
            }
        });

        // Handle backspace
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                inputs[index - 1].focus();
                inputs[index - 1].value = '';
                inputs[index - 1].classList.remove('filled');
            }
        });

        // Handle paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
            pastedData.split('').forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                    inputs[i].classList.add('filled');
                }
            });
            if (inputs[pastedData.length - 1]) {
                inputs[pastedData.length - 1].focus();
            }
        });
    });
}

function getOTPValue(container) {
    const inputs = container.querySelectorAll('.otp-input');
    return Array.from(inputs).map(i => i.value).join('');
}

function clearOTPInputs(container) {
    const inputs = container.querySelectorAll('.otp-input');
    inputs.forEach(i => {
        i.value = '';
        i.classList.remove('filled', 'error');
    });
    if (inputs[0]) inputs[0].focus();
}

function showOTPError(container) {
    const inputs = container.querySelectorAll('.otp-input');
    inputs.forEach(i => i.classList.add('error'));
    setTimeout(() => inputs.forEach(i => i.classList.remove('error')), 500);
}

// OTP Countdown Timer
function startOTPCountdown(displayElement, seconds = 600, onExpire) {
    let remaining = seconds;

    const updateDisplay = () => {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        displayElement.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 60) {
            displayElement.parentElement?.classList.add('expired');
        }
    };

    updateDisplay();

    const interval = setInterval(() => {
        remaining--;
        updateDisplay();

        if (remaining <= 0) {
            clearInterval(interval);
            if (onExpire) onExpire();
        }
    }, 1000);

    return () => clearInterval(interval); // Return cleanup function
}

// ===========================================
// FORGOT PASSWORD PAGE
// ===========================================
const resetEmailForm = document.getElementById('reset-email-form');
if (resetEmailForm) {
    const step1 = document.getElementById('reset-step-1');
    const step2 = document.getElementById('reset-step-2');
    const step3 = document.getElementById('reset-step-3');
    const step4 = document.getElementById('reset-step-4');
    const otpForm = document.getElementById('reset-otp-form');
    const passwordForm = document.getElementById('reset-password-form');
    const emailDisplay = document.getElementById('reset-email-display');
    const countdownEl = document.getElementById('otp-countdown');
    const resendBtn = document.getElementById('resend-otp-btn');
    const backBtn = document.getElementById('back-to-email');

    let userEmail = '';
    let verifiedOTP = '';
    let stopCountdown = null;

    // Initialize OTP inputs
    if (step2) initOTPInputs(step2);

    // Step 1: Send OTP
    resetEmailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        userEmail = document.getElementById('reset-email').value.trim().toLowerCase();
        const submitBtn = resetEmailForm.querySelector('button[type="submit"]');

        if (!userEmail) {
            showToast('Please enter your email', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.otp.send(userEmail, 'reset_password');
            if (result.success) {
                emailDisplay.textContent = userEmail;
                step1.style.display = 'none';
                step2.style.display = 'block';
                clearOTPInputs(step2);
                stopCountdown = startOTPCountdown(countdownEl, 600);
                showToast('Verification code sent to your email', 'success');
            } else {
                showToast(result.message || 'Failed to send code', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
            return;
        }

        // Fallback for local development (no OTP, direct password reset)
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === userEmail);
        if (!user) {
            showToast('No account found with this email', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
            return;
        }

        // For local dev, skip OTP and go to password step
        emailDisplay.textContent = userEmail;
        step1.style.display = 'none';
        step3.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
    });

    // Step 2: Verify OTP
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = getOTPValue(step2);
            const submitBtn = otpForm.querySelector('button[type="submit"]');

            if (otp.length !== 6) {
                showToast('Please enter the 6-digit code', 'error');
                showOTPError(step2);
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            const result = await API.otp.verify(userEmail, otp, 'reset_password');
            if (result.success) {
                verifiedOTP = otp;
                if (stopCountdown) stopCountdown();
                step2.style.display = 'none';
                step3.style.display = 'block';
                showToast('Email verified!', 'success');
            } else {
                showToast(result.message || 'Invalid code', 'error');
                showOTPError(step2);
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify Code';
        });
    }

    // Resend OTP
    if (resendBtn) {
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            resendBtn.style.pointerEvents = 'none';
            resendBtn.textContent = 'Sending...';

            const result = await API.otp.resend(userEmail, 'reset_password');
            if (result.success) {
                clearOTPInputs(step2);
                if (stopCountdown) stopCountdown();
                stopCountdown = startOTPCountdown(countdownEl, 600);
                showToast('New code sent!', 'success');
            } else {
                showToast(result.message || 'Failed to resend', 'error');
            }

            resendBtn.style.pointerEvents = 'auto';
            resendBtn.textContent = 'Resend Code';
        });
    }

    // Back to email
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (stopCountdown) stopCountdown();
            step2.style.display = 'none';
            step1.style.display = 'block';
        });
    }

    // Step 3: Reset Password
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const submitBtn = passwordForm.querySelector('button[type="submit"]');

            if (newPassword.length < 8) {
                showToast('Password must be at least 8 characters', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

            // Try API
            if (API_CONFIG.useAPI && verifiedOTP) {
                const result = await API.otp.resetPassword(userEmail, verifiedOTP, newPassword);
                if (result.success) {
                    step3.style.display = 'none';
                    step4.style.display = 'block';
                } else {
                    showToast(result.message || 'Failed to reset password', 'error');
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Reset Password';
                return;
            }

            // Fallback to localStorage
            const users = getUsers();
            const userIdx = users.findIndex(u => u.email.toLowerCase() === userEmail);
            if (userIdx !== -1) {
                users[userIdx].password = newPassword;
                saveToStorage('chommzyUsers', users);
                step3.style.display = 'none';
                step4.style.display = 'block';
            } else {
                showToast('User not found', 'error');
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Reset Password';
        });
    }
}

// ===========================================
// 13. CHECKOUT SYSTEM
// ===========================================
const checkoutPage = document.querySelector('.checkout-page');
if (checkoutPage) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = getPageUrl('login?redirect=checkout');
        return;
    }

    let currentStep = 1;
    const cart = getCart();

    if (cart.length === 0) {
        window.location.href = getPageUrl('cart');
        return;
    }

    // Fill order summary
    const summaryItems = document.getElementById('checkout-items');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal >= 100000 ? 0 : 5000;
    let discount = 0;
    let appliedPromo = null;

    // Available promo codes
    const PROMO_CODES = {
        'WELCOME10': { type: 'percent', value: 10, description: '10% off' },
        'SAVE5000': { type: 'fixed', value: 5000, description: '₦5,000 off' },
        'CHOMMZY15': { type: 'percent', value: 15, description: '15% off' },
        'FLASH20': { type: 'percent', value: 20, description: '20% off', minOrder: 50000 },
        'FREESHIP': { type: 'freeship', value: 0, description: 'Free shipping' }
    };

    function updateOrderTotals() {
        const currentShipping = appliedPromo?.type === 'freeship' ? 0 : (subtotal >= 100000 ? 0 : 5000);
        const finalTotal = subtotal - discount + currentShipping;

        document.getElementById('checkout-subtotal').textContent = formatPrice(subtotal);
        document.getElementById('checkout-shipping').textContent = currentShipping === 0 ? 'FREE' : formatPrice(currentShipping);

        const discountRow = document.getElementById('discount-row');
        if (discount > 0 && discountRow) {
            discountRow.style.display = 'flex';
            document.getElementById('discount-label').textContent = appliedPromo?.description || '';
            document.getElementById('checkout-discount').textContent = formatPrice(discount);
        } else if (discountRow) {
            discountRow.style.display = 'none';
        }

        document.getElementById('checkout-total').textContent = formatPrice(finalTotal);

        // Store for order creation
        window.checkoutDiscount = discount;
        window.checkoutPromo = appliedPromo;
    }

    if (summaryItems) {
        summaryItems.innerHTML = cart.map(item => `
            <div class="summary-row">
                <span>${escapeHtml(item.name)} x${item.quantity}</span>
                <span>${formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join('');
    }

    updateOrderTotals();

    // Promo code handler
    const promoInput = document.getElementById('promo-code');
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoMessage = document.getElementById('promo-message');

    applyPromoBtn?.addEventListener('click', () => {
        const code = promoInput.value.trim().toUpperCase();
        promoMessage.className = 'promo-message';
        promoMessage.textContent = '';

        if (!code) {
            promoMessage.className = 'promo-message error';
            promoMessage.textContent = 'Please enter a promo code';
            return;
        }

        const promo = PROMO_CODES[code];
        if (!promo) {
            promoMessage.className = 'promo-message error';
            promoMessage.textContent = 'Invalid promo code';
            return;
        }

        if (promo.minOrder && subtotal < promo.minOrder) {
            promoMessage.className = 'promo-message error';
            promoMessage.textContent = `Minimum order of ${formatPrice(promo.minOrder)} required`;
            return;
        }

        appliedPromo = promo;
        if (promo.type === 'percent') {
            discount = Math.round(subtotal * promo.value / 100);
        } else if (promo.type === 'fixed') {
            discount = promo.value;
        } else if (promo.type === 'freeship') {
            discount = 0;
        }

        promoMessage.className = 'promo-message success';
        promoMessage.textContent = `✓ Code applied: ${promo.description}`;
        applyPromoBtn.textContent = 'Applied';
        applyPromoBtn.disabled = true;
        promoInput.disabled = true;

        updateOrderTotals();
    });

    // Pre-fill user info
    const users = getUsers();
    const fullUser = users.find(u => u.id === user.id);
    if (fullUser) {
        const nameInput = document.getElementById('shipping-name');
        const emailInput = document.getElementById('shipping-email');
        const phoneInput = document.getElementById('shipping-phone');
        if (nameInput) nameInput.value = fullUser.name || '';
        if (emailInput) emailInput.value = fullUser.email || '';
        if (phoneInput) phoneInput.value = fullUser.phone || '';
    }

    // Populate states dropdown
    const stateSelect = document.getElementById('shipping-state');
    if (stateSelect) {
        stateSelect.innerHTML = '<option value="">Select State</option>' +
            NIGERIAN_STATES.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // Country change handler - toggle state/region field
    const countrySelect = document.getElementById('shipping-country');
    const stateGroup = document.getElementById('state-group');
    const regionGroup = document.getElementById('region-group');
    const regionInput = document.getElementById('shipping-region');

    function handleCountryChange() {
        if (!countrySelect || !stateGroup || !regionGroup) return;
        const isNigeria = countrySelect.value === 'Nigeria';

        stateGroup.style.display = isNigeria ? 'block' : 'none';
        regionGroup.style.display = isNigeria ? 'none' : 'block';

        if (stateSelect) stateSelect.required = isNigeria;
        if (regionInput) regionInput.required = !isNigeria;
    }

    countrySelect?.addEventListener('change', handleCountryChange);
    // Initialize on page load
    handleCountryChange();

    // Step navigation
    function goToStep(step) {
        currentStep = step;
        document.querySelectorAll('.checkout-step-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`.checkout-step-content[data-step="${step}"]`)?.classList.add('active');

        document.querySelectorAll('.checkout-step').forEach((s, i) => {
            s.classList.remove('active', 'completed');
            if (i + 1 < step) s.classList.add('completed');
            if (i + 1 === step) s.classList.add('active');
        });
        document.querySelectorAll('.checkout-step-divider').forEach((d, i) => {
            d.classList.toggle('completed', i + 1 < step);
        });
    }

    // Step 1: Shipping form
    document.getElementById('shipping-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const shippingData = Object.fromEntries(formData.entries());

        // Get phone with country code
        const phoneCode = document.getElementById('shipping-phone-code')?.value || '+234';
        const phoneNumber = shippingData['shipping-phone']?.replace(/^0+/, '') || '';
        shippingData['shipping-phone-full'] = phoneNumber ? `${phoneCode}${phoneNumber}` : '';

        // Handle state/region based on country
        const isNigeria = shippingData['shipping-country'] === 'Nigeria';
        const stateOrRegion = isNigeria ? shippingData['shipping-state'] : shippingData['shipping-region'];
        shippingData['shipping-state'] = stateOrRegion || '';

        // Validate
        if (!shippingData['shipping-name'] || !shippingData['shipping-email'] || !shippingData['shipping-phone'] || !shippingData['shipping-address'] || !shippingData['shipping-city'] || !stateOrRegion) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        saveToStorage('chommzyShippingData', shippingData);

        // Load bank accounts for step 2
        loadBankAccounts();
        goToStep(2);
        window.scrollTo(0, 0);
    });

    // Step 2: Payment
    function loadBankAccounts() {
        const bankAccounts = getBankAccounts();
        const bankGrid = document.getElementById('bank-accounts-checkout');
        if (!bankGrid) return;

        const activeAccounts = bankAccounts.filter(b => b.isActive);
        if (activeAccounts.length === 0) {
            bankGrid.innerHTML = '<p class="text-muted">No bank accounts available. Please contact us via WhatsApp for payment details.</p>';
            return;
        }

        bankGrid.innerHTML = activeAccounts.map(account => `
            <div class="bank-account-card" data-id="${account.id}">
                <div class="bank-card-header">
                    <div class="bank-logo">
                        <i class="fas fa-building-columns"></i>
                    </div>
                    <div class="bank-name-label">${account.bankName}</div>
                </div>
                <div class="bank-card-body">
                    <div class="account-info-row">
                        <div class="account-info-item">
                            <span class="info-label">Account Name</span>
                            <span class="info-value">${account.accountName}</span>
                        </div>
                    </div>
                    <div class="account-info-row">
                        <div class="account-info-item">
                            <span class="info-label">Account Number</span>
                            <div class="account-number-row">
                                <span class="info-value account-number">${account.accountNumber}</span>
                                <button class="copy-btn" data-copy="${account.accountNumber}"><i class="fas fa-copy"></i> Copy</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Copy button handlers
        bankGrid.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(btn.dataset.copy).then(() => {
                    showToast('Account number copied!', 'success');
                    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i> Copy', 2000);
                });
            });
        });
    }

    // Payment proof upload
    let paymentProofData = null;
    const proofUpload = document.getElementById('payment-proof-input');
    const proofArea = document.querySelector('.payment-proof-upload');
    if (proofUpload && proofArea) {
        proofArea.addEventListener('click', () => proofUpload.click());
        proofUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File is too large. Maximum size is 5MB.', 'error');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    paymentProofData = e.target.result;
                    proofArea.innerHTML = `
                        <i class="fas fa-check-circle" style="color: var(--green);"></i>
                        <p><strong>File uploaded successfully!</strong></p>
                        <p class="file-name">${file.name}</p>
                    `;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Submit payment
    document.getElementById('submit-payment')?.addEventListener('click', async () => {
        const shippingData = getFromStorage('chommzyShippingData', null);
        if (!shippingData) {
            showToast('Shipping information missing', 'error');
            goToStep(1);
            return;
        }

        const submitBtn = document.getElementById('submit-payment');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        // Create order
        const orderId = generateId();
        const orderDiscount = window.checkoutDiscount || 0;
        const orderPromo = window.checkoutPromo || null;
        const finalShipping = orderPromo?.type === 'freeship' ? 0 : shipping;
        const finalTotal = subtotal - orderDiscount + finalShipping;

        const orderData = {
            customerName: shippingData['shipping-name'],
            customerEmail: shippingData['shipping-email'],
            customerPhone: shippingData['shipping-phone'],
            shippingAddress: shippingData['shipping-address'],
            shippingCity: shippingData['shipping-city'],
            shippingState: shippingData['shipping-state'],
            items: cart,
            subtotal,
            shippingFee: finalShipping,
            discount: orderDiscount,
            total: finalTotal,
            paymentMethod: 'bank_transfer',
            notes: orderPromo ? `Promo: ${promoInput?.value?.toUpperCase()}` : ''
        };

        let finalOrderId = orderId;

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.orders.create(orderData);
            if (result.success && result.data?.orderId) {
                finalOrderId = result.data.orderId;
            } else if (!result.useLocalStorage) {
                showToast(result.message || 'Failed to create order', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Confirm Payment';
                return;
            }
        }

        // Save to localStorage as well (for local viewing)
        const order = {
            id: finalOrderId,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            items: cart,
            subtotal,
            discount: orderDiscount,
            promoCode: orderPromo ? { code: promoInput?.value?.toUpperCase(), ...orderPromo } : null,
            shipping: finalShipping,
            total: finalTotal,
            shippingInfo: {
                name: shippingData['shipping-name'],
                email: shippingData['shipping-email'],
                phone: shippingData['shipping-phone'],
                address: shippingData['shipping-address'],
                city: shippingData['shipping-city'],
                state: shippingData['shipping-state']
            },
            status: 'pending',
            paymentProof: paymentProofData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            statusHistory: [
                { status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed, awaiting payment confirmation' }
            ]
        };

        let orders = getOrders();
        orders.push(order);
        saveToStorage('chommzyOrders', orders);

        // Add notification
        addNotification(user.id, `Your order ${finalOrderId} has been placed successfully! We'll confirm your payment shortly.`);

        // Clear cart and shipping data
        saveToStorage('chommzyCart', []);
        localStorage.removeItem('chommzyShippingData');

        // Clear server-side cart if using API
        if (API_CONFIG.useAPI) {
            API.cart.clear();
        }

        updateHeader();

        // Show confirmation
        document.getElementById('confirmation-order-id').textContent = finalOrderId;
        goToStep(3);
        window.scrollTo(0, 0);
    });

    // Back buttons
    document.getElementById('back-to-shipping')?.addEventListener('click', () => { goToStep(1); window.scrollTo(0, 0); });
}

// ===========================================
// 14. NOTIFICATIONS
// ===========================================
function addNotification(userId, message) {
    let notifications = getNotifications();
    notifications.push({
        id: Date.now().toString(36),
        userId,
        message,
        read: false,
        createdAt: new Date().toISOString()
    });
    saveToStorage('chommzyNotifications', notifications);
}

// ===========================================
// 15. CUSTOMER ACCOUNT PAGE
// ===========================================
const accountPage = document.querySelector('.account-page');
if (accountPage) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = getPageUrl('login?redirect=account');
        return;
    }

    // Set user info
    document.getElementById('account-name').textContent = user.name;
    document.getElementById('account-email').textContent = user.email;
    document.getElementById('account-initials').textContent = getInitials(user.name);

    // Tab navigation
    const accountNavLinks = document.querySelectorAll('.account-nav a[data-section]');

    function activateAccountSection(sectionId, saveState = true) {
        const targetSection = document.getElementById(sectionId);
        const targetLink = document.querySelector(`.account-nav a[data-section="${sectionId}"]`);
        if (targetSection && targetLink) {
            // Remove active from all
            accountNavLinks.forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.account-section').forEach(s => s.classList.remove('active'));
            // Add active to target
            targetLink.classList.add('active');
            targetSection.classList.add('active');
            // Save state for refresh persistence
            if (saveState) {
                localStorage.setItem('chommzyAccountSection', sectionId);
                try {
                    history.replaceState(null, '', '#' + sectionId);
                } catch (e) { /* ignore hash errors on file:// */ }
            }
        }
    }

    accountNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateAccountSection(link.dataset.section);
        });
    });

    // Determine which section to show on page load
    // Priority: 1. URL hash, 2. sessionStorage (from notification click), 3. localStorage (refresh persistence), 4. default
    const hashSection = window.location.hash.slice(1);
    const sessionSection = sessionStorage.getItem('activateSection');
    const savedSection = localStorage.getItem('chommzyAccountSection');

    let sectionToActivate = 'section-orders'; // default

    if (hashSection && document.getElementById(hashSection)) {
        sectionToActivate = hashSection;
    } else if (sessionSection) {
        sessionStorage.removeItem('activateSection');
        sectionToActivate = 'section-' + sessionSection;
    } else if (savedSection && document.getElementById(savedSection)) {
        sectionToActivate = savedSection;
    }

    // Always activate a section
    activateAccountSection(sectionToActivate, false);

    // Render orders
    async function renderAccountOrders() {
        const ordersContainer = document.getElementById('account-orders');
        if (!ordersContainer) return;

        let orders = [];

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.orders.userOrders();
            if (result.success && result.data?.orders) {
                orders = result.data.orders.map(o => ({
                    id: o.id,
                    items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
                    total: o.total,
                    status: o.order_status || o.status || 'pending',
                    paymentStatus: o.payment_status,
                    createdAt: o.created_at || o.createdAt,
                    receiptConfirmed: o.customer_confirmed_receipt
                }));
            }
        }

        // Fallback to localStorage
        if (orders.length === 0 && !API_CONFIG.useAPI) {
            orders = getOrders().filter(o => o.userId === user.id).reverse();
        }

        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-receipt"></i>
                    <h3>No orders yet</h3>
                    <p>Start shopping to see your orders here.</p>
                    <a href="products" class="btn btn-primary">Shop Now</a>
                </div>`;
            return;
        }

        ordersContainer.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <span class="order-id">${order.id}</span>
                        <span class="text-muted" style="margin-left:12px">${new Date(order.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <span class="status-badge ${order.status}">${formatStatus(order.status)}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-items-preview">
                        ${order.items.slice(0, 4).map(item => `
                            <div class="order-item-thumb"><img src="${item.image}" alt="${escapeHtml(item.name)}" loading="lazy"></div>
                        `).join('')}
                        ${order.items.length > 4 ? `<div class="order-item-thumb" style="display:flex;align-items:center;justify-content:center;font-size:0.8rem;color:var(--text-muted);">+${order.items.length - 4}</div>` : ''}
                    </div>
                    ${renderOrderTimeline(order)}
                </div>
                <div class="order-card-footer">
                    <span class="order-total">Total: ${formatPrice(order.total)}</span>
                    <span class="text-muted" style="font-size:0.85rem">${order.items.length} item${order.items.length > 1 ? 's' : ''}</span>
                </div>
                ${(order.status === 'delivered') && !order.receiptConfirmed && order.status !== 'completed' ?
                    `<div style="padding: 0 1rem 1rem;">
                        <button class="confirm-receipt-btn" data-order-id="${order.id}">
                            <i class="fas fa-check-circle"></i> Confirm Package Receival
                        </button>
                    </div>` : ''}
                ${order.status === 'completed' || order.receiptConfirmed ?
                    `<div style="padding: 0 1rem 1rem;">
                        <span class="receipt-confirmed"><i class="fas fa-check-circle"></i> Order Completed</span>
                    </div>` : ''}
            </div>
        `).join('');

        // Confirm receipt handlers
        ordersContainer.querySelectorAll('.confirm-receipt-btn').forEach(btn => {
            btn.addEventListener('click', () => confirmReceipt(btn.dataset.orderId));
        });
    }

    async function confirmReceipt(orderId) {
        showConfirmModal({
            title: 'Confirm Package Receival',
            message: 'Have you received your package in good condition?',
            icon: 'fa-box-open',
            confirmText: 'Yes, I Received It',
            cancelText: 'Not Yet',
            onConfirm: async () => {
                // Try API first
                if (API_CONFIG.useAPI) {
                    const result = await API.orders.confirmReceipt(orderId);
                    if (result.success) {
                        renderAccountOrders();
                        showToast('Thank you for confirming! Your order is now complete.', 'success');
                        return;
                    }
                    if (!result.useLocalStorage) {
                        showToast(result.message || 'Failed to confirm receipt', 'error');
                        return;
                    }
                }

                // Fallback to localStorage
                let orders = getOrders();
                const idx = orders.findIndex(o => o.id === orderId);
                if (idx > -1) {
                    orders[idx].receiptConfirmed = true;
                    orders[idx].receiptConfirmedAt = new Date().toISOString();
                    orders[idx].status = 'completed';
                    orders[idx].completedAt = new Date().toISOString();
                    if (!orders[idx].statusHistory) orders[idx].statusHistory = [];
                    orders[idx].statusHistory.push({
                        status: 'completed',
                        timestamp: new Date().toISOString(),
                        note: 'Customer confirmed package receival'
                    });
                    saveToStorage('chommzyOrders', orders);
                    renderAccountOrders();
                    showToast('Thank you for confirming! Your order is now complete.', 'success');
                }
            }
        });
    }

    function renderOrderTimeline(order) {
        const steps = [
            { key: 'pending', label: 'Order Placed', icon: 'fa-receipt' },
            { key: 'reviewing', label: 'Payment Under Review', icon: 'fa-search' },
            { key: 'confirmed', label: 'Payment Confirmed', icon: 'fa-check-circle' },
            { key: 'delivering', label: 'Being Delivered', icon: 'fa-truck' },
            { key: 'delivered', label: 'Delivered', icon: 'fa-box-open' },
            { key: 'completed', label: 'Completed', icon: 'fa-check-double' }
        ];

        // Normalize status (handle aliases)
        let normalizedStatus = order.status;
        if (normalizedStatus === 'shipped') normalizedStatus = 'delivering';
        if (normalizedStatus === 'processing') normalizedStatus = 'confirmed';

        const statusOrder = ['pending', 'reviewing', 'confirmed', 'delivering', 'delivered', 'completed'];
        const currentIndex = statusOrder.indexOf(normalizedStatus);

        return `<div class="order-timeline">${steps.map((step, i) => {
            let cls = '';
            const stepIndex = statusOrder.indexOf(step.key);
            if (stepIndex < currentIndex) cls = 'completed';
            else if (stepIndex === currentIndex) cls = 'active';
            return `
                <div class="timeline-step ${cls}">
                    <div class="timeline-dot"><i class="fas ${step.icon}"></i></div>
                    <div class="timeline-info">
                        <h4>${step.label}</h4>
                    </div>
                </div>`;
        }).join('')}</div>`;
    }

    renderAccountOrders();

    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        // Load profile from API
        async function loadUserProfile() {
            try {
                const result = await API.get('users.php?action=profile');
                if (result.success && result.data) {
                    document.getElementById('profile-name').value = result.data.name || '';
                    document.getElementById('profile-email').value = result.data.email || '';
                    document.getElementById('profile-phone').value = result.data.phone || '';
                } else {
                    // Fallback to session data
                    document.getElementById('profile-name').value = user.name || '';
                    document.getElementById('profile-email').value = user.email || '';
                    document.getElementById('profile-phone').value = user.phone || '';
                }
            } catch {
                // Fallback to session data
                document.getElementById('profile-name').value = user.name || '';
                document.getElementById('profile-email').value = user.email || '';
                document.getElementById('profile-phone').value = user.phone || '';
            }
        }
        loadUserProfile();

        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phone = document.getElementById('profile-phone').value.trim();
            const submitBtn = profileForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                const result = await API.auth.updateProfile({ phone });
                if (result.success) {
                    showToast('Profile updated successfully!', 'success');
                } else {
                    showToast(result.message || 'Failed to update profile', 'error');
                }
            } catch {
                showToast('Failed to update profile', 'error');
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        });
    }

    // ===========================================
    // USER 2FA (Two-Factor Authentication)
    // ===========================================
    const securitySection = document.getElementById('section-security');
    if (securitySection) {
        const getAuthHeaders = () => {
            const headers = { 'Content-Type': 'application/json' };
            if (user.token) headers['Authorization'] = `Bearer ${user.token}`;
            return headers;
        };

        const User2FAAPI = {
            setup: async () => {
                try {
                    const res = await fetch('/api/two-factor.php?action=setup', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        credentials: 'include'
                    });
                    return await res.json();
                } catch { return { success: false, message: 'Network error' }; }
            },
            enable: async (code) => {
                try {
                    const res = await fetch('/api/two-factor.php?action=enable', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        credentials: 'include',
                        body: JSON.stringify({ code })
                    });
                    return await res.json();
                } catch { return { success: false, message: 'Network error' }; }
            },
            disable: async (code, password) => {
                try {
                    const res = await fetch('/api/two-factor.php?action=disable', {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        credentials: 'include',
                        body: JSON.stringify({ code, password })
                    });
                    return await res.json();
                } catch { return { success: false, message: 'Network error' }; }
            },
            status: async () => {
                try {
                    const res = await fetch('/api/two-factor.php?action=status', {
                        headers: getAuthHeaders(),
                        credentials: 'include'
                    });
                    return await res.json();
                } catch { return { success: false, message: 'Network error' }; }
            }
        };

        const disabledView = document.getElementById('user-2fa-disabled');
        const setupView = document.getElementById('user-2fa-setup');
        const enabledView = document.getElementById('user-2fa-enabled');
        const disableModal = document.getElementById('user-disable-2fa-modal');

        // Check 2FA status
        async function checkUser2FAStatus() {
            const result = await User2FAAPI.status();
            if (result.success && result.data?.enabled) {
                disabledView.style.display = 'none';
                setupView.style.display = 'none';
                enabledView.style.display = 'block';
            } else {
                disabledView.style.display = 'block';
                setupView.style.display = 'none';
                enabledView.style.display = 'none';
            }
        }
        checkUser2FAStatus();

        // Setup 2FA
        document.getElementById('user-setup-2fa-btn')?.addEventListener('click', async () => {
            const btn = document.getElementById('user-setup-2fa-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';

            const result = await User2FAAPI.setup();
            if (result.success && result.data) {
                document.getElementById('user-2fa-qr-img').src = result.data.qr_url;
                document.getElementById('user-2fa-secret').textContent = result.data.secret;

                if (result.data.backup_codes) {
                    const list = document.getElementById('user-backup-codes-list');
                    list.innerHTML = result.data.backup_codes.map(c => `<code style="display:inline-block;margin:2px;padding:2px 6px;background:#fff;border-radius:3px;font-size:0.75rem;">${escapeHtml(c)}</code>`).join('');
                    document.getElementById('user-backup-codes').style.display = 'block';
                }

                disabledView.style.display = 'none';
                setupView.style.display = 'block';
            } else {
                showToast(result.message || 'Failed to setup 2FA', 'error');
            }

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-lock"></i> Enable 2FA';
        });

        // Cancel setup
        document.getElementById('user-cancel-2fa')?.addEventListener('click', () => {
            setupView.style.display = 'none';
            disabledView.style.display = 'block';
            document.getElementById('user-2fa-code').value = '';
        });

        // Verify and enable
        document.getElementById('user-verify-2fa-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('user-2fa-code').value;
            const btn = e.target.querySelector('button[type="submit"]');

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            const result = await User2FAAPI.enable(code);
            if (result.success) {
                showToast('2FA enabled successfully!', 'success');
                setupView.style.display = 'none';
                enabledView.style.display = 'block';
            } else {
                showToast(result.message || 'Invalid code', 'error');
            }

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Verify & Enable';
        });

        // Show disable modal
        document.getElementById('user-disable-2fa-btn')?.addEventListener('click', () => {
            disableModal.style.display = 'flex';
        });

        // Close disable modal
        disableModal?.querySelector('.modal-close')?.addEventListener('click', () => {
            disableModal.style.display = 'none';
        });

        // Disable 2FA
        document.getElementById('user-disable-2fa-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('user-disable-code').value;
            const password = document.getElementById('user-disable-password').value;
            const btn = e.target.querySelector('button[type="submit"]');

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disabling...';

            const result = await User2FAAPI.disable(code, password);
            if (result.success) {
                showToast('2FA disabled', 'info');
                disableModal.style.display = 'none';
                enabledView.style.display = 'none';
                disabledView.style.display = 'block';
                e.target.reset();
            } else {
                showToast(result.message || 'Failed to disable 2FA', 'error');
            }

            btn.disabled = false;
            btn.innerHTML = 'Disable 2FA';
        });
    }

    // Notifications functions
    async function renderNotifications() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        let userNotifications = [];

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.notifications.list();
            if (result.success && result.data?.notifications) {
                userNotifications = result.data.notifications.map(n => ({
                    id: n.id,
                    message: n.message,
                    type: n.type,
                    read: n.is_read,
                    createdAt: n.created_at
                }));
            }
        }

        // Fallback to localStorage
        if (userNotifications.length === 0 && !API_CONFIG.useAPI) {
            const allNotifications = getNotifications();
            userNotifications = allNotifications.filter(n => n.userId === user.id).reverse();
        }

        if (userNotifications.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <h3>No notifications yet</h3>
                    <p>You'll see order updates and delivery notifications here.</p>
                </div>`;
            return;
        }

        // Check if there are any unread notifications
        const hasUnread = userNotifications.some(n => !n.read);

        container.innerHTML = userNotifications.map(notif => {
            const isAnnouncement = notif.type === 'announcement' || notif.message.startsWith('📢');
            const isDelivery = notif.message.toLowerCase().includes('way') || notif.message.toLowerCase().includes('deliver');
            const isConfirmed = notif.message.toLowerCase().includes('confirmed') || notif.message.toLowerCase().includes('approved');

            let iconClass = '';
            let icon = 'fa-bell';
            if (isAnnouncement) {
                iconClass = 'announcement';
                icon = 'fa-bullhorn';
            } else if (isDelivery) {
                iconClass = 'delivery';
                icon = 'fa-truck';
            } else if (isConfirmed) {
                iconClass = 'success';
                icon = 'fa-check-circle';
            }

            return `
                <div class="notification-item ${notif.read ? '' : 'unread'}" data-notif-id="${notif.id}">
                    <div class="notification-icon ${iconClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="notification-content">
                        <p>${escapeHtml(notif.message)}</p>
                        <div class="notification-time">${timeAgo(notif.createdAt)}</div>
                    </div>
                    <button class="notification-delete-btn" data-notif-id="${notif.id}" title="Delete notification">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>`;
        }).join('');

        // Add delete handlers
        container.querySelectorAll('.notification-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const notifId = btn.dataset.notifId;
                showConfirmModal({
                    title: 'Delete Notification',
                    message: 'Are you sure you want to delete this notification?',
                    icon: 'fa-trash-alt',
                    confirmText: 'Delete',
                    onConfirm: () => deleteUserNotification(notifId)
                });
            });
        });

        // Mark ALL as read when viewing notifications section
        if (hasUnread) {
            markAllNotificationsRead();
        }
    }

    // Delete a single notification for user
    async function deleteUserNotification(notifId) {
        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.notifications.delete(notifId);
            if (result.success) {
                // Remove from UI
                document.querySelector(`[data-notif-id="${notifId}"]`)?.remove();
                showToast('Notification deleted', 'success');
                updateNotificationBadge();
                // Check if empty
                const container = document.getElementById('notifications-list');
                if (container && container.querySelectorAll('.notification-item').length === 0) {
                    container.innerHTML = `
                        <div class="empty-notifications">
                            <i class="fas fa-bell-slash"></i>
                            <h3>No notifications yet</h3>
                            <p>You'll see order updates and delivery notifications here.</p>
                        </div>`;
                }
                return;
            }
        }

        // Fallback to localStorage
        let notifications = getNotifications();
        const idx = notifications.findIndex(n => n.id === notifId);
        if (idx > -1) {
            notifications.splice(idx, 1);
            saveToStorage('chommzyNotifications', notifications);
            document.querySelector(`[data-notif-id="${notifId}"]`)?.remove();
            showToast('Notification deleted', 'success');
            updateNotificationBadge();
            // Check if empty
            const container = document.getElementById('notifications-list');
            if (container && container.querySelectorAll('.notification-item').length === 0) {
                container.innerHTML = `
                    <div class="empty-notifications">
                        <i class="fas fa-bell-slash"></i>
                        <h3>No notifications yet</h3>
                        <p>You'll see order updates and delivery notifications here.</p>
                    </div>`;
            }
        }
    }

    // Mark all notifications as read
    async function markAllNotificationsRead() {
        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.notifications.markAllRead();
            if (result.success) {
                // Update UI - remove unread class from all items
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });
                // Reset badge count to 0
                updateNotificationBadge();
                return;
            }
        }

        // Fallback to localStorage
        let notifications = getNotifications();
        let updated = false;
        notifications.forEach(n => {
            if (n.userId === user.id && !n.read) {
                n.read = true;
                updated = true;
            }
        });

        if (updated) {
            saveToStorage('chommzyNotifications', notifications);
            // Update UI - remove unread class from all items
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            // Reset badge count to 0
            updateNotificationBadge();
        }
    }

    async function updateNotificationBadge() {
        const badges = document.querySelectorAll('.notif-count');
        if (badges.length === 0) return;

        let unreadCount = 0;

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.notifications.unreadCount();
            if (result.success && result.data) {
                unreadCount = result.data.unreadCount;
            }
        } else {
            // Fallback to localStorage
            const allNotifications = getNotifications();
            unreadCount = allNotifications.filter(n => n.userId === user.id && !n.read).length;
        }

        badges.forEach(badge => {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    function timeAgo(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    }

    // Initialize notifications
    renderNotifications();
    updateNotificationBadge();

    // ===========================================
    // REFERRAL SYSTEM
    // ===========================================
    async function initReferralSection() {
        const referralCodeEl = document.getElementById('my-referral-code');
        const referralLinkEl = document.getElementById('my-referral-link');
        if (!referralCodeEl) return;

        // Always fetch from API to get the latest referral code
        let referralCode = '';

        try {
            const result = await API.get('users.php?action=profile');
            if (result.success && result.data && result.data.referral_code) {
                referralCode = result.data.referral_code;
                // Update session with referral code
                const currentUser = getCurrentUser();
                if (currentUser) {
                    currentUser.referralCode = referralCode;
                    saveToStorage('chommzyCurrentUser', currentUser);
                }
            }
        } catch (e) {
            console.error('Failed to load referral code:', e);
            // Fallback to session
            referralCode = user.referralCode || '';
        }

        // Display referral code
        if (referralCode) {
            referralCodeEl.textContent = referralCode;
        } else {
            referralCodeEl.textContent = 'Not available';
        }

        // Generate referral link
        const baseUrl = window.location.origin + '/';
        const referralLink = referralCode ? `${baseUrl}signup?ref=${referralCode}` : '';
        if (referralLinkEl) {
            referralLinkEl.value = referralLink || 'Not available';
        }

        // Copy referral code
        const copyCodeBtn = document.getElementById('copy-referral-code');
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener('click', () => {
                if (!referralCode) {
                    showToast('Referral code not available', 'error');
                    return;
                }
                navigator.clipboard.writeText(referralCode).then(() => {
                    showToast('Referral code copied!', 'success');
                }).catch(() => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = referralCode;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    showToast('Referral code copied!', 'success');
                });
            });
        }

        // Copy referral link
        const copyLinkBtn = document.getElementById('copy-referral-link');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(referralLink).then(() => {
                    showToast('Referral link copied!', 'success');
                }).catch(() => {
                    referralLinkEl.select();
                    document.execCommand('copy');
                    showToast('Referral link copied!', 'success');
                });
            });
        }

        // Share buttons
        const shareMessage = `Join Everything Chommzy and get 5% off your first order! Use my referral code: ${fullUser.referralCode} or sign up here: ${referralLink}`;

        const whatsappBtn = document.getElementById('share-whatsapp');
        if (whatsappBtn) {
            whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
            whatsappBtn.target = '_blank';
        }

        const facebookBtn = document.getElementById('share-facebook');
        if (facebookBtn) {
            facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(shareMessage)}`;
            facebookBtn.target = '_blank';
        }

        const twitterBtn = document.getElementById('share-twitter');
        if (twitterBtn) {
            twitterBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
            twitterBtn.target = '_blank';
        }

        // Load referral stats
        loadReferralStats(fullUser.id);
    }

    function loadReferralStats(userId) {
        const referrals = getFromStorage('chommzyReferrals', []);
        const userReferrals = referrals.filter(r => r.referrerId === userId);

        const totalReferrals = userReferrals.length;
        const successfulReferrals = userReferrals.filter(r => r.status === 'completed').length;
        const totalEarnings = userReferrals.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.reward || 0), 0);

        // Update stats
        const totalEl = document.getElementById('total-referrals');
        const successEl = document.getElementById('successful-referrals');
        const earningsEl = document.getElementById('referral-earnings');

        if (totalEl) totalEl.textContent = totalReferrals;
        if (successEl) successEl.textContent = successfulReferrals;
        if (earningsEl) earningsEl.textContent = formatPrice(totalEarnings);

        // Render referral history
        renderReferralHistory(userReferrals);
    }

    function renderReferralHistory(referrals) {
        const container = document.getElementById('referral-history-list');
        if (!container) return;

        if (referrals.length === 0) {
            container.innerHTML = `
                <div class="no-referrals">
                    <i class="fas fa-users"></i>
                    <p>No referrals yet. Share your code to start earning!</p>
                </div>`;
            return;
        }

        container.innerHTML = referrals.map(ref => `
            <div class="referral-item">
                <div class="referral-item-info">
                    <div class="referral-avatar">${escapeHtml(getInitials(ref.newUserName))}</div>
                    <div>
                        <div class="referral-name">${escapeHtml(ref.newUserName)}</div>
                        <div class="referral-date">${new Date(ref.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                </div>
                <span class="referral-status ${ref.status}">${ref.status === 'completed' ? 'Completed' : 'Pending'}</span>
            </div>
        `).join('');
    }

    // Initialize referral section
    initReferralSection();
}

function formatStatus(status) {
    const map = { pending: 'Pending', reviewing: 'Under Review', confirmed: 'Confirmed', delivering: 'Being Delivered', delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled', rejected: 'Payment Not Received' };
    return map[status] || status;
}

// ===========================================
// 16. ADMIN DASHBOARD
// ===========================================
const adminBody = document.querySelector('.admin-body');
if (adminBody) {
    const adminSession = localStorage.getItem('chommzyAdminSession');
    if (!adminSession) {
        window.location.href = getPageUrl('ec-mgt-9k7x2');
        return;
    }

    // Admin navigation
    const adminNavLinks = document.querySelectorAll('.admin-nav a[data-section]');

    function activateAdminSection(sectionId, saveState = true) {
        const targetLink = document.querySelector(`.admin-nav a[data-section="${sectionId}"]`);
        const targetSection = document.getElementById(sectionId);
        if (!targetLink || !targetSection) return false;

        // Remove active from all
        adminNavLinks.forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        // Add active to target
        targetLink.classList.add('active');
        targetSection.classList.add('active');
        document.getElementById('admin-section-title').textContent = targetLink.textContent.trim();
        // Save state for refresh persistence
        if (saveState) {
            localStorage.setItem('chommzyAdminSection', sectionId);
            try {
                history.replaceState(null, '', '#' + sectionId);
            } catch (e) { /* ignore hash errors on file:// */ }
        }
        return true;
    }

    adminNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateAdminSection(link.dataset.section);
        });
    });

    // Restore section on page load - check hash first, then localStorage, then default
    const hashSection = window.location.hash.slice(1);
    const savedSection = localStorage.getItem('chommzyAdminSection');

    let adminSectionToActivate = 'section-dashboard'; // default

    if (hashSection && document.getElementById(hashSection)) {
        adminSectionToActivate = hashSection;
    } else if (savedSection && document.getElementById(savedSection)) {
        adminSectionToActivate = savedSection;
    }

    // Always activate a section
    activateAdminSection(adminSectionToActivate, false);

    // Mobile sidebar toggle
    document.getElementById('admin-mobile-toggle')?.addEventListener('click', () => {
        document.querySelector('.admin-sidebar')?.classList.toggle('open');
    });

    // --- DASHBOARD STATS ---
    async function updateAdminStats() {
        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.orders.stats();
            if (result.success && result.data) {
                document.getElementById('stat-total-orders').textContent = result.data.totalOrders || 0;
                document.getElementById('stat-total-revenue').textContent = formatPrice(result.data.totalRevenue || 0);
                document.getElementById('stat-pending-payments').textContent = result.data.pendingPayments || 0;
                // Get product count
                const prodResult = await API.products.list();
                if (prodResult.success && prodResult.data) {
                    document.getElementById('stat-total-products').textContent = prodResult.data.total || 0;
                }
                return;
            }
        }

        // Fallback to localStorage
        const orders = getOrders();
        const products = getProducts();

        document.getElementById('stat-total-orders').textContent = orders.length;
        document.getElementById('stat-total-revenue').textContent = formatPrice(orders.reduce((sum, o) => sum + o.total, 0));
        document.getElementById('stat-pending-payments').textContent = orders.filter(o => o.status === 'pending' || o.status === 'reviewing').length;
        document.getElementById('stat-total-products').textContent = products.length;
    }
    updateAdminStats();

    // --- ADMIN PRODUCTS ---
    let activeProductCategory = 'all';

    function updateCategoryCounts() {
        const products = getProducts();
        const counts = {
            all: products.length,
            wigs: products.filter(p => p.category === 'wigs').length,
            clothing: products.filter(p => p.category === 'clothing').length,
            shoes: products.filter(p => p.category === 'shoes').length,
            accessories: products.filter(p => p.category === 'accessories').length
        };

        Object.keys(counts).forEach(cat => {
            const countEl = document.getElementById(`count-${cat}`);
            if (countEl) countEl.textContent = counts[cat];
        });
    }

    function renderAdminProducts(category = activeProductCategory) {
        const allProducts = getProducts();
        const products = category === 'all'
            ? allProducts
            : allProducts.filter(p => p.category === category);

        const tbody = document.getElementById('admin-products-tbody');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">
                        <i class="fas fa-box-open" style="font-size:2rem;margin-bottom:0.5rem;display:block;opacity:0.5;"></i>
                        No products in this category yet.
                    </td>
                </tr>
            `;
            updateCategoryCounts();
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td><div class="product-cell"><img src="${p.image}" alt="${escapeHtml(p.name)}"><span>${escapeHtml(p.name)}</span></div></td>
                <td><span class="category-label ${escapeHtml(p.category)}">${escapeHtml(p.category)}</span></td>
                <td>${formatPrice(p.price)}</td>
                <td><span class="status-badge ${p.inStock ? 'confirmed' : 'cancelled'}">${p.inStock ? 'In Stock' : 'Out of Stock'}</span></td>
                <td class="actions-cell">
                    <button class="action-btn edit-product-btn" data-id="${p.id}" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="action-btn danger delete-product-btn" data-id="${p.id}" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        // Delete handlers
        tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this product?')) {
                    const productId = parseInt(btn.dataset.id);

                    // Try API first
                    if (API_CONFIG.useAPI) {
                        const result = await API.products.delete(productId);
                        if (!result.success && !result.useLocalStorage) {
                            showToast(result.message || 'Failed to delete product', 'error');
                            return;
                        }
                    }

                    // Update localStorage
                    let products = getProducts();
                    products = products.filter(p => p.id !== productId);
                    saveToStorage('chommzyProducts', products);
                    cachedProducts = products;

                    renderAdminProducts();
                    updateAdminStats();
                    showToast('Product deleted', 'info');
                }
            });
        });

        updateCategoryCounts();
    }

    // Category tabs click handlers
    const categoryTabs = document.getElementById('product-category-tabs');
    if (categoryTabs) {
        categoryTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.category-tab');
            if (!tab) return;

            // Update active state
            categoryTabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Filter products
            activeProductCategory = tab.dataset.category;
            renderAdminProducts(activeProductCategory);
        });
    }

    renderAdminProducts();

    // Add product modal
    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('admin-product-form');

    // Image upload handling
    let currentProductImage = '';
    const imageUploadArea = document.getElementById('pf-image-upload');
    const imageInput = document.getElementById('pf-image');
    const imagePlaceholder = document.getElementById('pf-image-placeholder');
    const imagePreview = document.getElementById('pf-image-preview');
    const imagePreviewImg = document.getElementById('pf-image-preview-img');
    const removeImageBtn = document.getElementById('pf-remove-image');

    imageUploadArea?.addEventListener('click', () => imageInput?.click());

    imageInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showToast('Image must be less than 2MB', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                currentProductImage = event.target.result;
                imagePreviewImg.src = currentProductImage;
                imagePlaceholder?.classList.add('hidden');
                imagePreview?.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    removeImageBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentProductImage = '';
        imageInput.value = '';
        imagePreviewImg.src = '';
        imagePlaceholder?.classList.remove('hidden');
        imagePreview?.classList.add('hidden');
    });

    function resetImageUpload() {
        currentProductImage = '';
        if (imageInput) imageInput.value = '';
        if (imagePreviewImg) imagePreviewImg.src = '';
        imagePlaceholder?.classList.remove('hidden');
        imagePreview?.classList.add('hidden');
    }

    function setImagePreview(imageSrc) {
        currentProductImage = imageSrc;
        if (imagePreviewImg) imagePreviewImg.src = imageSrc;
        imagePlaceholder?.classList.add('hidden');
        imagePreview?.classList.remove('hidden');
    }

    // Color selection handling
    const colorGrid = document.getElementById('pf-color-grid');
    const otherColorCheck = document.getElementById('pf-color-other-check');
    const otherColorInput = document.getElementById('pf-color-other');

    otherColorCheck?.addEventListener('change', () => {
        if (otherColorInput) {
            otherColorInput.disabled = !otherColorCheck.checked;
            if (!otherColorCheck.checked) otherColorInput.value = '';
        }
    });

    function getSelectedColors() {
        const colors = [];
        colorGrid?.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            colors.push(cb.value);
        });
        if (otherColorCheck?.checked && otherColorInput?.value.trim()) {
            colors.push(otherColorInput.value.trim());
        }
        return colors.length > 0 ? colors.join(', ') : 'Black';
    }

    function setProductColors(colorString) {
        // Reset all checkboxes
        colorGrid?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        if (otherColorCheck) otherColorCheck.checked = false;
        if (otherColorInput) {
            otherColorInput.value = '';
            otherColorInput.disabled = true;
        }

        if (!colorString) return;

        const colors = colorString.split(',').map(c => c.trim());
        const standardColors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Brown', 'Gold', 'Pink', 'Purple', 'Orange', 'Grey', 'Multi'];

        colors.forEach(color => {
            const checkbox = colorGrid?.querySelector(`input[value="${color}"]`);
            if (checkbox) {
                checkbox.checked = true;
            } else if (color && !standardColors.includes(color)) {
                // Custom color
                if (otherColorCheck) otherColorCheck.checked = true;
                if (otherColorInput) {
                    otherColorInput.disabled = false;
                    otherColorInput.value = color;
                }
            }
        });
    }

    function resetColorSelection() {
        colorGrid?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        if (otherColorCheck) otherColorCheck.checked = false;
        if (otherColorInput) {
            otherColorInput.value = '';
            otherColorInput.disabled = true;
        }
    }

    // Badge/Label selection handling
    const badgeGrid = document.getElementById('pf-badge-grid');

    function getSelectedBadges() {
        const selected = [];
        badgeGrid?.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            selected.push(cb.value);
        });
        // Return single badge string for backwards compatibility, or null if none
        return selected.length > 0 ? selected[0] : null;
    }

    function setProductBadges(badge) {
        // Reset all checkboxes first
        badgeGrid?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

        if (badge) {
            // Handle both single string and array of badges
            const badges = Array.isArray(badge) ? badge : [badge];
            badges.forEach(b => {
                const checkbox = badgeGrid?.querySelector(`input[value="${b}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    }

    function resetBadgeSelection() {
        badgeGrid?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }

    addProductBtn?.addEventListener('click', () => {
        productForm?.reset();
        resetImageUpload();
        resetColorSelection();
        resetBadgeSelection();
        document.getElementById('product-modal-title').textContent = 'Add New Product';
        document.getElementById('product-form-id').value = '';
        productModal?.classList.add('active');
    });

    productModal?.querySelector('.modal-close')?.addEventListener('click', () => {
        productModal.classList.remove('active');
        resetImageUpload();
        resetColorSelection();
        resetBadgeSelection();
    });
    productModal?.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.classList.remove('active');
            resetImageUpload();
            resetColorSelection();
            resetBadgeSelection();
        }
    });

    productForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate image
        const editId = document.getElementById('product-form-id').value;
        if (!currentProductImage && !editId) {
            showToast('Please upload a product image', 'error');
            return;
        }

        const submitBtn = productForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        let products = getProducts();
        const formData = {
            name: document.getElementById('pf-name').value.trim(),
            price: parseInt(document.getElementById('pf-price').value),
            originalPrice: document.getElementById('pf-original-price').value ? parseInt(document.getElementById('pf-original-price').value) : null,
            category: document.getElementById('pf-category').value,
            color: getSelectedColors() || 'Black',
            image: currentProductImage || 'https://placehold.co/400x500/f5f0eb/333?text=Product',
            description: document.getElementById('pf-description').value || '',
            sizes: document.getElementById('pf-sizes').value.split(',').map(s => s.trim()).filter(Boolean),
            rating: 4.5,
            reviews: 0,
            badge: getSelectedBadges(),
            inStock: document.getElementById('pf-stock').value === 'true'
        };

        if (editId) {
            // Update existing product
            formData.id = parseInt(editId);

            // Try API first
            if (API_CONFIG.useAPI) {
                const result = await API.products.update(formData);
                if (!result.success && !result.useLocalStorage) {
                    showToast(result.message || 'Failed to update product', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Save Product';
                    return;
                }
            }

            const idx = products.findIndex(p => p.id === parseInt(editId));
            if (idx > -1) {
                products[idx] = { ...products[idx], ...formData };
            }
            showToast('Product updated!', 'success');
        } else {
            // Create new product
            // Try API first
            if (API_CONFIG.useAPI) {
                const result = await API.products.create(formData);
                if (result.success && result.data?.id) {
                    formData.id = result.data.id;
                } else if (!result.useLocalStorage) {
                    showToast(result.message || 'Failed to add product', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Save Product';
                    return;
                } else {
                    formData.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
                }
            } else {
                formData.id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
            }
            products.push(formData);
            showToast('Product added!', 'success');
        }

        saveToStorage('chommzyProducts', products);
        cachedProducts = products;
        renderAdminProducts();
        updateAdminStats();
        productModal?.classList.remove('active');
        resetImageUpload();
        resetColorSelection();
        resetBadgeSelection();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Product';
    });

    // Edit product handlers (delegated)
    document.getElementById('admin-products-tbody')?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-product-btn');
        if (editBtn) {
            const products = getProducts();
            const product = products.find(p => p.id === parseInt(editBtn.dataset.id));
            if (product) {
                document.getElementById('product-modal-title').textContent = 'Edit Product';
                document.getElementById('product-form-id').value = product.id;
                document.getElementById('pf-name').value = product.name;
                document.getElementById('pf-price').value = product.price;
                document.getElementById('pf-original-price').value = product.originalPrice || '';
                document.getElementById('pf-category').value = product.category;
                setProductColors(product.color);
                setImagePreview(product.image);
                document.getElementById('pf-description').value = product.description;
                document.getElementById('pf-sizes').value = product.sizes.join(', ');
                setProductBadges(product.badge);
                document.getElementById('pf-stock').value = product.inStock ? 'true' : 'false';
                productModal?.classList.add('active');
            }
        }
    });

    // --- ADMIN ORDERS ---
    async function renderAdminOrders() {
        let orders = [];

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.orders.list();
            if (result.success && result.data?.orders) {
                orders = result.data.orders;
            }
        }

        // Fallback to localStorage or merge
        if (orders.length === 0) {
            orders = getOrders().reverse();
        }

        // Separate active and completed orders
        const activeOrders = orders.filter(o => {
            const status = o.order_status || o.status || 'pending';
            return status !== 'completed';
        });
        const completedOrders = orders.filter(o => {
            const status = o.order_status || o.status || 'pending';
            return status === 'completed';
        });

        // Update tab counts
        const activeCountEl = document.getElementById('active-orders-count');
        const completedCountEl = document.getElementById('completed-orders-count');
        if (activeCountEl) activeCountEl.textContent = activeOrders.length;
        if (completedCountEl) completedCountEl.textContent = completedOrders.length;

        // Render active orders
        const tbody = document.getElementById('admin-orders-tbody');
        if (tbody) {
            if (activeOrders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">No active orders</td></tr>';
            } else {
                tbody.innerHTML = activeOrders.map(order => {
                    const status = order.order_status || order.status || 'pending';
                    const paymentStatus = order.payment_status || 'pending';
                    const customerName = order.customer_name || order.userName || 'Customer';
                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    const total = order.total || 0;
                    const createdAt = order.created_at || order.createdAt;

                    return `
                    <tr>
                        <td><strong>${escapeHtml(order.id)}</strong></td>
                        <td>${escapeHtml(customerName)}</td>
                        <td>${items?.length || 0} item${(items?.length || 0) > 1 ? 's' : ''}</td>
                        <td><strong>${formatPrice(total)}</strong></td>
                        <td><span class="status-badge ${status}">${formatStatus(status)}</span></td>
                        <td>${new Date(createdAt).toLocaleDateString('en-NG')}</td>
                        <td class="actions-cell">
                            <button class="action-btn view-order-btn" data-id="${order.id}" title="View"><i class="fas fa-eye"></i></button>
                            ${status === 'pending' ? `<button class="action-btn success confirm-payment-btn" data-id="${order.id}" title="Confirm Payment"><i class="fas fa-check"></i></button><button class="action-btn danger reject-payment-btn" data-id="${order.id}" title="Payment Not Received"><i class="fas fa-times"></i></button>` : ''}
                            ${status === 'confirmed' ? `<button class="action-btn success mark-delivering-btn" data-id="${order.id}" title="Mark as Delivering"><i class="fas fa-truck"></i></button>` : ''}
                            ${status === 'delivering' ? `<button class="action-btn success mark-delivered-btn" data-id="${order.id}" title="Mark as Delivered"><i class="fas fa-box-open"></i></button>` : ''}
                            ${status === 'delivered' ? `<span class="text-muted" style="font-size:0.8rem;">Awaiting customer confirmation</span>` : ''}
                        </td>
                    </tr>
                `}).join('');

                // Order action handlers
                tbody.querySelectorAll('.confirm-payment-btn').forEach(btn => {
                    btn.addEventListener('click', () => updateOrderStatus(btn.dataset.id, 'confirmed', 'Payment confirmed'));
                });
                tbody.querySelectorAll('.reject-payment-btn').forEach(btn => {
                    btn.addEventListener('click', () => updateOrderStatus(btn.dataset.id, 'rejected', 'Payment not received'));
                });
                tbody.querySelectorAll('.mark-delivering-btn').forEach(btn => {
                    btn.addEventListener('click', () => updateOrderStatus(btn.dataset.id, 'delivering', 'Order is being delivered'));
                });
                tbody.querySelectorAll('.mark-delivered-btn').forEach(btn => {
                    btn.addEventListener('click', () => updateOrderStatus(btn.dataset.id, 'delivered', 'Order delivered'));
                });
                tbody.querySelectorAll('.view-order-btn').forEach(btn => {
                    btn.addEventListener('click', () => viewOrderDetail(btn.dataset.id));
                });
            }
        }

        // Render completed orders
        const completedTbody = document.getElementById('admin-completed-orders-tbody');
        if (completedTbody) {
            if (completedOrders.length === 0) {
                completedTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">No completed orders yet</td></tr>';
            } else {
                completedTbody.innerHTML = completedOrders.map(order => {
                    const customerName = order.customer_name || order.userName || 'Customer';
                    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                    const total = order.total || 0;
                    const createdAt = order.created_at || order.createdAt;
                    const completedAt = order.completedAt || order.receiptConfirmedAt || createdAt;

                    return `
                    <tr>
                        <td><strong>${escapeHtml(order.id)}</strong></td>
                        <td>${escapeHtml(customerName)}</td>
                        <td>${items?.length || 0} item${(items?.length || 0) > 1 ? 's' : ''}</td>
                        <td><strong>${formatPrice(total)}</strong></td>
                        <td>${new Date(completedAt).toLocaleDateString('en-NG')}</td>
                        <td>${new Date(createdAt).toLocaleDateString('en-NG')}</td>
                    </tr>
                `}).join('');
            }
        }
    }

    // Order tabs switching
    document.querySelectorAll('.order-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.order-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab)?.classList.add('active');
        });
    });

    async function updateOrderStatus(orderId, newStatus, note) {
        // Define valid status progression (forward only)
        const statusOrder = ['pending', 'confirmed', 'delivering', 'delivered', 'completed'];

        // Get current order status
        let orders = getOrders();
        const idx = orders.findIndex(o => o.id === orderId);
        if (idx === -1) return;

        const currentStatus = orders[idx].status || 'pending';
        const currentIdx = statusOrder.indexOf(currentStatus);
        const newIdx = statusOrder.indexOf(newStatus);

        // Prevent going backwards (except for rejected which is special)
        if (newStatus !== 'rejected' && newIdx !== -1 && currentIdx !== -1 && newIdx <= currentIdx) {
            showToast(`Order is already at "${formatStatus(currentStatus)}" status`, 'info');
            return;
        }

        // Prevent duplicate status update
        if (currentStatus === newStatus) {
            showToast(`Order is already "${formatStatus(newStatus)}"`, 'info');
            return;
        }

        // Try API first
        if (API_CONFIG.useAPI) {
            const apiStatus = newStatus === 'confirmed' ? 'processing' : newStatus;
            const result = await API.orders.updateStatus(orderId, apiStatus);

            if (newStatus === 'confirmed') {
                await API.orders.confirmPayment(orderId, 'confirmed');
            }

            if (!result.success && !result.useLocalStorage) {
                showToast(result.message || 'Failed to update order', 'error');
                return;
            }
        }

        // Update localStorage
        orders[idx].status = newStatus;
        orders[idx].updatedAt = new Date().toISOString();
        if (!orders[idx].statusHistory) orders[idx].statusHistory = [];
        orders[idx].statusHistory.push({
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: note
        });
        saveToStorage('chommzyOrders', orders);

        // Notify customer (only for localStorage mode - API handles notifications server-side)
        if (!API_CONFIG.useAPI) {
            const statusMessages = {
                confirmed: `Payment confirmed for order ${orderId}! Your order is being prepared.`,
                delivering: `Great news! Your order ${orderId} is on its way!`,
                delivered: `Your order ${orderId} has been delivered. Please confirm receival in your account.`,
                rejected: `Payment for order ${orderId} was not received. Please upload valid payment proof or contact support.`
            };
            if (statusMessages[newStatus]) {
                addNotification(orders[idx].userId, statusMessages[newStatus]);
            }
        }

        renderAdminOrders();
        updateAdminStats();
        showToast(`Order ${orderId} updated to "${formatStatus(newStatus)}"`, 'success');
    }

    function viewOrderDetail(orderId) {
        const orders = getOrders();
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.getElementById('order-detail-modal');
        if (!modal) return;

        document.getElementById('od-order-id').textContent = order.id;
        document.getElementById('od-status').innerHTML = `<span class="status-badge ${order.status}">${formatStatus(order.status)}</span>`;
        document.getElementById('od-date').textContent = new Date(order.createdAt).toLocaleString('en-NG');
        document.getElementById('od-customer').textContent = order.userName || 'N/A';
        document.getElementById('od-email').textContent = order.userEmail || order.shippingInfo?.email || 'N/A';
        document.getElementById('od-phone').textContent = order.shippingInfo?.phone || 'N/A';
        document.getElementById('od-address').textContent = `${order.shippingInfo?.address || ''}, ${order.shippingInfo?.city || ''}, ${order.shippingInfo?.state || ''}`;

        document.getElementById('od-items').innerHTML = order.items.map(item => `
            <div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-light);">
                <img src="${item.image}" style="width:50px;height:50px;border-radius:4px;object-fit:cover;">
                <div style="flex:1">
                    <div style="font-weight:500;font-size:0.9rem;">${escapeHtml(item.name)}</div>
                    <div style="font-size:0.82rem;color:var(--text-muted);">Qty: ${item.quantity}${item.size ? ' | Size: ' + escapeHtml(item.size) : ''}</div>
                </div>
                <div style="font-weight:600;">${formatPrice(item.price * item.quantity)}</div>
            </div>
        `).join('');

        document.getElementById('od-total').textContent = formatPrice(order.total);

        // Payment proof
        const proofContainer = document.getElementById('od-payment-proof');
        if (order.paymentProof) {
            proofContainer.innerHTML = `<div class="payment-proof-preview"><img src="${order.paymentProof}" alt="Payment Proof"></div>`;
        } else {
            proofContainer.innerHTML = '<p class="text-muted">No payment proof uploaded</p>';
        }

        // Status actions in modal
        const actionsContainer = document.getElementById('od-actions');
        let actionsHtml = '';
        if (order.status === 'pending') actionsHtml = `<button class="btn btn-accent btn-sm" onclick="window.adminUpdateStatus('${order.id}', 'confirmed', 'Payment confirmed')">Confirm Payment</button> <button class="btn btn-danger btn-sm" onclick="window.adminUpdateStatus('${order.id}', 'rejected', 'Payment not received')">Payment Not Received</button>`;
        else if (order.status === 'confirmed') actionsHtml = `<button class="btn btn-accent btn-sm" onclick="window.adminUpdateStatus('${order.id}', 'delivering', 'Order dispatched for delivery')">Mark as Delivering</button>`;
        else if (order.status === 'delivering') actionsHtml = `<button class="btn btn-success btn-sm" onclick="window.adminUpdateStatus('${order.id}', 'delivered', 'Order delivered')">Mark as Delivered</button>`;
        else if (order.status === 'delivered') actionsHtml = `<span class="text-muted"><i class="fas fa-clock"></i> Awaiting customer to confirm receival</span>`;
        else if (order.status === 'completed') actionsHtml = `<span class="text-success"><i class="fas fa-check-circle"></i> Order completed</span>`;
        actionsContainer.innerHTML = actionsHtml;

        modal.classList.add('active');
    }

    // Expose for inline onclick
    window.adminUpdateStatus = (id, status, note) => {
        updateOrderStatus(id, status, note);
        document.getElementById('order-detail-modal')?.classList.remove('active');
    };

    const orderDetailModal = document.getElementById('order-detail-modal');
    orderDetailModal?.querySelector('.modal-close')?.addEventListener('click', () => orderDetailModal.classList.remove('active'));
    orderDetailModal?.addEventListener('click', (e) => { if (e.target === orderDetailModal) orderDetailModal.classList.remove('active'); });

    renderAdminOrders();

    // --- ADMIN BANK ACCOUNTS ---
    function renderAdminBankAccounts() {
        const accounts = getBankAccounts();
        const container = document.getElementById('admin-bank-cards');
        if (!container) return;

        if (accounts.length === 0) {
            container.innerHTML = '<p class="text-muted" style="padding:2rem;text-align:center;">No bank accounts added yet. Add your first bank account for customers to make payments.</p>';
            return;
        }

        container.innerHTML = accounts.map(acc => `
            <div class="admin-bank-card">
                <div class="bank-icon"><i class="fas fa-university"></i></div>
                <h4>${escapeHtml(acc.bankName)}</h4>
                <div class="detail-row"><span>Account Number</span><span>${escapeHtml(acc.accountNumber)}</span></div>
                <div class="detail-row"><span>Account Name</span><span>${escapeHtml(acc.accountName)}</span></div>
                <div class="detail-row"><span>Status</span><span><span class="status-dot ${acc.isActive ? 'active' : 'inactive'}"></span>${acc.isActive ? 'Active' : 'Inactive'}</span></div>
                <div class="card-actions">
                    <button class="btn btn-ghost btn-sm toggle-bank-btn" data-id="${acc.id}">${acc.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button class="btn btn-ghost btn-sm delete-bank-btn" data-id="${acc.id}" style="color:var(--danger);">Delete</button>
                </div>
            </div>
        `).join('');

        // Handlers
        container.querySelectorAll('.toggle-bank-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                let accounts = getBankAccounts();
                const acc = accounts.find(a => a.id === btn.dataset.id);
                if (acc) {
                    acc.isActive = !acc.isActive;
                    saveToStorage('chommzyBankAccounts', accounts);
                    renderAdminBankAccounts();
                    showToast(`Bank account ${acc.isActive ? 'activated' : 'deactivated'}`, 'success');
                }
            });
        });

        container.querySelectorAll('.delete-bank-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Delete this bank account?')) {
                    let accounts = getBankAccounts();
                    accounts = accounts.filter(a => a.id !== btn.dataset.id);
                    saveToStorage('chommzyBankAccounts', accounts);
                    renderAdminBankAccounts();
                    showToast('Bank account deleted', 'info');
                }
            });
        });
    }
    renderAdminBankAccounts();

    // Add bank account form
    const bankForm = document.getElementById('add-bank-form');
    bankForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const bankName = document.getElementById('bank-name').value.trim();
        const accountNumber = document.getElementById('bank-account-number').value.trim();
        const accountName = document.getElementById('bank-account-name').value.trim();

        if (!bankName || !accountNumber || !accountName) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        let accounts = getBankAccounts();
        accounts.push({
            id: Date.now().toString(36),
            bankName,
            accountNumber,
            accountName,
            isActive: true
        });
        saveToStorage('chommzyBankAccounts', accounts);
        renderAdminBankAccounts();
        bankForm.reset();
        showToast('Bank account added!', 'success');

        // Close modal
        document.getElementById('bank-modal')?.classList.remove('active');
    });

    // Bank modal
    const addBankBtn = document.getElementById('add-bank-btn');
    const bankModal = document.getElementById('bank-modal');
    addBankBtn?.addEventListener('click', () => bankModal?.classList.add('active'));
    bankModal?.querySelector('.modal-close')?.addEventListener('click', () => bankModal?.classList.remove('active'));
    bankModal?.addEventListener('click', (e) => { if (e.target === bankModal) bankModal.classList.remove('active'); });

    // --- ADMIN CUSTOMERS ---
    function renderAdminCustomers() {
        const users = getUsers().filter(u => u.role !== 'admin');
        const tbody = document.getElementById('admin-customers-tbody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">No customers yet</td></tr>';
            return;
        }

        const orders = getOrders();
        tbody.innerHTML = users.map(u => {
            const userOrders = orders.filter(o => o.userId === u.id);
            const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
            return `
                <tr>
                    <td><div class="product-cell"><div class="review-avatar" style="width:35px;height:35px;font-size:0.75rem;">${escapeHtml(getInitials(u.name))}</div><span>${escapeHtml(u.name)}</span></div></td>
                    <td>${escapeHtml(u.email)}</td>
                    <td>${userOrders.length} orders</td>
                    <td>${formatPrice(totalSpent)}</td>
                </tr>`;
        }).join('');
    }
    renderAdminCustomers();

    // --- ADMIN REFERRALS ---
    async function renderAdminReferrals() {
        let referrals = [];
        let usersWithReferrals = [];
        let totalReferrals = 0, completedReferrals = 0, pendingReferrals = 0;

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.referrals.allStats();
            if (result.success && result.data) {
                totalReferrals = result.data.totalReferrals || 0;
                completedReferrals = result.data.completedReferrals || 0;
                pendingReferrals = result.data.pendingReferrals || 0;
                usersWithReferrals = result.data.usersWithReferrals || [];

                // Get all referrals for the list
                const refResult = await API.referrals.list();
                if (refResult.success && refResult.data?.referrals) {
                    referrals = refResult.data.referrals;
                }
            }
        }

        // Fallback to localStorage
        if (referrals.length === 0 && totalReferrals === 0) {
            referrals = getFromStorage('chommzyReferrals', []);
            const users = getUsers().filter(u => u.role !== 'admin');

            totalReferrals = referrals.length;
            completedReferrals = referrals.filter(r => r.status === 'completed').length;
            pendingReferrals = referrals.filter(r => r.status === 'pending').length;

            // Build users with referrals from localStorage
            const referrerStats = {};
            referrals.forEach(ref => {
                if (!referrerStats[ref.referrerId]) {
                    const referrer = users.find(u => u.id === ref.referrerId);
                    if (referrer) {
                        referrerStats[ref.referrerId] = {
                            name: referrer.name,
                            email: referrer.email,
                            referral_code: referrer.referralCode,
                            total_referrals: 0,
                            successful_referrals: 0
                        };
                    }
                }
                if (referrerStats[ref.referrerId]) {
                    referrerStats[ref.referrerId].total_referrals++;
                    if (ref.status === 'completed') referrerStats[ref.referrerId].successful_referrals++;
                }
            });
            usersWithReferrals = Object.values(referrerStats);
        }

        // Update stats
        const totalRefEl = document.getElementById('stat-total-referrals');
        const completedRefEl = document.getElementById('stat-completed-referrals');
        const pendingRefEl = document.getElementById('stat-pending-referrals');

        if (totalRefEl) totalRefEl.textContent = totalReferrals;
        if (completedRefEl) completedRefEl.textContent = completedReferrals;
        if (pendingRefEl) pendingRefEl.textContent = pendingReferrals;

        // Render top referrers
        const topReferrersTbody = document.getElementById('admin-top-referrers-tbody');
        if (topReferrersTbody) {
            const sortedReferrers = usersWithReferrals
                .filter(r => r.total_referrals > 0)
                .sort((a, b) => b.total_referrals - a.total_referrals);

            if (sortedReferrers.length === 0) {
                topReferrersTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">No referrals yet.</td></tr>';
            } else {
                topReferrersTbody.innerHTML = sortedReferrers.map(r => `
                    <tr>
                        <td><div class="product-cell"><div class="review-avatar" style="width:35px;height:35px;font-size:0.75rem;">${escapeHtml(getInitials(r.name))}</div><span>${escapeHtml(r.name)}</span></div></td>
                        <td>${escapeHtml(r.email)}</td>
                        <td><code style="background:#f0f0f0;padding:2px 8px;border-radius:4px;font-size:0.85rem;">${escapeHtml(r.referral_code || 'N/A')}</code></td>
                        <td><strong>${r.total_referrals}</strong></td>
                        <td><span style="color:var(--green);font-weight:600;">${r.successful_referrals}</span></td>
                    </tr>
                `).join('');
            }
        }

        // Render all referrals
        const referralsTbody = document.getElementById('admin-referrals-tbody');
        if (referralsTbody) {
            if (referrals.length === 0) {
                referralsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">No referrals yet.</td></tr>';
            } else {
                referralsTbody.innerHTML = referrals.map(ref => {
                    const referrerName = ref.referrer_name || ref.referrerName || 'Unknown';
                    const referredName = ref.referred_user_name || ref.referred_name || ref.newUserName || 'Unknown';
                    const status = ref.status || 'pending';
                    const createdAt = ref.created_at || ref.createdAt;
                    const statusClass = status === 'completed' ? 'color:var(--green);' : 'color:#b38600;';
                    return `
                        <tr>
                            <td>${escapeHtml(referrerName)}</td>
                            <td>${escapeHtml(referredName)}</td>
                            <td><span style="${statusClass}font-weight:500;text-transform:capitalize;">${escapeHtml(status)}</span></td>
                            <td>${new Date(createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    }
    renderAdminReferrals();

    // --- ANNOUNCEMENTS ---
    function getAnnouncements() {
        return JSON.parse(localStorage.getItem('chommzyAnnouncements') || '[]');
    }

    function saveAnnouncements(announcements) {
        localStorage.setItem('chommzyAnnouncements', JSON.stringify(announcements));
    }

    async function sendAnnouncement(title, message, recipients = 'all', userIds = []) {
        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.notifications.sendAnnouncement(title, message, recipients, userIds);
            if (result.success) {
                return result.data?.recipientCount || 0;
            }
            if (!result.useLocalStorage) {
                throw new Error(result.message || 'Failed to send announcement');
            }
        }

        // Fallback to localStorage
        const allUsers = JSON.parse(localStorage.getItem('chommzyUsers') || '[]');
        const notifications = getNotifications();
        const announcementId = Date.now().toString(36);
        const fullMessage = `📢 ${title}: ${message}`;

        // Filter users based on recipients setting
        let targetUsers = allUsers.filter(u => u.role !== 'admin');
        if (recipients === 'selected' && userIds.length > 0) {
            targetUsers = targetUsers.filter(u => userIds.includes(u.id));
        }

        // Send notification to target users
        targetUsers.forEach(user => {
            notifications.push({
                id: `ann-${announcementId}-${user.id}`,
                userId: user.id,
                message: fullMessage,
                type: 'announcement',
                read: false,
                createdAt: new Date().toISOString()
            });
        });
        saveToStorage('chommzyNotifications', notifications);

        // Save announcement record
        const announcements = getAnnouncements();
        announcements.unshift({
            id: announcementId,
            title,
            message,
            recipientCount: targetUsers.length,
            createdAt: new Date().toISOString()
        });
        saveAnnouncements(announcements);

        return targetUsers.length;
    }

    async function renderAdminAnnouncements() {
        const tbody = document.getElementById('admin-announcements-tbody');
        if (!tbody) return;

        let announcements = [];

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.notifications.listAnnouncements();
            if (result.success && result.data?.announcements) {
                announcements = result.data.announcements.map(a => ({
                    id: a.id,
                    title: a.title,
                    message: a.message,
                    recipientCount: a.recipient_count,
                    createdAt: a.created_at
                }));
            }
        }

        // Fallback to localStorage
        if (announcements.length === 0 && !API_CONFIG.useAPI) {
            announcements = getAnnouncements();
        }

        if (announcements.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">No announcements sent yet.</td></tr>';
            return;
        }

        tbody.innerHTML = announcements.map(ann => `
            <tr>
                <td><strong>${escapeHtml(ann.title)}</strong></td>
                <td style="max-width:250px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(ann.message)}</td>
                <td>${new Date(ann.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td><span style="color:var(--accent);font-weight:600;">${ann.recipientCount} users</span></td>
                <td><button class="btn btn-sm btn-outline delete-announcement-btn" data-id="${ann.id}"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');

        // Delete announcement handler
        tbody.querySelectorAll('.delete-announcement-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const annId = btn.dataset.id;

                // Confirm before deleting
                showConfirmModal({
                    title: 'Delete Announcement',
                    message: 'This will delete the announcement and remove it from all users\' notifications. This cannot be undone.',
                    icon: 'fa-trash-alt',
                    confirmText: 'Delete',
                    onConfirm: async () => {
                        // Try API first
                        if (API_CONFIG.useAPI) {
                            const result = await API.notifications.deleteAnnouncement(annId);
                            if (result.success) {
                                renderAdminAnnouncements();
                                showToast('Announcement deleted from all users', 'success');
                                return;
                            }
                        }

                        // Fallback to localStorage - delete from both announcements and notifications
                        const announcements = getAnnouncements();
                        const idx = announcements.findIndex(a => a.id === annId);
                        if (idx > -1) {
                            announcements.splice(idx, 1);
                            saveAnnouncements(announcements);
                        }

                        // Also delete related notifications from all users
                        let notifications = getNotifications();
                        notifications = notifications.filter(n => !n.id.includes(`ann-${annId}`));
                        saveToStorage('chommzyNotifications', notifications);

                        renderAdminAnnouncements();
                        showToast('Announcement deleted from all users', 'success');
                    }
                });
            });
        });
    }

    // Recipient selection toggle
    const recipientRadios = document.querySelectorAll('input[name="recipient-type"]');
    const userSelectContainer = document.getElementById('user-select-container');

    recipientRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'selected' && radio.checked) {
                userSelectContainer.style.display = 'block';
                loadUserCheckboxes();
            } else if (radio.value === 'all' && radio.checked) {
                userSelectContainer.style.display = 'none';
            }
        });
    });

    // Load users for checkbox selection
    async function loadUserCheckboxes() {
        const container = document.getElementById('user-checkboxes');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Loading users...</div>';

        let users = [];

        // Try API first
        if (API_CONFIG.useAPI) {
            const result = await API.customers.list();
            if (result.success && result.data?.customers) {
                users = result.data.customers;
            }
        }

        // Fallback to localStorage
        if (users.length === 0) {
            users = JSON.parse(localStorage.getItem('chommzyUsers') || '[]').filter(u => u.role !== 'admin');
        }

        if (users.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);">No users found</div>';
            return;
        }

        container.innerHTML = users.map(user => `
            <label style="display:flex;align-items:center;gap:10px;padding:8px;cursor:pointer;border-bottom:1px solid var(--border);">
                <input type="checkbox" class="user-checkbox" value="${user.id}" style="width:18px;height:18px;">
                <div>
                    <div style="font-weight:500;">${user.name}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);">${user.email}</div>
                </div>
            </label>
        `).join('');
    }

    // Announcement form submission
    document.getElementById('announcement-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('announcement-title').value.trim();
        const message = document.getElementById('announcement-message').value.trim();
        const recipientType = document.querySelector('input[name="recipient-type"]:checked')?.value || 'all';

        if (!title || !message) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        let selectedUserIds = [];
        if (recipientType === 'selected') {
            selectedUserIds = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
            if (selectedUserIds.length === 0) {
                showToast('Please select at least one user', 'error');
                return;
            }
        }

        try {
            const recipientCount = await sendAnnouncement(title, message, recipientType, selectedUserIds);
            showToast(`Announcement sent to ${recipientCount} user${recipientCount !== 1 ? 's' : ''}!`, 'success');
            e.target.reset();
            userSelectContainer.style.display = 'none';
            renderAdminAnnouncements();
        } catch (error) {
            showToast(error.message || 'Failed to send announcement', 'error');
        }
    });

    renderAdminAnnouncements();

    // --- SETTINGS ---
    // ===== FLASH DEALS MANAGEMENT =====
    function getFlashDeals() {
        const saved = localStorage.getItem('chommzyFlashDeals');
        return saved ? JSON.parse(saved) : [];
    }

    function saveFlashDeals(deals) {
        localStorage.setItem('chommzyFlashDeals', JSON.stringify(deals));
    }

    function getActiveFlashDeal() {
        const deals = getFlashDeals();
        const now = new Date();
        return deals.find(deal => {
            if (!deal.enabled) return false;
            const start = new Date(`${deal.startDate}T${deal.startTime || '00:00'}`);
            const end = new Date(`${deal.endDate}T${deal.endTime || '23:59'}`);
            return now >= start && now <= end;
        });
    }

    // Render flash deals list
    function renderFlashDealsList() {
        const listEl = document.getElementById('flash-deals-list');
        const noDealsEl = document.getElementById('no-flash-deals');
        const tableEl = document.getElementById('flash-deals-table');
        if (!listEl) return;

        const deals = getFlashDeals();

        if (deals.length === 0) {
            if (tableEl) tableEl.style.display = 'none';
            if (noDealsEl) noDealsEl.style.display = 'block';
            return;
        }

        if (tableEl) tableEl.style.display = 'table';
        if (noDealsEl) noDealsEl.style.display = 'none';

        const now = new Date();
        listEl.innerHTML = deals.map(deal => {
            const start = new Date(`${deal.startDate}T${deal.startTime || '00:00'}`);
            const end = new Date(`${deal.endDate}T${deal.endTime || '23:59'}`);
            let status, statusClass;

            if (!deal.enabled) {
                status = 'Disabled';
                statusClass = 'status-cancelled';
            } else if (now < start) {
                status = 'Scheduled';
                statusClass = 'status-pending';
            } else if (now > end) {
                status = 'Expired';
                statusClass = 'status-cancelled';
            } else {
                status = 'Active';
                statusClass = 'status-completed';
            }

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(deal.title)}</strong>
                        ${deal.subtitle ? `<br><small style="color:var(--text-muted);">${escapeHtml(deal.subtitle)}</small>` : ''}
                    </td>
                    <td><span style="color:#f5576c;font-weight:600;">${deal.discount}% OFF</span></td>
                    <td>${formatFlashDate(deal.startDate)}<br><small>${deal.startTime || '00:00'}</small></td>
                    <td>${formatFlashDate(deal.endDate)}<br><small>${deal.endTime || '23:59'}</small></td>
                    <td><span class="order-status ${statusClass}">${status}</span></td>
                    <td>
                        <div style="display:flex;gap:8px;">
                            <button class="btn-icon edit-flash-deal" data-id="${deal.id}" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete-flash-deal" data-id="${deal.id}" title="Delete" style="color:#dc3545;"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach event listeners
        listEl.querySelectorAll('.edit-flash-deal').forEach(btn => {
            btn.addEventListener('click', () => editFlashDeal(btn.dataset.id));
        });
        listEl.querySelectorAll('.delete-flash-deal').forEach(btn => {
            btn.addEventListener('click', () => deleteFlashDeal(btn.dataset.id));
        });
    }

    function formatFlashDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    // Show/hide flash deal form
    const createFlashDealBtn = document.getElementById('create-flash-deal-btn');
    const flashDealFormCard = document.getElementById('flash-deal-form-card');
    const closeFlashDealForm = document.getElementById('close-flash-deal-form');
    const cancelFlashDealBtn = document.getElementById('cancel-flash-deal-btn');
    const flashDealFormTitle = document.getElementById('flash-deal-form-title');

    function showFlashDealForm(editMode = false) {
        if (flashDealFormCard) flashDealFormCard.style.display = 'block';
        if (flashDealFormTitle) flashDealFormTitle.textContent = editMode ? 'Edit Flash Deal' : 'Create New Flash Deal';
        flashDealFormCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function hideFlashDealForm() {
        if (flashDealFormCard) flashDealFormCard.style.display = 'none';
        document.getElementById('flash-deals-form')?.reset();
        const editIdEl = document.getElementById('flash-deal-edit-id');
        if (editIdEl) editIdEl.value = '';
    }

    createFlashDealBtn?.addEventListener('click', () => {
        hideFlashDealForm();
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const startDateEl = document.getElementById('flash-deals-start-date');
        const endDateEl = document.getElementById('flash-deals-end-date');
        const enabledEl = document.getElementById('flash-deals-enabled');
        if (startDateEl) startDateEl.value = today;
        if (endDateEl) endDateEl.value = nextWeek;
        if (enabledEl) enabledEl.checked = true;
        showFlashDealForm(false);
    });

    closeFlashDealForm?.addEventListener('click', hideFlashDealForm);
    cancelFlashDealBtn?.addEventListener('click', hideFlashDealForm);

    // Edit flash deal
    function editFlashDeal(id) {
        const deals = getFlashDeals();
        const deal = deals.find(d => d.id === id);
        if (!deal) return;

        const editIdEl = document.getElementById('flash-deal-edit-id');
        const titleEl = document.getElementById('flash-deals-title');
        const subtitleEl = document.getElementById('flash-deals-subtitle');
        const startDateEl = document.getElementById('flash-deals-start-date');
        const startTimeEl = document.getElementById('flash-deals-start-time');
        const endDateEl = document.getElementById('flash-deals-end-date');
        const endTimeEl = document.getElementById('flash-deals-end-time');
        const discountEl = document.getElementById('flash-deals-discount');
        const enabledEl = document.getElementById('flash-deals-enabled');

        if (editIdEl) editIdEl.value = deal.id;
        if (titleEl) titleEl.value = deal.title || '';
        if (subtitleEl) subtitleEl.value = deal.subtitle || '';
        if (startDateEl) startDateEl.value = deal.startDate || '';
        if (startTimeEl) startTimeEl.value = deal.startTime || '00:00';
        if (endDateEl) endDateEl.value = deal.endDate || '';
        if (endTimeEl) endTimeEl.value = deal.endTime || '23:59';
        if (discountEl) discountEl.value = deal.discount || 20;
        if (enabledEl) enabledEl.checked = deal.enabled !== false;

        showFlashDealForm(true);
    }

    // Delete flash deal
    function deleteFlashDeal(id) {
        if (!confirm('Are you sure you want to delete this flash deal?')) return;

        let deals = getFlashDeals();
        deals = deals.filter(d => d.id !== id);
        saveFlashDeals(deals);
        renderFlashDealsList();
        showToast('Flash deal deleted!', 'success');
    }

    // Flash deals form submission
    document.getElementById('flash-deals-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const editIdEl = document.getElementById('flash-deal-edit-id');
        const editId = editIdEl?.value;
        const deal = {
            id: editId || 'fd-' + Date.now().toString(36),
            title: document.getElementById('flash-deals-title')?.value.trim() || '',
            subtitle: document.getElementById('flash-deals-subtitle')?.value.trim() || '',
            startDate: document.getElementById('flash-deals-start-date')?.value || '',
            startTime: document.getElementById('flash-deals-start-time')?.value || '00:00',
            endDate: document.getElementById('flash-deals-end-date')?.value || '',
            endTime: document.getElementById('flash-deals-end-time')?.value || '23:59',
            discount: parseInt(document.getElementById('flash-deals-discount')?.value) || 20,
            enabled: document.getElementById('flash-deals-enabled')?.checked ?? true,
            createdAt: editId ? undefined : new Date().toISOString()
        };

        if (!deal.title || !deal.startDate || !deal.endDate) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        let deals = getFlashDeals();

        if (editId) {
            // Update existing deal
            const index = deals.findIndex(d => d.id === editId);
            if (index > -1) {
                deals[index] = { ...deals[index], ...deal };
            }
        } else {
            // Add new deal
            deals.unshift(deal);
        }

        saveFlashDeals(deals);
        hideFlashDealForm();
        renderFlashDealsList();
        showToast(editId ? 'Flash deal updated!' : 'Flash deal created!', 'success');
    });

    // Initialize flash deals list
    renderFlashDealsList();

    // Change Admin Password
    document.getElementById('change-admin-password-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        // Admin password change requires server authentication
        if (API_CONFIG.useAPI) {
            const result = await API.auth.changePassword(currentPassword, newPassword);
            if (result.success) {
                showToast('Password changed successfully!', 'success');
                e.target.reset();
                return;
            }
            showToast(result.message || 'Failed to change password', 'error');
            return;
        }

        // No API available - cannot change password without server
        showToast('Password change requires server connection. Please use "Reset via Email" instead.', 'error');
    });

    // Admin OTP-based password reset
    const resetViaEmailBtn = document.getElementById('reset-via-email-btn');
    const backToStandardBtn = document.getElementById('back-to-standard-btn');
    const standardSection = document.getElementById('password-change-standard');
    const otpSection = document.getElementById('password-reset-otp');
    const sendOtpBtn = document.getElementById('send-admin-otp-btn');
    const otpResetForm = document.getElementById('admin-otp-reset-form');

    if (resetViaEmailBtn && standardSection && otpSection) {
        // Get admin email from session
        const adminSession = getFromStorage('chommzyAdminSession', null);
        const adminEmail = adminSession?.email || 'admin@everythingchommzy.com';

        // Toggle to OTP reset
        resetViaEmailBtn.addEventListener('click', (e) => {
            e.preventDefault();
            standardSection.style.display = 'none';
            otpSection.style.display = 'block';
        });

        // Back to standard
        backToStandardBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            otpSection.style.display = 'none';
            standardSection.style.display = 'block';
            otpResetForm.style.display = 'none';
            sendOtpBtn.style.display = 'block';
        });

        // Send OTP
        sendOtpBtn?.addEventListener('click', async () => {
            sendOtpBtn.disabled = true;
            sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            const result = await API.otp.send(adminEmail, 'reset_password');
            if (result.success) {
                showToast('Verification code sent to ' + adminEmail, 'success');
                sendOtpBtn.style.display = 'none';
                otpResetForm.style.display = 'block';
                // Initialize OTP inputs
                initOTPInputs(otpResetForm);
            } else {
                showToast(result.message || 'Failed to send code', 'error');
            }
            sendOtpBtn.disabled = false;
            sendOtpBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Verification Code';
        });

        // Handle OTP reset form
        otpResetForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const otpInputs = otpResetForm.querySelectorAll('.otp-input');
            const otp = Array.from(otpInputs).map(i => i.value).join('');
            const newPassword = document.getElementById('reset-new-password').value;
            const confirmPassword = document.getElementById('reset-confirm-password').value;

            if (otp.length !== 6) {
                showToast('Please enter the 6-digit code', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showToast('Passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showToast('Password must be at least 8 characters', 'error');
                return;
            }

            const submitBtn = otpResetForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';

            // Reset password via API
            const result = await API.otp.resetPassword(adminEmail, otp, newPassword);
            if (result.success) {
                showToast('Password reset successfully!', 'success');
                // Go back to standard view
                otpSection.style.display = 'none';
                standardSection.style.display = 'block';
                otpResetForm.style.display = 'none';
                sendOtpBtn.style.display = 'block';
                otpResetForm.reset();
            } else {
                showToast(result.message || 'Failed to reset password', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Reset Password';
        });
    }

    // ===========================================
    // SECURITY CENTER - 2FA & SECURITY LOGS
    // ===========================================
    const securitySection = document.getElementById('section-security');
    if (securitySection) {
        // Helper to get auth headers
        const getAdminAuthHeaders = () => {
            const token = getFromStorage('chommzyAdminSession', {})?.token;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            return headers;
        };

        // API endpoints for 2FA and security
        const SecurityAPI = {
            twoFactor: {
                setup: async () => {
                    try {
                        const res = await fetch('/api/two-factor.php?action=setup', {
                            method: 'POST',
                            headers: getAdminAuthHeaders(),
                            credentials: 'include'
                        });
                        return await res.json();
                    } catch { return { success: false, message: 'Network error' }; }
                },
                enable: async (code) => {
                    try {
                        const res = await fetch('/api/two-factor.php?action=enable', {
                            method: 'POST',
                            headers: getAdminAuthHeaders(),
                            credentials: 'include',
                            body: JSON.stringify({ code })
                        });
                        return await res.json();
                    } catch { return { success: false, message: 'Network error' }; }
                },
                disable: async (code, password) => {
                    try {
                        const res = await fetch('/api/two-factor.php?action=disable', {
                            method: 'POST',
                            headers: getAdminAuthHeaders(),
                            credentials: 'include',
                            body: JSON.stringify({ code, password })
                        });
                        return await res.json();
                    } catch { return { success: false, message: 'Network error' }; }
                },
                status: async () => {
                    try {
                        const res = await fetch('/api/two-factor.php?action=status', {
                            headers: getAdminAuthHeaders(),
                            credentials: 'include'
                        });
                        return await res.json();
                    } catch { return { success: false, message: 'Network error' }; }
                },
                verifyLogin: async (tempToken, code) => {
                    try {
                        const res = await fetch('/api/two-factor.php?action=verify-login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ temp_token: tempToken, code })
                        });
                        return await res.json();
                    } catch { return { success: false, message: 'Network error' }; }
                }
            },
            security: {
                logs: async (filter = '') => {
                    try {
                        const url = filter ? `/api/security-log.php?action=list&severity=${filter}` : '/api/security-log.php?action=list';
                        const res = await fetch(url, { headers: getAdminAuthHeaders(), credentials: 'include' });
                        return await res.json();
                    } catch { return { success: false, message: 'Network error' }; }
                },
                stats: async () => {
                    try {
                        const res = await fetch('/api/security-log.php?action=stats', { headers: getAdminAuthHeaders(), credentials: 'include' });
                        return await res.json();
                    } catch { return { success: false, message: 'Network error' }; }
                },
                alerts: async () => {
                    try {
                        const res = await fetch('/api/security-log.php?action=alerts', { headers: getAdminAuthHeaders(), credentials: 'include' });
                        return await res.json();
                    } catch { return { success: false, message: 'Network error' }; }
                }
            }
        };

        // 2FA UI elements
        const setup2FABtn = document.getElementById('setup-2fa-btn');
        const disable2FABtn = document.getElementById('disable-2fa-btn');
        const cancel2FASetup = document.getElementById('cancel-2fa-setup');
        const verify2FAForm = document.getElementById('verify-2fa-form');
        const disable2FAModal = document.getElementById('disable-2fa-modal');
        const disable2FAForm = document.getElementById('disable-2fa-form');

        const disabledView = document.getElementById('2fa-disabled-view');
        const setupView = document.getElementById('2fa-setup-view');
        const enabledView = document.getElementById('2fa-enabled-view');

        // Check 2FA status on load
        async function check2FAStatus() {
            const result = await SecurityAPI.twoFactor.status();
            const statusEl = document.getElementById('security-2fa-status');

            if (result.success && result.data?.enabled) {
                if (statusEl) statusEl.textContent = 'Enabled';
                if (statusEl) statusEl.style.color = '#10b981';
                disabledView.style.display = 'none';
                setupView.style.display = 'none';
                enabledView.style.display = 'block';
            } else {
                if (statusEl) statusEl.textContent = 'Disabled';
                if (statusEl) statusEl.style.color = '#ef4444';
                disabledView.style.display = 'block';
                setupView.style.display = 'none';
                enabledView.style.display = 'none';
            }
        }
        check2FAStatus();

        // Setup 2FA
        setup2FABtn?.addEventListener('click', async () => {
            setup2FABtn.disabled = true;
            setup2FABtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting up...';

            const result = await SecurityAPI.twoFactor.setup();

            if (result.success && result.data) {
                document.getElementById('2fa-qr-img').src = result.data.qr_url;
                document.getElementById('2fa-secret-key').textContent = result.data.secret;

                // Show backup codes
                const backupCodesDiv = document.getElementById('2fa-backup-codes');
                const backupCodesList = document.getElementById('backup-codes-list');
                if (result.data.backup_codes) {
                    backupCodesList.innerHTML = result.data.backup_codes.map(c => `<code style="display:inline-block;margin:2px 4px;padding:2px 6px;background:#f0f0f0;border-radius:3px;">${escapeHtml(c)}</code>`).join('');
                    backupCodesDiv.style.display = 'block';
                }

                disabledView.style.display = 'none';
                setupView.style.display = 'block';
            } else {
                showToast(result.message || 'Failed to setup 2FA', 'error');
            }

            setup2FABtn.disabled = false;
            setup2FABtn.innerHTML = '<i class="fas fa-lock"></i> Enable 2FA';
        });

        // Cancel 2FA setup
        cancel2FASetup?.addEventListener('click', () => {
            setupView.style.display = 'none';
            disabledView.style.display = 'block';
            document.getElementById('2fa-verify-code').value = '';
        });

        // Verify and enable 2FA
        verify2FAForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('2fa-verify-code').value;
            const submitBtn = verify2FAForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            const result = await SecurityAPI.twoFactor.enable(code);

            if (result.success) {
                showToast('2FA enabled successfully!', 'success');
                setupView.style.display = 'none';
                enabledView.style.display = 'block';
                document.getElementById('security-2fa-status').textContent = 'Enabled';
                document.getElementById('security-2fa-status').style.color = '#10b981';
            } else {
                showToast(result.message || 'Invalid code', 'error');
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Verify & Enable';
        });

        // Show disable 2FA modal
        disable2FABtn?.addEventListener('click', () => {
            disable2FAModal.style.display = 'flex';
        });

        // Close disable modal
        disable2FAModal?.querySelector('.modal-close')?.addEventListener('click', () => {
            disable2FAModal.style.display = 'none';
        });

        // Disable 2FA
        disable2FAForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = document.getElementById('disable-2fa-code').value;
            const password = document.getElementById('disable-2fa-password').value;
            const submitBtn = disable2FAForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Disabling...';

            const result = await SecurityAPI.twoFactor.disable(code, password);

            if (result.success) {
                showToast('2FA disabled', 'info');
                disable2FAModal.style.display = 'none';
                enabledView.style.display = 'none';
                disabledView.style.display = 'block';
                document.getElementById('security-2fa-status').textContent = 'Disabled';
                document.getElementById('security-2fa-status').style.color = '#ef4444';
                disable2FAForm.reset();
            } else {
                showToast(result.message || 'Failed to disable 2FA', 'error');
            }

            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Disable 2FA';
        });

        // Load security stats
        async function loadSecurityStats() {
            const result = await SecurityAPI.security.stats();

            if (result.success && result.data) {
                document.getElementById('security-events-today').textContent = result.data.today_count || 0;
                document.getElementById('security-failed-logins').textContent = result.data.failed_logins_today || 0;
            }
        }
        loadSecurityStats();

        // Load security alerts
        async function loadSecurityAlerts() {
            const container = document.getElementById('security-alerts-container');
            const result = await SecurityAPI.security.alerts();

            if (result.success && result.data) {
                document.getElementById('security-alerts-count').textContent = result.data.alert_count || 0;

                if (result.data.alerts && result.data.alerts.length > 0) {
                    container.innerHTML = result.data.alerts.map(alert => {
                        const severityColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
                        return `
                            <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;background:#fef3c7;border-radius:8px;margin-bottom:8px;border-left:4px solid ${severityColors[alert.severity] || '#f59e0b'};">
                                <i class="fas fa-exclamation-triangle" style="color:${severityColors[alert.severity] || '#f59e0b'};margin-top:2px;"></i>
                                <div>
                                    <div style="font-weight:600;font-size:0.9rem;">${escapeHtml(alert.message)}</div>
                                    <div style="font-size:0.8rem;color:var(--text-muted);text-transform:capitalize;">${escapeHtml(alert.type.replace(/_/g, ' '))} - ${escapeHtml(alert.severity)} severity</div>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    container.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);"><i class="fas fa-check-circle" style="color:#10b981;font-size:2rem;margin-bottom:0.5rem;display:block;"></i>No active security alerts</div>';
                }
            } else {
                container.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);">Unable to load alerts</div>';
            }
        }
        loadSecurityAlerts();

        // Load security logs
        async function loadSecurityLogs(filter = '') {
            const tbody = document.getElementById('security-logs-tbody');
            const result = await SecurityAPI.security.logs(filter);

            if (result.success && result.data?.logs) {
                if (result.data.logs.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">No security events recorded</td></tr>';
                    return;
                }

                tbody.innerHTML = result.data.logs.slice(0, 20).map(log => {
                    const severityColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
                    const timeAgo = new Date(log.created_at).toLocaleString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                    return `
                        <tr>
                            <td style="font-size:0.85rem;white-space:nowrap;">${timeAgo}</td>
                            <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(log.description)}</td>
                            <td>${log.user_name ? escapeHtml(log.user_name) : '<span style="color:var(--text-muted);">-</span>'}</td>
                            <td style="font-family:monospace;font-size:0.85rem;">${escapeHtml(log.ip_address || '-')}</td>
                            <td><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;background:${severityColors[log.severity] || '#6b7c93'}22;color:${severityColors[log.severity] || '#6b7c93'};text-transform:uppercase;">${escapeHtml(log.severity)}</span></td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted);">Unable to load security logs</td></tr>';
            }
        }
        loadSecurityLogs();

        // Filter security logs
        document.getElementById('security-log-filter')?.addEventListener('change', (e) => {
            loadSecurityLogs(e.target.value);
        });
    }
}

// ===========================================
// 17. QUICK VIEW MODAL
// ===========================================
document.body.addEventListener('click', (e) => {
    const qvBtn = e.target.closest('.quick-view-btn');
    if (qvBtn) {
        const productId = parseInt(qvBtn.dataset.id);
        const products = getProducts();
        const product = products.find(p => p.id === productId);
        if (!product) return;

        let modal = document.getElementById('quick-view-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'quick-view-modal';
            modal.className = 'modal-overlay quick-view-modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content" style="max-width:800px;">
                <button class="modal-close"><i class="fas fa-times"></i></button>
                <div class="quick-view-grid">
                    <div class="quick-view-image"><img src="${product.image}" alt="${product.name}"></div>
                    <div class="quick-view-info">
                        <div class="product-category-label">${product.category}</div>
                        <h2 style="font-size:1.4rem;margin-bottom:0.5rem;">${product.name}</h2>
                        <div class="product-rating" style="margin-bottom:1rem;">
                            <span class="stars">${renderStars(product.rating)}</span>
                            <span class="count">(${product.reviews} reviews)</span>
                        </div>
                        <div class="product-detail-price" style="border:none;padding:0;margin-bottom:1rem;">
                            <span class="current-price">${formatPrice(product.price)}</span>
                            ${product.originalPrice ? `<span class="old-price">${formatPrice(product.originalPrice)}</span>` : ''}
                        </div>
                        <p style="color:var(--text-secondary);font-size:0.92rem;margin-bottom:1.5rem;">${product.description}</p>
                        <div style="display:flex;gap:10px;">
                            <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}" style="flex:1;">Add to Cart</button>
                            <a href="product-detail?id=${product.id}" class="btn btn-outline">View Details</a>
                        </div>
                    </div>
                </div>
            </div>`;

        requestAnimationFrame(() => modal.classList.add('active'));
        modal.querySelector('.modal-close').addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    }
});

// ===========================================
// 18. BACK TO TOP & WHATSAPP
// ===========================================
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 400);
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===========================================
// 19. NEWSLETTER FORM
// ===========================================
document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]');
        const btn = form.querySelector('button');

        if (!email || !email.value) {
            showToast('Please enter your email', 'error');
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const response = await fetch('/api/newsletter.php?action=subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.value, source: 'website_footer' })
            });

            const result = await response.json();

            if (result.success) {
                showToast(result.message || 'Thank you for subscribing!', 'success');
                email.value = '';
            } else {
                showToast(result.message || 'Subscription failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Newsletter error:', error);
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
});

// ===========================================
// ADMIN SUBSCRIBERS MANAGEMENT
// ===========================================
const subsSection = document.getElementById('section-subscribers');
if (subsSection) {
    const subsTable = document.getElementById('subscribers-tbody');
    const subsSearch = document.getElementById('subs-search');
    const subsFilter = document.getElementById('subs-status-filter');
    const exportBtn = document.getElementById('export-subs-btn');
    const refreshBtn = document.getElementById('refresh-subs-btn');
    const pagination = document.getElementById('subs-pagination');

    let currentPage = 1;
    let currentStatus = 'active';

    const getSubsHeaders = () => {
        const token = getFromStorage('chommzyAdminSession', {})?.token;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    };

    // Load subscriber stats
    async function loadSubsStats() {
        try {
            const res = await fetch(`/api/newsletter.php?action=stats`, {
                headers: getSubsHeaders(),
                credentials: 'include'
            });
            const result = await res.json();
            if (result.success && result.data) {
                document.getElementById('stat-active-subs').textContent = result.data.active || 0;
                document.getElementById('stat-week-subs').textContent = result.data.this_week || 0;
                document.getElementById('stat-month-subs').textContent = result.data.this_month || 0;
                document.getElementById('stat-unsub').textContent = result.data.unsubscribed || 0;
            }
        } catch (e) { console.error('Failed to load subscriber stats:', e); }
    }

    // Load subscribers list
    async function loadSubscribers(page = 1, status = 'active', search = '') {
        currentPage = page;
        currentStatus = status;
        subsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

        try {
            let url = `/api/newsletter.php?action=list&page=${page}&status=${status}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            const res = await fetch(url, {
                headers: getSubsHeaders(),
                credentials: 'include'
            });
            const result = await res.json();

            if (result.success && result.data) {
                const subs = result.data.subscribers || [];
                if (subs.length === 0) {
                    subsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#6b7c93;">No subscribers found</td></tr>';
                } else {
                    subsTable.innerHTML = subs.map(sub => `
                        <tr>
                            <td><strong>${escapeHtml(sub.email)}</strong></td>
                            <td><span class="status-badge status-${sub.status === 'active' ? 'confirmed' : 'cancelled'}">${sub.status}</span></td>
                            <td>${escapeHtml(sub.source || 'website')}</td>
                            <td>${new Date(sub.subscribed_at).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-outline btn-sm delete-sub-btn" data-id="${sub.id}" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('');

                    // Add delete handlers
                    subsTable.querySelectorAll('.delete-sub-btn').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            if (!confirm('Delete this subscriber?')) return;
                            const id = btn.dataset.id;
                            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                            try {
                                const res = await fetch(`/api/newsletter.php?action=delete`, {
                                    method: 'POST',
                                    headers: getSubsHeaders(),
                                    credentials: 'include',
                                    body: JSON.stringify({ id: parseInt(id) })
                                });
                                const result = await res.json();
                                if (result.success) {
                                    showToast('Subscriber deleted', 'success');
                                    loadSubscribers(currentPage, currentStatus, subsSearch.value);
                                    loadSubsStats();
                                } else {
                                    showToast(result.message || 'Failed to delete', 'error');
                                    btn.innerHTML = '<i class="fas fa-trash"></i>';
                                }
                            } catch { showToast('Network error', 'error'); btn.innerHTML = '<i class="fas fa-trash"></i>'; }
                        });
                    });
                }

                // Render pagination
                const pag = result.data.pagination;
                if (pag && pag.pages > 1) {
                    let pagHtml = '';
                    for (let i = 1; i <= pag.pages; i++) {
                        pagHtml += `<button class="btn ${i === pag.page ? 'btn-primary' : 'btn-outline'} btn-sm page-btn" data-page="${i}">${i}</button>`;
                    }
                    pagination.innerHTML = pagHtml;
                    pagination.querySelectorAll('.page-btn').forEach(btn => {
                        btn.addEventListener('click', () => loadSubscribers(parseInt(btn.dataset.page), currentStatus, subsSearch.value));
                    });
                } else {
                    pagination.innerHTML = '';
                }
            } else {
                subsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#ef4444;">Failed to load subscribers</td></tr>';
            }
        } catch (e) {
            console.error('Failed to load subscribers:', e);
            subsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#ef4444;">Network error</td></tr>';
        }
    }

    // Event listeners
    if (subsFilter) {
        subsFilter.addEventListener('change', () => loadSubscribers(1, subsFilter.value, subsSearch.value));
    }

    if (subsSearch) {
        let searchTimeout;
        subsSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadSubscribers(1, subsFilter.value, subsSearch.value), 300);
        });
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadSubscribers(currentPage, currentStatus, subsSearch.value);
            loadSubsStats();
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const status = subsFilter.value;
            const token = getFromStorage('chommzyAdminSession', {})?.token || '';
            window.location.href = `/api/newsletter.php?action=export&status=${status}&token=${token}`;
        });
    }

    // Load on section view
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.addEventListener('click', () => {
            if (link.dataset.section === 'section-subscribers') {
                loadSubsStats();
                loadSubscribers(1, 'active', '');
            }
        });
    });
}

// ===========================================
// 20. INITIALIZE
// ===========================================
updateHeader();

// Intersection Observer for animations
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.product-card, .category-card, .testimonial-card, .stat-card').forEach(el => {
    observer.observe(el);
});

}); // End DOMContentLoaded
