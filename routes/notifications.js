// ============================================
// NOTIFICATIONS ROUTES
// ============================================

const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

module.exports = (db) => {

    const router = express.Router();

    // ========================================
    // GET MY NOTIFICATIONS
    // ========================================

    router.get("/", auth, (req, res) => {

        db.all(

            `
            SELECT *
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,

            [req.user.id],

            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({

                    success: true,
                    total: rows.length,
                    notifications: rows

                });

            }

        );

    });

    // ========================================
    // GET UNREAD COUNT
    // ========================================

    router.get("/unread/count", auth, (req, res) => {

        db.get(

            `
            SELECT COUNT(*) AS unread
            FROM notifications
            WHERE user_id = ?
            AND is_read = 0
            `,

            [req.user.id],

            (err, row) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({

                    success: true,
                    unread: row.unread

                });

            }

        );

    });

    // ========================================
    // MARK ALL AS READ
    // ========================================

    router.put("/read/all", auth, (req, res) => {

        db.run(

            `
            UPDATE notifications
            SET is_read = 1
            WHERE user_id = ?
            `,

            [req.user.id],

            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({

                    success: true,
                    updated: this.changes,
                    message: "All notifications marked as read."

                });

            }

        );

    });

    // ========================================
    // ADMIN CREATE NOTIFICATION
    // ========================================
    router.post("/", auth, admin, (req, res) => {

        const {
            user_id,
            title,
            message
        } = req.body;

        if (!user_id || !title || !message) {

            return res.status(400).json({
                success: false,
                message: "user_id, title and message are required."
            });

        }

        db.run(

            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message
            )
            VALUES
            (
                ?,
                ?,
                ?
            )
            `,

            [
                user_id,
                title.trim(),
                message.trim()
            ],

            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({

                    success: true,
                    notification_id: this.lastID,
                    message: "Notification created successfully."

                });

            }

        );

    });

    // ========================================
    // ADMIN BROADCAST
    // ========================================

    router.post("/broadcast", auth, admin, (req, res) => {

        const {
            title,
            message
        } = req.body;

        if (!title || !message) {

            return res.status(400).json({
                success: false,
                message: "Title and message are required."
            });

        }

        db.all(

            `
            SELECT id
            FROM users
            WHERE status = 'Active'
            `,

            [],

            (err, users) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                const stmt = db.prepare(

                    `
                    INSERT INTO notifications
                    (
                        user_id,
                        title,
                        message
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        ?
                    )
                    `

                );

                users.forEach((user) => {

                    stmt.run(

                        user.id,
                        title.trim(),
                        message.trim()

                    );

                });

                stmt.finalize((finalizeError) => {

                    if (finalizeError) {

                        return res.status(500).json({
                            success: false,
                            message: finalizeError.message
                        });

                    }

                    db.run(

                        `
                        INSERT INTO broadcasts
                        (
                            title,
                            message,
                            sent_by
                        )
                        VALUES
                        (
                            ?,
                            ?,
                            ?
                        )
                        `,

                        [
                            title.trim(),
                            message.trim(),
                            req.user.id
                        ],

                        (insertError) => {

                            if (insertError) {

                                return res.status(500).json({
                                    success: false,
                                    message: insertError.message
                                });

                            }

                            res.json({success: true,
                                sent: users.length,
                                message: "Broadcast sent successfully."

                            });

                        }

                    );

                });

            }

        );

    });

    // ========================================
    // ADMIN GET ALL NOTIFICATIONS
    // ========================================
    // ========================================
    // ADMIN GET ALL NOTIFICATIONS
    // ========================================

    router.get("/admin/all", auth, admin, (req, res) => {

        db.all(

            `
            SELECT
                notifications.*,
                users.username,
                users.first_name,
                users.email
            FROM notifications
            LEFT JOIN users
                ON users.id = notifications.user_id
            ORDER BY notifications.created_at DESC
            `,

            [],

            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({

                    success: true,
                    total: rows.length,
                    notifications: rows

                });

            }

        );

    });

    // ========================================
    // ADMIN GET USER NOTIFICATIONS
    // ========================================

    router.get("/admin/user/:userId", auth, admin, (req, res) => {

        db.all(

            `
            SELECT *
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,

            [

                req.params.userId

            ],

            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({

                    success: true,
                    total: rows.length,
                    notifications: rows

                });

            }

        );

    });

    // ========================================
    // ADMIN STATISTICS
    // ========================================

    router.get("/admin/statistics", auth, admin, (req, res) => {

        db.get(

            `
            SELECT

                COUNT(*) AS total,

                SUM(
                    CASE
                        WHEN is_read = 0 THEN 1
                        ELSE 0
                    END
                ) AS unread

            FROM notifications
            `,

            [],

            (err, row) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({

                    success: true,
                    statistics: row

                });

            }

        );

    });

    // ========================================
    // ADMIN DELETE USER NOTIFICATIONS
    // ========================================
    router.delete("/admin/user/:userId", auth, admin, (req, res) => {

        db.run(

            `
            DELETE FROM notifications
            WHERE user_id = ?
            `,

            [

                req.params.userId

            ],

            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({

                    success: true,
                    deleted: this.changes,
                    message: "User notifications deleted successfully."

                });

            }

        );

    });

    // ========================================
    // ADMIN CLEAR ALL NOTIFICATIONS
    // ========================================

    router.delete("/admin/clear", auth, admin, (req, res) => {

        db.run(

            `
            DELETE FROM notifications
            `,

            [],

            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({

                    success: true,
                    deleted: this.changes,
                    message: "All notifications deleted successfully."

                });

            }

        );

    });

    // ========================================
    // GET SINGLE NOTIFICATION
    // ========================================

    router.get("/:id", auth, (req, res) => {

        db.get(

            `
            SELECT *
            FROM notifications
            WHERE id = ?
            AND user_id = ?
            `,

            [

                req.params.id,
                req.user.id

            ],

            (err, row) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (!row) {

                    return res.status(404).json({
                        success: false,
                        message: "Notification not found."
                    });

                }

                res.json({

                    success: true,
                    notification: row

                });

            }

        );

    });

    // ========================================
    // MARK SINGLE NOTIFICATION AS READ
    // ========================================
    router.put("/:id/read", auth, (req, res) => {

        db.run(

            `
            UPDATE notifications
            SET is_read = 1
            WHERE id = ?
            AND user_id = ?
            `,

            [

                req.params.id,
                req.user.id

            ],

            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (!this.changes) {

                    return res.status(404).json({
                        success: false,
                        message: "Notification not found."
                    });

                }

                res.json({

                    success: true,
                    message: "Notification marked as read."

                });

            }

        );

    });

    // ========================================
    // DELETE SINGLE NOTIFICATION
    // ========================================

    router.delete("/:id", auth, (req, res) => {

        db.run(

            `
            DELETE FROM notifications
            WHERE id = ?
            AND user_id = ?
            `,

            [

                req.params.id,
                req.user.id

            ],

            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (!this.changes) {

                    return res.status(404).json({
                        success: false,
                        message: "Notification not found."
                    });

                }

                res.json({

                    success: true,
                    message: "Notification deleted successfully."

                });

            }

        );

    });

    return router;

};