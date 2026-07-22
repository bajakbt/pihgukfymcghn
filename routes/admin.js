// routes/admin.js

const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

module.exports = (db) => {

    const router = express.Router();

    // ========================================
    // DASHBOARD
    // ========================================

    router.get("/dashboard", auth, admin, (req, res) => {

        const stats = {};

        db.get("SELECT COUNT(*) AS total FROM users", [], (err, users) => {

            if (err)
                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            stats.users = users.total;

            db.get("SELECT COUNT(*) AS total FROM products", [], (err, products) => {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                stats.products = products.total;

                db.get("SELECT COUNT(*) AS total FROM orders", [], (err, orders) => {

                    if (err)
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });

                    stats.orders = orders.total;

                    db.get("SELECT COUNT(*) AS total FROM deposits WHERE status='Pending'", [], (err, deposits) => {

                        if (err)
                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        stats.pendingDeposits = deposits.total;

                        db.get("SELECT SUM(balance) AS total FROM users", [], (err, balance) => {

                            if (err)
                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });

                            stats.totalBalance = balance.total || 0;

                            res.json({
                                success: true,
                                dashboard: stats
                            });

                        });

                    });

                });

            });

        });

    });

    // ========================================
    // USERS
    // ========================================

    router.get("/users", auth, admin, (req, res) => {

        db.all(
            "SELECT * FROM users ORDER BY id DESC",
            [],
            (err, rows) => {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                res.json({
                    success: true,
                    users: rows
                });

            }
        );

    });

    // ========================================
    // USER DETAILS
    // ========================================

    router.get("/users/:id", auth, admin, (req, res) => {

        db.get(
            "SELECT * FROM users WHERE id=?",
            [req.params.id],
            (err, user) => {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (!user)
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });

                res.json({
                    success: true,
                    user
                });

            }
        );

    });

    // ========================================
    // ADD BALANCE
    // ========================================
    router.post("/users/:id/add-balance", auth, admin, (req, res) => {

        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        db.get(
            "SELECT * FROM users WHERE id=?",
            [req.params.id],
            (err, user) => {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (!user)
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });

                const before = Number(user.balance);
                const after = before + Number(amount);

                db.run(
                    "UPDATE users SET balance=? WHERE id=?",
                    [after, req.params.id],
                    (err) => {

                        if (err)
                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        db.run(
                            "INSERT INTO wallet_transactions (user_id,type,amount,balance_before,balance_after,description) VALUES (?,?,?,?,?,?)",
                            [
                                req.params.id,
                                "Admin Credit",
                                amount,
                                before,
                                after,
                                "Balance added by admin"
                            ]
                        );

                        res.json({
                            success: true,
                            message: "Balance added successfully",
                            balance: after
                        });

                    }
                );

            }
        );

    });

    // ========================================
    // REMOVE BALANCE
    // ========================================

    router.post("/users/:id/remove-balance", auth, admin, (req, res) => {

        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        db.get(
            "SELECT * FROM users WHERE id=?",
            [req.params.id],
            (err, user) => {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (!user)
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });

                const before = Number(user.balance);

                if (before < Number(amount)) {
                    return res.status(400).json({
                        success: false,
                        message: "Insufficient balance"
                    });
                }

                const after = before - Number(amount);

                db.run(
                    "UPDATE users SET balance=? WHERE id=?",
                    [after, req.params.id],
                    (err) => {

                        if (err)
                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        db.run(
                            "INSERT INTO wallet_transactions (user_id,type,amount,balance_before,balance_after,description) VALUES (?,?,?,?,?,?)",
                            [
                                req.params.id,
                                "Admin Debit",amount,
                                before,
                                after,
                                "Balance removed by admin"
                            ]
                        );

                        res.json({
                            success: true,
                            message: "Balance removed successfully",
                            balance: after
                        });

                    }
                );

            }
        );

    });

    // ========================================
    // UPDATE USER STATUS
    // ========================================
    router.put("/users/:id/status", auth, admin, (req, res) => {

        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        db.run(
            "UPDATE users SET status=? WHERE id=?",
            [status, req.params.id],
            function (err) {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (this.changes === 0)
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });

                res.json({
                    success: true,
                    message: "User status updated"
                });

            }
        );

    });

    // ========================================
    // UPDATE USER ROLE
    // ========================================

    router.put("/users/:id/role", auth, admin, (req, res) => {

        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: "Role is required"
            });
        }

        db.run(
            "UPDATE users SET role=? WHERE id=?",
            [role, req.params.id],
            function (err) {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (this.changes === 0)
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });

                res.json({
                    success: true,
                    message: "User role updated"
                });

            }
        );

    });

    // ========================================
    // DELETE USER
    // ========================================

    router.delete("/users/:id", auth, admin, (req, res) => {

        db.run(
            "DELETE FROM users WHERE id=?",
            [req.params.id],
            function (err) {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (this.changes === 0)
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });

                res.json({
                    success: true,
                    message: "User deleted successfully"
                });

            }
        );

    });

    // ========================================
    // ALL PRODUCTS
    // ========================================

    router.get("/products", auth, admin, (req, res) => {

        db.all(
            "SELECT * FROM products ORDER BY id DESC",
            [],
            (err, rows) => {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                res.json({
                    success: true,
                    products: rows
                });

            }
        );

    });

    // ========================================
    // ADD PRODUCT
    // ========================================
    router.post("/products", auth, admin, (req, res) => {

        const {
            name,
            category,
            description,
            image,
            price,
            stock,
            game_id_required
        } = req.body;

        if (!name || !price) {
            return res.status(400).json({
                success: false,
                message: "Name and price are required"
            });
        }

        db.run(
            `INSERT INTO products
            (name,category,description,image,price,stock,game_id_required)
            VALUES (?,?,?,?,?,?,?)`,
            [
                name,
                category || "",
                description || "",
                image || "",
                price,
                stock || 999999,
                game_id_required ? 1 : 0
            ],
            function (err) {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                res.json({
                    success: true,
                    message: "Product added successfully",
                    product_id: this.lastID
                });

            }
        );

    });

    // ========================================
    // UPDATE PRODUCT
    // ========================================

    router.put("/products/:id", auth, admin, (req, res) => {

        const {
            name,
            category,
            description,
            image,
            price,
            stock,
            status,
            game_id_required
        } = req.body;

        db.run(
            `UPDATE products
            SET
                name=?,
                category=?,
                description=?,
                image=?,
                price=?,
                stock=?,
                status=?,
                game_id_required=?
            WHERE id=?`,
            [
                name,
                category,
                description,
                image,
                price,
                stock,
                status,
                game_id_required ? 1 : 0,
                req.params.id
            ],
            function (err) {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (this.changes === 0)
                    return res.status(404).json({
                        success: false,
                        message: "Product not found"
                    });

                res.json({
                    success: true,
                    message: "Product updated"
                });

            }
        );

    });

    // ========================================
    // DELETE PRODUCT
    // ========================================

    router.delete("/products/:id", auth, admin, (req, res) => {

        db.run(
            "DELETE FROM products WHERE id=?",
            [req.params.id],
            function (err) {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (this.changes === 0)
                    return res.status(404).json({
                        success: false,
                        message: "Product not found"
                    });

                res.json({
                    success: true,
                    message: "Product deleted"
                });

            }
        );

    });

    // ========================================
    // ALL CATEGORIES
    // ========================================

    router.get("/categories", auth, admin, (req, res) => {

        db.all(
            "SELECT * FROM categories ORDER BY id DESC",
            [],
            (err, rows) => {

                if (err)
                    return res.status(500).json({success: false,
                        message: err.message
                    });

                res.json({
                    success: true,
                    categories: rows
                });

            }
        );

    });

    // ========================================
    // ========================================
    // ========================================
    // UPDATE ORDER STATUS
    // ========================================

    router.put("/orders/:id/status", auth, admin, (req, res) => {

        const { status, note } = req.body;

        db.run(
            "UPDATE orders SET status=?, note=? WHERE id=?",
            [
                status,
                note || "",
                req.params.id
            ],
            function (err) {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (this.changes === 0)
                    return res.status(404).json({
                        success: false,
                        message: "Order not found"
                    });

                res.json({
                    success: true,
                    message: "Order updated"
                });

            }
        );

    });

    // ========================================
    // PENDING DEPOSITS
    // ========================================

    router.get("/deposits", auth, admin, (req, res) => {

        db.all(
            "SELECT * FROM deposits ORDER BY id DESC",
            [],
            (err, rows) => {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                res.json({
                    success: true,
                    deposits: rows
                });

            }
        );

    });

    // ========================================
    // APPROVE DEPOSIT
    // ========================================
    router.post("/deposits/:id/approve", auth, admin, (req, res) => {

        db.get(
            "SELECT * FROM deposits WHERE id=?",
            [req.params.id],
            (err, deposit) => {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (!deposit)
                    return res.status(404).json({
                        success: false,
                        message: "Deposit not found"
                    });

                if (deposit.status === "Approved")
                    return res.status(400).json({
                        success: false,
                        message: "Deposit already approved"
                    });

                db.get(
                    "SELECT * FROM users WHERE id=?",
                    [deposit.user_id],
                    (err, user) => {

                        if (err)
                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        const before = Number(user.balance);
                        const after = before + Number(deposit.amount);

                        db.run(
                            "UPDATE users SET balance=? WHERE id=?",
                            [after, deposit.user_id],
                            (err) => {

                                if (err)
                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });

                                db.run(
                                    "UPDATE deposits SET status='Approved' WHERE id=?",
                                    [deposit.id]
                                );

                                db.run(
                                    "INSERT INTO wallet_transactions (user_id,type,amount,balance_before,balance_after,description) VALUES (?,?,?,?,?,?)",
                                    [
                                        deposit.user_id,
                                        "Deposit",
                                        deposit.amount,
                                        before,
                                        after,
                                        "Approved by Admin"
                                    ]
                                );

                                res.json({
                                    success: true,
                                    message: "Deposit approved"
                                });

                            }
                        );

                    }
                );

            }
        );

    });

    // ========================================
    // REJECT DEPOSIT
    // ========================================

    router.post("/deposits/:id/reject", auth, admin, (req, res) => {

        db.run(
            "UPDATE deposits SET status='Rejected' WHERE id=?",
            [req.params.id],
            function (err) {

                if (err)
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                if (this.changes === 0)
                    return res.status(404).json({
                        success: false,
                        message: "Deposit not found"
                    });

                res.json({
                    success: true,
                    message: "Deposit rejected"
                });

            }
        );

    });

    // ========================================
    // SYSTEM STATISTICS
    // ========================================

    router.get("/statistics", auth, admin, (req, res) => {

        const stats = {};

        db.get("SELECT COUNT(*) AS total FROM users", [], (err, users) => {

            if (err)
                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            stats.users = users.total;

            db.get("SELECT COUNT(*) AS total FROM products", [], (err, products) => {

                stats.products = products.total;

                db.get("SELECT COUNT(*) AS total FROM categories", [], (err, categories) => {

                    stats.categories = categories.total;

                    db.get("SELECT COUNT(*) AS total FROM orders", [], (err, orders) => {

                        stats.orders = orders.total;

                        db.get("SELECT COUNT(*) AS total FROM deposits", [], (err, deposits) => {

                            stats.deposits = deposits.total;

                            res.json({
                                success: true,
                                statistics: stats
                            });

                        });

                    });

                });

            });

        });

    });

    return router;

};