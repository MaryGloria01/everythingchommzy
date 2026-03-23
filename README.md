# Everything Chommzy

A modern, fully responsive e-commerce platform for premium wigs, fashion, shoes, and accessories. Built with vanilla HTML, CSS, JavaScript, and PHP backend.

![Everything Chommzy](https://img.shields.io/badge/Status-Live-brightgreen) ![PHP](https://img.shields.io/badge/PHP-8.0+-blue) ![License](https://img.shields.io/badge/License-Proprietary-red)

## Features

### Customer Features
- **Product Browsing** - Browse products by category (Wigs, Clothing, Shoes, Accessories)
- **User Authentication** - Secure signup/login with email OTP verification
- **Two-Factor Authentication** - Optional 2FA using Google Authenticator (TOTP)
- **Password Recovery** - Email-based password reset with OTP
- **Shopping Cart** - Add, remove, and manage cart items
- **Wishlist** - Save favorite products for later
- **Order Tracking** - Track order status and history
- **Referral System** - Earn rewards by referring friends

### Admin Features
- **Dashboard** - Overview of sales, orders, and customer stats
- **Product Management** - Add, edit, and delete products
- **Order Management** - View and update order statuses
- **Customer Management** - View customer details and order history
- **Analytics** - Sales reports and customer insights

### Security Features
- JWT-based authentication with httpOnly cookies
- Strong password requirements (8+ chars, uppercase, lowercase, number, special character)
- OTP email verification via Resend API
- TOTP-based Two-Factor Authentication
- SQL injection prevention with prepared statements
- XSS protection with input sanitization
- CSRF token validation
- Rate limiting on sensitive endpoints
- HTTPS enforcement in production

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: PHP 8.0+
- **Database**: MySQL
- **Email Service**: Resend API
- **Hosting**: Hostinger
- **CDN/Security**: Cloudflare

## Installation

### Prerequisites
- PHP 8.0 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx)
- SSL certificate (for HTTPS)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MaryGloria01/everythingchommzy.git
   cd everythingchommzy
   ```

2. **Configure the database**
   - Create a MySQL database
   - Copy `api/config.example.php` to `api/config.php`
   - Update database credentials in `api/config.php`:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'your_database_name');
     define('DB_USER', 'your_database_user');
     define('DB_PASS', 'your_database_password');
     ```

3. **Configure site settings**
   - Update `SITE_URL` in `api/config.php`
   - Generate a strong `JWT_SECRET`
   - Set up Resend API key in `api/otp.php` for email functionality

4. **Set up the database tables**
   - Tables are auto-created on first API call
   - Or import the provided SQL schema if available

5. **Configure your web server**
   - Point document root to the project folder
   - Ensure `.htaccess` is enabled (Apache) or configure URL rewriting (Nginx)

6. **Set file permissions**
   ```bash
   chmod 755 api/
   chmod 644 api/*.php
   ```

## Project Structure

```
everythingchommzy/
├── api/                    # Backend API endpoints
│   ├── config.php          # Database & app configuration (not in repo)
│   ├── config.example.php  # Configuration template
│   ├── auth.php            # Authentication endpoints
│   ├── products.php        # Product management
│   ├── orders.php          # Order management
│   ├── users.php           # User management
│   ├── otp.php             # OTP email verification
│   └── two-factor.php      # 2FA management
├── home.html               # Homepage
├── products.html           # Product listing
├── product-detail.html     # Single product view
├── cart.html               # Shopping cart
├── checkout.html           # Checkout page
├── account.html            # User account/dashboard
├── login.html              # Login page
├── signup.html             # Registration page
├── contact.html            # Contact page
├── faq.html                # FAQ page
├── chommzy.css             # Main stylesheet
├── chommzy.js              # Main JavaScript file
└── README.md               # This file
```

## API Endpoints

### Authentication
- `POST /api/auth.php?action=register` - User registration
- `POST /api/auth.php?action=login` - User login
- `POST /api/auth.php?action=logout` - User logout

### OTP Verification
- `POST /api/otp.php?action=send` - Send OTP email
- `POST /api/otp.php?action=verify` - Verify OTP
- `POST /api/otp.php?action=reset-password` - Reset password

### Two-Factor Authentication
- `POST /api/two-factor.php?action=setup` - Generate 2FA secret
- `POST /api/two-factor.php?action=enable` - Enable 2FA
- `POST /api/two-factor.php?action=verify` - Verify 2FA code
- `POST /api/two-factor.php?action=disable` - Disable 2FA

### Products
- `GET /api/products.php?action=list` - Get all products
- `GET /api/products.php?action=get&id={id}` - Get single product
- `POST /api/products.php?action=add` - Add product (Admin)
- `POST /api/products.php?action=update` - Update product (Admin)
- `POST /api/products.php?action=delete` - Delete product (Admin)

### Orders
- `POST /api/orders.php?action=create` - Create order
- `GET /api/orders.php?action=list` - Get user orders
- `GET /api/orders.php?action=get&id={id}` - Get order details

## Environment Variables

Create `api/config.php` from the example file and configure:

| Variable | Description |
|----------|-------------|
| `DB_HOST` | Database host (usually localhost) |
| `DB_NAME` | Database name |
| `DB_USER` | Database username |
| `DB_PASS` | Database password |
| `SITE_URL` | Your website URL |
| `JWT_SECRET` | Secret key for JWT tokens |
| `PRODUCTION_MODE` | Set to true in production |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## Performance Optimizations

- Lazy loading for images
- CSS and JS minification ready
- Optimized font loading with preconnect
- Efficient database queries with indexes
- Caching headers for static assets

## Security Recommendations

1. Always use HTTPS in production
2. Keep PHP and MySQL updated
3. Use strong, unique passwords
4. Enable Cloudflare for DDoS protection
5. Regularly backup your database
6. Monitor security logs

## License

This project is proprietary software. All rights reserved.

## Contact

- **Website**: [everythingchommzy.com](https://everythingchommzy.com)
- **Email**: support@everythingchommzy.com
- **WhatsApp**: +234 706 271 9113

---

*Built as a birthday gift for Chommzy*
