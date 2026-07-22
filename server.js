require("dotenv").config();
// ============================================
// CardBridge Backend Server
// Version 1.0.0
// ============================================

// ============================================
// IMPORTS
// ============================================

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const categoryRoutes = require("./routes/categories");
const walletRoutes = require("./routes/wallet");
const ordersRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const supportRoutes = require("./routes/support");
const notificationsRoutes = require("./routes/notifications");
const couponsRoutes = require("./routes/coupons");
const broadcastsRoutes = require("./routes/broadcasts");
const settingsRoutes = require("./routes/settings");
const logsRoutes = require("./routes/logs");
const databaseRoutes = require("./routes/database");

// ============================================
// APP
// ============================================

const app = express();
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});
const PORT = process.env.PORT || 3000;
const JWT_SECRET = "process.env.JWT_SECRET";
const SALT_ROUNDS = 10;

// ============================================
// MIDDLEWARES
// ============================================

app.use(express.json());

app.use(express.urlencoded({

    extended: true

}));

// ============================================
// STATIC FILES
// ============================================

app.use(express.static(__dirname));

// ============================================
// UPLOADS FOLDER
// ============================================

const uploadsFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsFolder)) {

    fs.mkdirSync(uploadsFolder);

}

// ============================================
// DATABASE
// ============================================

const db = new sqlite3.Database(

    path.join(__dirname, "database.db"),

    (err) => {

        if (err) {

            console.log("❌ Database Error");
            console.log(err.message);

        } else {

            console.log("✅ SQLite Connected");

        }

    }

);

// ============================================
// CREATE TABLES
// ============================================

db.serialize(() => {

    // ========================================
    // USERS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS users(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            telegram_id TEXT,

            username TEXT,

            first_name TEXT,

            last_name TEXT,

            email TEXT UNIQUE,

            password TEXT,

            balance REAL DEFAULT 0,

            role TEXT DEFAULT 'Customer',

            status TEXT DEFAULT 'Active',

            country TEXT,

            language TEXT DEFAULT 'en',

            referral_code TEXT,

            referred_by TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Users Table Ready");
    // ========================================
    // PRODUCTS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS products(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            category TEXT,

            description TEXT,

            image TEXT,

            price REAL,

            stock INTEGER DEFAULT 999999,

            status TEXT DEFAULT 'Available',

            game_id_required INTEGER DEFAULT 0,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Products Table Ready");



    // ========================================
    // CATEGORIES
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS categories(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT UNIQUE,

            icon TEXT,

            image TEXT,

            rate REAL DEFAULT 100,

            status TEXT DEFAULT 'Visible',

            game_id_required INTEGER DEFAULT 0,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Categories Table Ready");



    // ========================================
    // ORDERS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS orders(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            product_id INTEGER,

            product_name TEXT,

            quantity INTEGER,

            total REAL,

            game_id TEXT,

            status TEXT DEFAULT 'Pending',

            note TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Orders Table Ready");
    // ========================================
    // WALLET TRANSACTIONS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS wallet_transactions(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            type TEXT,

            amount REAL,

            balance_before REAL,

            balance_after REAL,

            description TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Wallet Transactions Table Ready");



    // ========================================
    // DEPOSITS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS deposits(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            amount REAL,

            method TEXT,

            txid TEXT,

            status TEXT DEFAULT 'Pending',

            admin_note TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Deposits Table Ready");



    // ========================================
    // COUPONS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS coupons(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            code TEXT UNIQUE,

            discount REAL,

            min_order REAL DEFAULT 0,

            max_uses INTEGER DEFAULT 0,

            used_count INTEGER DEFAULT 0,

            status TEXT DEFAULT 'Active',

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Coupons Table Ready");



    // ========================================
    // SUPPORT TICKETS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS support_tickets(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            subject TEXT,

            status TEXT DEFAULT 'Open',

            priority TEXT DEFAULT 'Normal',

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Support Tickets Table Ready");



    // ========================================
    // CHAT MESSAGES
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS chat_messages(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            ticket_id INTEGER,

            sender TEXT,

            message TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Chat Messages Table Ready");
    // ========================================
    // NOTIFICATIONS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS notifications(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            title TEXT,

            message TEXT,

            is_read INTEGER DEFAULT 0,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Notifications Table Ready");



    // ========================================
    // SETTINGS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS settings(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            setting_key TEXT UNIQUE,

            setting_value TEXT,

            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Settings Table Ready");



    // ========================================
    // LOGS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS logs(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            action TEXT,

            ip_address TEXT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Logs Table Ready");



    // ========================================
    // BROADCASTS
    // ========================================

    db.run(`

        CREATE TABLE IF NOT EXISTS broadcasts(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            title TEXT,

            message TEXT,

            sent_by INTEGER,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP

        )

    `);

    console.log("✅ Broadcasts Table Ready");

});
// ============================================
// API ROUTES
// ============================================
const authRouter = authRoutes(db, JWT_SECRET, SALT_ROUNDS);
app.use("/api/auth", authRouter);
app.use("/api/products", productRoutes(db));
app.use("/api/categories", categoryRoutes(db));
app.use("/api/wallet", walletRoutes(db));
app.use("/api/orders", ordersRoutes(db));
app.use("/api/admin", adminRoutes(db));
app.use("/api/support", supportRoutes(db));
app.use("/api/notifications", notificationsRoutes(db));
app.use("/api/coupons", couponsRoutes(db));
app.use("/api/broadcasts", broadcastsRoutes(db));
app.use("/api/settings", settingsRoutes(db));
app.use("/api/logs", logsRoutes(db));
app.use("/api/database", databaseRoutes(db));

// ============================================
// START SERVER
// ============================================


app.use((req, res) => {

    res.status(404).json({

        success: false,
        message: "Route not found."

    });

});
app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({

        success: false,
        message: "Internal Server Error"

    });

});
app.listen(PORT, () => {
    console.log(`🚀 CardBridge Server running on port ${PORT}`);
});
