// ============================================
// SUPPORT ROUTES
// ============================================

module.exports = (db) => {

    const express = require("express");
    const router = express.Router();

    const auth = require("../middleware/auth");
    const admin = require("../middleware/admin");

    // ========================================
    // CREATE SUPPORT TICKET
    // ========================================

    router.post("/tickets", auth, (req, res) => {

        const { subject, priority } = req.body;

        if (!subject || subject.trim() === "") {

            return res.status(400).json({
                success: false,
                message: "Subject is required"
            });

        }

        db.run(

            `INSERT INTO support_tickets
            (user_id, subject, priority)
            VALUES (?, ?, ?)`,

            [
                req.user.id,
                subject.trim(),
                priority || "Normal"
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
                    ticket_id: this.lastID,
                    message: "Support ticket created successfully"
                });

            }

        );

    });

    // ========================================
    // MY TICKETS
    // ========================================

    router.get("/tickets", auth, (req, res) => {

        db.all(

            `SELECT *
             FROM support_tickets
             WHERE user_id=?
             ORDER BY id DESC`,

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
                    tickets: rows
                });

            }

        );

    });

    // ========================================
    // SINGLE TICKET
    // ========================================

    router.get("/tickets/:id", auth, (req, res) => {

        db.get(

            `SELECT *
             FROM support_tickets
             WHERE id=? AND user_id=?`,

            [
                req.params.id,
                req.user.id
            ],

            (err, ticket) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (!ticket) {

                    return res.status(404).json({
                        success: false,
                        message: "Ticket not found"
                    });

                }

                db.all(

                    `SELECT *
                     FROM chat_messages
                     WHERE ticket_id=?
                     ORDER BY id ASC`,

                    [ticket.id],

                    (err, messages) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        res.json({
                            success: true,
                            ticket,
                            messages
                        });

                    }

                );

            }

        );

    });

    // ========================================
    // SEND MESSAGE
    // ========================================
    router.post("/tickets/:id/messages", auth, (req, res) => {

        const { message } = req.body;

        if (!message || message.trim() === "") {

            return res.status(400).json({
                success: false,
                message: "Message is required"
            });

        }

        db.get(

            `SELECT *
             FROM support_tickets
             WHERE id=? AND user_id=?`,

            [
                req.params.id,
                req.user.id
            ],

            (err, ticket) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (!ticket) {

                    return res.status(404).json({
                        success: false,
                        message: "Ticket not found"
                    });

                }

                if (ticket.status === "Closed") {

                    return res.status(400).json({
                        success: false,
                        message: "This ticket is closed"
                    });

                }

                db.run(

                    `INSERT INTO chat_messages
                    (ticket_id, sender, message)
                    VALUES (?,?,?)`,

                    [
                        ticket.id,
                        "Customer",
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
                            message: "Message sent successfully",
                            message_id: this.lastID
                        });

                    }

                );

            }

        );

    });

    // ========================================
    // CLOSE MY TICKET
    // ========================================

    router.put("/tickets/:id/close", auth, (req, res) => {

        db.run(

            `UPDATE support_tickets
             SET status='Closed'
             WHERE id=? AND user_id=?`,

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

                if (this.changes === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Ticket not found"
                    });

                }

                res.json({
                    success: true,
                    message: "Ticket closed successfully"
                });

            }

        );

    });

    // ========================================
    // ADMIN - ALL TICKETS
    // ========================================

    router.get("/admin/tickets", auth, admin, (req, res) => {

        db.all(

            `SELECT
                support_tickets.*,
                users.username,
                users.email
             FROM support_tickets
             LEFT JOIN users
             ON users.id=support_tickets.user_id
             ORDER BY support_tickets.id DESC`,

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
                    tickets: rows
                });

            }

        );

    });// ========================================
    // ADMIN - SINGLE TICKET
    // ========================================
    router.get("/admin/tickets/:id", auth, admin, (req, res) => {

        db.get(

            `SELECT
                support_tickets.*,
                users.username,
                users.email,
                users.first_name,
                users.last_name
             FROM support_tickets
             LEFT JOIN users
             ON users.id = support_tickets.user_id
             WHERE support_tickets.id=?`,

            [req.params.id],

            (err, ticket) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (!ticket) {

                    return res.status(404).json({
                        success: false,
                        message: "Ticket not found"
                    });

                }

                db.all(

                    `SELECT *
                     FROM chat_messages
                     WHERE ticket_id=?
                     ORDER BY id ASC`,

                    [ticket.id],

                    (err, messages) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        res.json({
                            success: true,
                            ticket,
                            messages
                        });

                    }

                );

            }

        );

    });

    // ========================================
    // ADMIN REPLY
    // ========================================

    router.post("/admin/tickets/:id/reply", auth, admin, (req, res) => {

        const { message } = req.body;

        if (!message || message.trim() === "") {

            return res.status(400).json({
                success: false,
                message: "Message is required"
            });

        }

        db.get(

            "SELECT * FROM support_tickets WHERE id=?",

            [req.params.id],

            (err, ticket) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (!ticket) {

                    return res.status(404).json({
                        success: false,
                        message: "Ticket not found"
                    });

                }

                db.run(

                    `INSERT INTO chat_messages
                    (ticket_id,sender,message)
                    VALUES(?,?,?)`,

                    [
                        ticket.id,
                        "Admin",
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
                            message: "Reply sent successfully",
                            reply_id: this.lastID
                        });

                    }

                );

            }

        );

    });

    // ========================================
    // CHANGE TICKET STATUS
    // ========================================

    router.put("/admin/tickets/:id/status", auth, admin, (req, res) => {

        const { status } = req.body;

        db.run(

            "UPDATE support_tickets SET status=? WHERE id=?",

            [
                status,
                req.params.id
            ],

            function (err) {

                if (err) {

                    return res.status(500).json({success: false,
                        message: err.message
                    });

                }

                if (this.changes === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Ticket not found"
                    });

                }

                res.json({
                    success: true,
                    message: "Status updated"
                });

            }

        );

    });

    // ========================================
    // CHANGE PRIORITY
    // ========================================

    router.put("/admin/tickets/:id/priority", auth, admin, (req, res) => {

        const { priority } = req.body;

        db.run(

            "UPDATE support_tickets SET priority=? WHERE id=?",

            [
                priority,
                req.params.id
            ],

            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (this.changes === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Ticket not found"
                    });

                }

                res.json({
                    success: true,
                    message: "Priority updated"
                });

            }

        );

    });

    // ========================================
    // REOPEN TICKET
    // ========================================

    router.put("/admin/tickets/:id/reopen", auth, admin, (req, res) => {

        db.run(

            "UPDATE support_tickets SET status='Open' WHERE id=?",

            [req.params.id],

            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (this.changes === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Ticket not found"
                    });

                }

                res.json({
                    success: true,
                    message: "Ticket reopened"
                });

            }

        );

    });

    // ========================================
    // DELETE MESSAGE
    // ========================================
    router.delete("/admin/messages/:id", auth, admin, (req, res) => {

        db.run(

            "DELETE FROM chat_messages WHERE id=?",

            [req.params.id],

            function (err) {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (this.changes === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Message not found"
                    });

                }

                res.json({
                    success: true,
                    message: "Message deleted successfully"
                });

            }

        );

    });

    // ========================================
    // DELETE TICKET
    // ========================================

    router.delete("/admin/tickets/:id", auth, admin, (req, res) => {

        const ticketId = req.params.id;

        db.run(

            "DELETE FROM chat_messages WHERE ticket_id=?",

            [ticketId],

            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                db.run(

                    "DELETE FROM support_tickets WHERE id=?",

                    [ticketId],

                    function (err) {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        if (this.changes === 0) {

                            return res.status(404).json({
                                success: false,
                                message: "Ticket not found"
                            });

                        }

                        res.json({
                            success: true,
                            message: "Ticket deleted successfully"
                        });

                    }

                );

            }

        );

    });

    // ========================================
    // SUPPORT STATISTICS
    // ========================================

    router.get("/admin/statistics", auth, admin, (req, res) => {

        const stats = {};

        db.get(

            "SELECT COUNT(*) AS total FROM support_tickets",

            [],

            (err, row) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                stats.total = row.total;

                db.get(

                    "SELECT COUNT(*) AS open FROM support_tickets WHERE status='Open'",

                    [],

                    (err, row) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        stats.open = row.open;

                        db.get(

                            "SELECT COUNT(*) AS closed FROM support_tickets WHERE status='Closed'",

                            [],

                            (err, row) => {

                                if (err) {

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });

                                }

                                stats.closed = row.closed;

                                db.get(

                                    "SELECT COUNT(*) AS messages FROM chat_messages",[],

                                    (err, row) => {

                                        if (err) {

                                            return res.status(500).json({
                                                success: false,
                                                message: err.message
                                            });

                                        }

                                        stats.messages = row.messages;

                                        res.json({
                                            success: true,
                                            statistics: stats
                                        });

                                    }

                                );

                            }

                        );

                    }

                );

            }

        );

    });

    // ========================================
    // EXPORT ROUTER
    // ========================================

    return router;

};