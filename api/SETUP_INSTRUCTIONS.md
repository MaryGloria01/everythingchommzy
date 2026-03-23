# Everything Chommzy - Database Setup Instructions

## Step 1: Create Database on Hostinger

1. Log in to your Hostinger hPanel
2. Go to **Databases** > **MySQL Databases**
3. Create a new database (e.g., `u123456789_chommzy`)
4. Note down:
   - Database name
   - Database username
   - Database password

## Step 2: Import Database Schema

1. Go to **Databases** > **phpMyAdmin**
2. Select your database
3. Click on **Import** tab
4. Upload the `database_setup.sql` file from the `api` folder
5. Click **Go** to import

## Step 3: Update Configuration

Edit `api/config.php` and update these values:

```php
define('DB_HOST', 'localhost');  // Usually 'localhost' on Hostinger
define('DB_NAME', 'u123456789_chommzy');  // Your database name
define('DB_USER', 'u123456789_chommzy');  // Your database username
define('DB_PASS', 'your_password_here');  // Your database password

// Update your site URL
define('SITE_URL', 'https://everythingchommzy.com');

// IMPORTANT: Change this secret key!
define('JWT_SECRET', 'your-super-secret-key-change-this');
```

## Step 4: Upload Files

Upload your entire website to the `public_html` folder on Hostinger via:
- File Manager in hPanel, OR
- FTP client (FileZilla, etc.)

## Step 5: Set Permissions

Make sure the `api` folder has proper permissions:
- Folders: 755
- PHP files: 644

## Step 6: Test the API

Visit these URLs to test:
- `https://yourdomain.com/api/test.php` - Should show API status
- `https://yourdomain.com/api/products.php?action=list` - Should return products

## Default Admin Login

After setup, log in with:
- **Email:** admin@everythingchommzy.com
- **Password:** admin123

**IMPORTANT:** Change this password immediately after first login!

## API Endpoints

### Authentication
- `POST /api/auth.php?action=login` - User login
- `POST /api/auth.php?action=signup` - User registration
- `POST /api/auth.php?action=admin-login` - Admin login

### Products
- `GET /api/products.php?action=list` - List all products
- `POST /api/products.php?action=create` - Create product (admin)
- `POST /api/products.php?action=update` - Update product (admin)
- `POST /api/products.php?action=delete` - Delete product (admin)

### Orders
- `GET /api/orders.php?action=list` - List all orders (admin)
- `GET /api/orders.php?action=user-orders` - User's orders
- `POST /api/orders.php?action=create` - Create order
- `POST /api/orders.php?action=update-status` - Update status (admin)
- `POST /api/orders.php?action=confirm-receipt` - Customer confirms receipt

### Notifications
- `GET /api/notifications.php?action=list` - User's notifications
- `POST /api/notifications.php?action=mark-read` - Mark as read
- `POST /api/notifications.php?action=send-announcement` - Send to all (admin)
- `GET /api/notifications.php?action=announcements` - List announcements (admin)

### Bank Accounts
- `GET /api/bank.php?action=list` - List bank accounts
- `POST /api/bank.php?action=create` - Add bank account (admin)

### Referrals
- `GET /api/referrals.php?action=list` - All referrals (admin)
- `GET /api/referrals.php?action=user-referrals` - User's referrals

## Troubleshooting

### "Database connection failed"
- Check database credentials in `config.php`
- Verify database exists in phpMyAdmin

### "401 Unauthorized"
- User token expired, need to login again
- Check if Authorization header is being sent

### Orders/Notifications not syncing
- Clear browser localStorage
- Check browser console for API errors
- Verify API endpoints are accessible

## Local Development

The website automatically detects if running locally (file:// or localhost) and uses localStorage instead of the API. This allows testing without a database connection.
