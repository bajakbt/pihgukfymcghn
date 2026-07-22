// ============================================
// BROADCAST ROUTES
// ============================================

const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

module.exports = (db) => {

    const router = express.Router();

    // ========================================
    // GET ALL BROADCASTS
    // ========================================

    router.get("/", auth, admin, (req, res) => {

        db.all(

            `
            SELECT
                broadcasts.*,
                users.username,
                users.first_name
            FROM broadcasts
            LEFT JOIN users
                ON users.id = broadcasts.sent_by
            ORDER BY broadcasts.created_at DESC
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
                    broadcasts: rows

                });

            }

        );

    });

    
    // ========================================
    // CREATE BROADCAST
    // ========================================
    router.post("/", auth, admin, (req, res) => {

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

                    function (insertError) {

                        if (insertError) {

                            return res.status(500).json({
                                success: false,
                                message: insertError.message
                            });

                        }

                        const broadcastId = this.lastID;

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

                            res.json({

                                success: true,
                                broadcast_id: broadcastId,
                                sent_to: users.length,
                                message: "Broadcast sent successfully."

                            });

                        });

                    }

                );

            }

        );

    });
    

    // ========================================
    // DELETE BROADCAST
    // ========================================
    router.delete("/:id", auth, admin, (req, res) => {

        db.run(

            `
            DELETE FROM broadcasts
            WHERE id = ?
            `,

            [

                req.params.id

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
                        message: "Broadcast not found."
                    });

                }

                res.json({

                    success: true,
                    deleted: this.changes,
                    message: "Broadcast deleted successfully."

                });

            }

        );

    });

    // ========================================
    // BROADCAST STATISTICS
    // ========================================
    // ========================================
    // GET SINGLE BROADCAST
    // ========================================

    router.get("/:id", auth, admin, (req, res) => {

        db.get(

            `
            SELECT *
            FROM broadcasts
            WHERE id = ?
            `,

            [

                req.params.id

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
                        message: "Broadcast not found."
                    });

                }

                res.json({

                    success: true,
                    broadcast: row

                });

            }

        );

    });


    router.get("/statistics/summary", auth, admin, (req, res) => {

        db.get(

            `
            SELECT
                COUNT(*) AS total_broadcasts
            FROM broadcasts
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

    return router;

};