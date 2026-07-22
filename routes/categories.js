const express = require("express");

module.exports = (db) => {

    const router = express.Router();

    // ==========================================
    // GET ALL CATEGORIES
    // ==========================================
    router.get("/", (req, res) => {

        db.all(
            "SELECT * FROM categories ORDER BY id ASC",
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
                    categories: rows
                });

            }
        );

    });

    // ==========================================
    // GET CATEGORY BY ID
    // ==========================================
    router.get("/:id", (req, res) => {

        db.get(
            "SELECT * FROM categories WHERE id=?",
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
                        message: "Category not found"
                    });
                }

                res.json({
                    success: true,
                    category: row
                });

            }
        );

    });

    // ==========================================
    // CREATE CATEGORY
    // ==========================================
    router.post("/", (req, res) => {

        const {
            name,
            icon,
            image,
            rate,
            status,
            game_id_required
        } = req.body;

        db.run(
            `
            INSERT INTO categories
            (
                name,
                icon,
                image,
                rate,
                status,
                game_id_required
            )
            VALUES (?,?,?,?,?,?)
            `,
            [
                name,
                icon,
                image,
                rate || 100,
                status || "Visible",
                game_id_required || 0
            ],
            function(err){

                if(err){
                    return res.status(500).json({
                        success:false,
                        message:err.message
                    });
                }

                res.json({
                    success:true,
                    message:"Category created successfully",
                    category_id:this.lastID
                });

            }

        );

    });

    // ==========================================
    // UPDATE CATEGORY
    // ==========================================
    
    router.put("/:id",(req,res)=>{

        const{
            name,
            icon,
            image,
            rate,
            status,
            game_id_required
        }=req.body;

        db.run(

            `
            UPDATE categories
            SET
                name=?,
                icon=?,
                image=?,
                rate=?,
                status=?,
                game_id_required=?
            WHERE id=?
            `,

            [
                name,
                icon,
                image,
                rate,
                status,
                game_id_required,
                req.params.id
            ],

            function(err){

                if(err){
                    return res.status(500).json({
                        success:false,
                        message:err.message
                    });
                }
                if (this.changes === 0) {
    return res.status(404).json({
        success: false,
        message: "Category not found"
    });
}

                res.json({
                    success:true,
                    message:"Category updated successfully"
                });

            }

        );

    });
    // ==========================================
    // DELETE CATEGORY
    // ==========================================
    router.delete("/:id",(req,res)=>{

        db.run(

            "DELETE FROM categories WHERE id=?",

            [req.params.id],

            function(err){

                if(err){
                    return res.status(500).json({
                        success:false,
                        message:err.message
                    });
                }

                res.json({
                    success:true,
                    message:"Category deleted successfully"
                });

            }

        );

    });

    return router;

};