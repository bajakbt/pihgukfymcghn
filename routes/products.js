const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

module.exports = (db) => {

    const router = express.Router();

    // =====================================
    // GET ALL PRODUCTS
    // =====================================
    router.get("/", (req, res) => {

        db.all(
            "SELECT * FROM products ORDER BY id DESC",
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
                    products: rows
                });

            }
        );

    });

    // =====================================
    // GET PRODUCT BY ID
    // =====================================
    router.get("/:id", (req, res) => {

        db.get(
            "SELECT * FROM products WHERE id = ?",
            [req.params.id],
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
                        message: "Product not found"
                    });
                }

                res.json({
                    success: true,
                    product: row
                });

            }
        );

    });

    // =====================================
    // CREATE PRODUCT
    // =====================================
    router.post("/", auth, admin, (req, res) => {

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
            `INSERT INTO products
            (
                name,
                category,
                description,
                image,
                price,
                stock,
                status,
                game_id_required
            )
            VALUES (?,?,?,?,?,?,?,?)`,
            [
                name,
                category,
                description,
                image,
                price,
                stock || 999999,
                status || "Available",
                game_id_required || 0
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
                    message: "Product created successfully",
                    product_id: this.lastID
                });

            }
        );

    });

    // =====================================
    // UPDATE PRODUCT
    // =====================================
    router.put("/:id", auth, admin, (req, res) => {

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
                game_id_required,
                req.params.id
            ],
            function (err) {

                if (err) {return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                if (this.changes === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Product not found"
                    });
                }

                res.json({
                    success: true,
                    message: "Product updated successfully"
                });

            }
        );

    });

    // =====================================
    // DELETE PRODUCT
    // =====================================
    router.delete("/:id", auth, admin, (req, res) => {

        db.run(
            "DELETE FROM products WHERE id = ?",
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
                        message: "Product not found"
                    });
                }

                res.json({
                    success: true,
                    message: "Product deleted successfully"
                });

            }
        );

    });

    return router;

};