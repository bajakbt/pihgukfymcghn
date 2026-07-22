const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

module.exports = (db) => {

    const router = express.Router();

    // =====================================================
    // GET ALL COUPONS
    // =====================================================

    router.get("/", auth, admin, (req, res) => {

        db.all(

            `
            SELECT *
            FROM coupons
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
                    total: rows.length,
                    coupons: rows

                });

            }

        );

    });

    // =====================================================
    // COUPON STATISTICS
    // =====================================================

    router.get("/statistics/summary", auth, admin, (req, res) => {

        db.get(

            `
            SELECT

                COUNT(*) AS total_coupons,

                SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) AS active_coupons,

                SUM(CASE WHEN status!='Active' THEN 1 ELSE 0 END) AS inactive_coupons,

                SUM(used_count) AS total_used

            FROM coupons
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

    // =====================================================
    // GET SINGLE COUPON
    // =====================================================

    router.get("/:id", auth, admin, (req, res) => {

        db.get(

            `
            SELECT *
            FROM coupons
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
                        message: "Coupon not found."

                    });

                }

                res.json({

                    success: true,
                    coupon: row

                });

            }

        );

    });

    // =====================================================
    // CREATE COUPON
    // =====================================================
    router.post("/", auth, admin, (req, res) => {

        const {

            code,
            discount,
            min_order,
            max_uses,
            status

        } = req.body;

        if (!code) {

            return res.status(400).json({

                success: false,
                message: "Coupon code is required."

            });

        }

        if (discount === undefined || discount === null) {

            return res.status(400).json({

                success: false,
                message: "Discount is required."

            });

        }

        const couponCode = code.trim().toUpperCase();

        const couponDiscount = Number(discount);
        const minimumOrder = Number(min_order || 0);
        const maximumUses = Number(max_uses || 0);
        const couponStatus = status || "Active";

        db.get(

            `
            SELECT id
            FROM coupons
            WHERE UPPER(code)=UPPER(?)
            `,

            [

                couponCode

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
                        message: "Coupon already exists."

                    });

                }

                db.run(

                    `
                    INSERT INTO coupons
                    (

                        code,
                        discount,
                        min_order,
                        max_uses,
                        used_count,
                        status

                    )

                    VALUES
                    (

                        ?,
                        ?,
                        ?,
                        ?,
                        0,
                        ?

                    )

                    `,

                    [

                        couponCode,
                        couponDiscount,
                        minimumOrder,
                        maximumUses,
                        couponStatus

                    ],

                    function(insertError) {

                        if (insertError) {

                            return res.status(500).json({

                                success: false,
                                message: insertError.message

                            });

                        }

                        res.json({

                            success: true,
                            coupon_id: this.lastID,
                            message: "Coupon created successfully."

                        });

                    }

                );

            }

        );

    });

    // =====================================================
    // UPDATE COUPON
    // =====================================================
    router.put("/:id", auth, admin, (req, res) => {

        const {

            code,
            discount,
            min_order,
            max_uses,
            status

        } = req.body;

        db.get(

            `
            SELECT *
            FROM coupons
            WHERE id = ?
            `,

            [

                req.params.id

            ],

            (err, coupon) => {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                if (!coupon) {

                    return res.status(404).json({

                        success: false,
                        message: "Coupon not found."

                    });

                }

                const newCode = code
                    ? code.trim().toUpperCase()
                    : coupon.code;

                db.get(

                    `
                    SELECT id
                    FROM coupons
                    WHERE UPPER(code)=UPPER(?)
                    AND id <> ?
                    `,

                    [

                        newCode,
                        req.params.id

                    ],

                    (duplicateError, duplicate) => {

                        if (duplicateError) {

                            return res.status(500).json({

                                success: false,
                                message: duplicateError.message

                            });

                        }

                        if (duplicate) {

                            return res.status(409).json({

                                success: false,
                                message: "Coupon code already exists."

                            });

                        }

                        db.run(

                            `
                            UPDATE coupons
                            SET

                                code = ?,
                                discount = ?,
                                min_order = ?,
                                max_uses = ?,
                                status = ?

                            WHERE id = ?
                            `,

                            [

                                newCode,

                                discount ?? coupon.discount,

                                min_order ?? coupon.min_order,

                                max_uses ?? coupon.max_uses,

                                status ?? coupon.status,

                                req.params.id

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
                                    message: "Coupon updated successfully."

                                });

                            }

                        );

                    }

                );

            }

        );

    });

    // =====================================================
    // ENABLE / DISABLE COUPON
    // =====================================================
    router.patch("/:id/status", auth, admin, (req, res) => {

        const { status } = req.body;

        if (!status) {

            return res.status(400).json({

                success: false,
                message: "Status is required."

            });

        }

        db.run(

            `
            UPDATE coupons
            SET status = ?
            WHERE id = ?
            `,

            [

                status,
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
                        message: "Coupon not found."

                    });

                }

                res.json({

                    success: true,
                    message: "Coupon status updated successfully."

                });

            }

        );

    });

    // =====================================================
    // DELETE COUPON
    // =====================================================

    router.delete("/:id", auth, admin, (req, res) => {

        db.run(

            `
            DELETE FROM coupons
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
                        message: "Coupon not found."

                    });

                }

                res.json({

                    success: true,
                    message: "Coupon deleted successfully."

                });

            }

        );

    });

    // =====================================================
    // VALIDATE COUPON
    // =====================================================
    router.post("/validate", auth, (req, res) => {

        const {

            code,
            total

        } = req.body;

        if (!code) {

            return res.status(400).json({

                success: false,
                message: "Coupon code is required."

            });

        }

        db.get(

            `
            SELECT *
            FROM coupons
            WHERE UPPER(code)=UPPER(?)
            `,

            [

                code.trim()

            ],

            (err, coupon) => {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                if (!coupon) {

                    return res.status(404).json({

                        success: false,
                        message: "Invalid coupon."

                    });

                }

                if (coupon.status !== "Active") {

                    return res.status(400).json({

                        success: false,
                        message: "Coupon is disabled."

                    });

                }

                if (

                    coupon.max_uses > 0 &&
                    coupon.used_count >= coupon.max_uses

                ) {

                    return res.status(400).json({

                        success: false,
                        message: "Coupon usage limit reached."

                    });

                }

                if (

                    Number(total) < Number(coupon.min_order)

                ) {

                    return res.status(400).json({

                        success: false,
                        message: "Minimum order amount not reached."

                    });

                }

                const discount = Number(coupon.discount);

                let finalTotal = Number(total) - discount;

                if (finalTotal < 0) {

                    finalTotal = 0;

                }

                res.json({

                    success: true,

                    coupon: {

                        id: coupon.id,
                        code: coupon.code,
                        discount: discount

                    },

                    total: Number(total),

                    final_total: finalTotal

                });

            }

        );

    });

    // =====================================================
    // USE COUPON
    // =====================================================

    router.post("/use", auth, (req, res) => {

        const {

            code

        } = req.body;

        if (!code) {

            return res.status(400).json({

                success: false,
                message: "Coupon code is required."

            });

        }

        db.get(

            `
            SELECT *
            FROM coupons
            WHERE UPPER(code)=UPPER(?)
            `,

            [

                code.trim()

            ],

            (err, coupon) => {

                if (err) {

                    return res.status(500).json({

                        success: false,
                        message: err.message

                    });

                }

                if (!coupon) {

                    return res.status(404).json({

                        success: false,
                        message: "Coupon not found."

                    });

                }

                if (coupon.status !== "Active") {

                    return res.status(400).json({

                        success: false,
                        message: "Coupon is disabled."

                    });

                }

                if (

                    coupon.max_uses > 0 &&
                    coupon.used_count >= coupon.max_uses

                ) {

                    return res.status(400).json({

                        success: false,
                        message: "Coupon usage limit reached."});

                }

                db.run(

                    `
                    UPDATE coupons
                    SET used_count = used_count + 1
                    WHERE id = ?
                    `,

                    [

                        coupon.id

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
                            message: "Coupon applied successfully.",
                            used_count: coupon.used_count + 1

                        });

                    }

                );

            }

        );

    });

    return router;

};