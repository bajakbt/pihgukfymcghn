const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

module.exports = (db) => {

    const router = express.Router();

    // =====================================================
    // GET ALL LOGS
    // =====================================================

    router.get("/", auth, admin, (req, res) => {

        db.all(

            `
            SELECT *
            FROM logs
            ORDER BY created_at DESC
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
                    count: rows.length,
                    logs: rows

                });

            }

        );

    });

   
    // =====================================================
    // GET USER LOGS
    // =====================================================

    router.get("/user/:user_id", auth, admin, (req, res) => {

        db.all(

            `
            SELECT *
            FROM logs
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,

            [

                req.params.user_id

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
                    count: rows.length,
                    logs: rows

                });

            }

        );

    });

    // =====================================================
    // LOG STATISTICS
    // =====================================================
    // =====================================================
    // LOG STATISTICS
    // =====================================================

    router.get("/statistics/summary", auth, admin, (req, res) => {

        db.get(

            `
            SELECT
                COUNT(*) AS total_logs,
                COUNT(DISTINCT user_id) AS total_users,
                MAX(created_at) AS last_activity
            FROM logs
            `,

            [],

            (err, stats) => {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                res.json({

                    success: true,
                    statistics: stats

                });

            }

        );

    });

    // =====================================================
    // GET SINGLE LOG
    // =====================================================

    router.get("/:id", auth, admin, (req, res) => {

        db.get(

            `
            SELECT *
            FROM logs
            WHERE id = ?
            `,

            [

                req.params.id

            ],

            (err, log) => {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                if (!log) {

                    return res.status(404).json({

                        success: false,
                        message: "Log not found."

                    });

                }

                res.json({

                    success: true,
                    log

                });

            }

        );

    });

    // =====================================================
    // DELETE SINGLE LOG
    // =====================================================

    router.delete("/:id", auth, admin, (req, res) => {

        db.run(

            `
            DELETE FROM logs
            WHERE id = ?
            `,

            [

                req.params.id

            ],

            function(err) {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                if (!this.changes) {

                    return res.status(404).json({

                        success: false,
                        message: "Log not found."

                    });

                }

                res.json({

                    success: true,
                    message: "Log deleted successfully."

                });

            }

        );

    });

    // =====================================================
    // DELETE ALL LOGS
    // =====================================================

    router.delete("/", auth, admin, (req, res) => {

        db.run(

            `
            DELETE FROM logs
            `,

            [],

            function(err) {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                res.json({

                    success: true,
                    message: "All logs deleted successfully.",
                    deleted: this.changes

                });

            }

        );

    });

    return router;

};