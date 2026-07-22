const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

module.exports = (db) => {

    const router = express.Router();

    // =====================================================
    // GET ALL SETTINGS
    // =====================================================

    router.get("/", auth, admin, (req, res) => {

        db.all(

            `
            SELECT *
            FROM settings
            ORDER BY setting_key ASC
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
                    settings: rows

                });

            }

        );

    });

    // =====================================================
    // GET SINGLE SETTING
    // =====================================================

    router.get("/:key", auth, admin, (req, res) => {

        db.get(

            `
            SELECT *
            FROM settings
            WHERE setting_key = ?
            `,

            [

                req.params.key

            ],

            (err, setting) => {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                if (!setting) {

                    return res.status(404).json({

                        success: false,
                        message: "Setting not found."

                    });

                }

                res.json({

                    success: true,
                    setting

                });

            }

        );

    });

    // =====================================================
    // CREATE SETTING
    // =====================================================

    router.post("/", auth, admin, (req, res) => {

        const {

            setting_key,
            setting_value

        } = req.body;

        if (!setting_key || setting_value === undefined) {

            return res.status(400).json({

                success: false,
                message: "setting_key and setting_value are required."

            });

        }

        db.get(

            `
            SELECT id
            FROM settings
            WHERE setting_key = ?
            `,

            [

                setting_key.trim()

            ],

            (err, exists) => {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                if (exists) {

                    return res.status(409).json({

                        success: false,
                        message: "Setting already exists."

                    });

                }

                db.run(

                    `
                    INSERT INTO settings
                    (
                        setting_key,
                        setting_value
                    )
                    VALUES
                    (
                        ?,
                        ?
                    )
                    `,

                    [

                        setting_key.trim(),
                        String(setting_value)

                    ],

                    function(insertError) {

                        if (insertError) {

                            return res.status(500).json({

                                success: false,
                                message: insertError.message

                            });

                        }

                        res.status(201).json({

                            success: true,message: "Setting created successfully.",
                            id: this.lastID

                        });

                    }

                );

            }

        );

    });

    // =====================================================
    // UPDATE SETTING
    // =====================================================
    router.put("/:key", auth, admin, (req, res) => {

        const {

            setting_value

        } = req.body;

        if (setting_value === undefined) {

            return res.status(400).json({

                success: false,
                message: "setting_value is required."

            });

        }

        db.run(

            `
            UPDATE settings
            SET
                setting_value = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = ?
            `,

            [

                String(setting_value),
                req.params.key

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
                        message: "Setting not found."

                    });

                }

                res.json({

                    success: true,
                    message: "Setting updated successfully."

                });

            }

        );

    });

    // =====================================================
    // UPSERT SETTING
    // =====================================================

    router.post("/upsert", auth, admin, (req, res) => {

        const {

            setting_key,
            setting_value

        } = req.body;

        if (!setting_key || setting_value === undefined) {

            return res.status(400).json({

                success: false,
                message: "setting_key and setting_value are required."

            });

        }

        db.get(

            `
            SELECT id
            FROM settings
            WHERE setting_key = ?
            `,

            [

                setting_key.trim()

            ],

            (err, setting) => {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                if (setting) {

                    db.run(

                        `
                        UPDATE settings
                        SET
                            setting_value = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE setting_key = ?
                        `,

                        [

                            String(setting_value),
                            setting_key.trim()

                        ],

                        function(updateError) {

                            if (updateError) {

                                return res.status(500).json({

                                    success: false,
                                    message: updateError.message

                                });

                            }

                            res.json({

                                success: true,
                                message: "Setting updated successfully."

                            });

                        }

                    );

                } else {

                    db.run(

                        `
                        INSERT INTO settings
                        (
                            setting_key,
                            setting_value
                        )
                        VALUES
                        (
                            ?,
                            ?
                        )
                        `,

                        [

                            setting_key.trim(),
                            String(setting_value)

                        ],

                        function(insertError) {

                            if (insertError) {

                                return res.status(500).json({success: false,
                                    message: insertError.message

                                });

                            }

                            res.status(201).json({

                                success: true,
                                message: "Setting created successfully.",
                                id: this.lastID

                            });

                        }

                    );

                }

            }

        );

    });

    // =====================================================
    // DELETE SETTING
    // =====================================================

    router.delete("/:key", auth, admin, (req, res) => {

        db.run(

            `
            DELETE FROM settings
            WHERE setting_key = ?
            `,

            [

                req.params.key

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
                        message: "Setting not found."

                    });

                }

                res.json({

                    success: true,
                    message: "Setting deleted successfully."

                });

            }

        );

    });

    return router;

};