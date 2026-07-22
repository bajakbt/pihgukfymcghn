const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

module.exports = (db, JWT_SECRET, SALT_ROUNDS) => {

    // ============================================
    // REGISTER
    // ============================================

    
router.post("/register", async (req, res) => {

    console.log("REGISTER ROUTE HIT");

    try {

        const {
            username,
            email,
            password
        } = req.body;

            if (!username || !email || !password) {

                return res.status(400).json({
                    success: false,
                    message: "All fields are required."
                });

            }

            db.get(
                "SELECT id FROM users WHERE email = ?",
                [email],
                async (err, user) => {

                    if (err) {

                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });

                    }

                    if (user) {

                        return res.status(400).json({
                            success: false,
                            message: "Email already exists."
                        });

                    }

                    const hashedPassword = await bcrypt.hash(
                        password,
                        SALT_ROUNDS
                    );

                    db.run(
                        `
                        INSERT INTO users
                        (
                            username,
                            email,
                            password
                        )
                        VALUES
                        (
                            ?, ?, ?
                        )
                        `,
                        [
                            username,
                            email,
                            hashedPassword
                        ],
                        function (err) {

                            if (err) {

                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });

                            }

                            const token = jwt.sign(

                                {
                                    id: this.lastID,
                                    email: email
                                },

                                JWT_SECRET,

                                {
                                    expiresIn: "30d"
                                }

                            );

                            res.json({

                                success: true,

                                message: "Account created successfully.",

                                token,

                                user: {

                                    id: this.lastID,

                                    username,

                                    email

                                }

                            });

                        }

                    );

                }

            );

        } catch (error) {

            res.status(500).json({

                success: false,

                message: error.message

            });

        }

    });

    return router;

};