// routes/orders.js
const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

module.exports = (db) => {
  const router = express.Router();

  router.get("/", auth, (req, res) => {
    db.all(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
      [req.user.id],
      (err, rows) => {
        if (err) return res.status(500).json({ success:false, message: err.message });
        res.json({ success:true, orders: rows });
      }
    );
  });

  router.post("/", auth, (req, res) => {
    const { product_id, quantity, game_id } = req.body;

    if (!product_id || !quantity) {
      return res.status(400).json({ success:false, message:"Missing required fields" });
    }

    db.get("SELECT * FROM products WHERE id = ?", [product_id], (err, product) => {
      if (err) return res.status(500).json({ success:false, message: err.message });
      if (!product) return res.status(404).json({ success:false, message:"Product not found" });

      db.get("SELECT * FROM users WHERE id = ?", [req.user.id], (err, user) => {
        if (err) return res.status(500).json({ success:false, message: err.message });

        const total = Number(product.price) * Number(quantity);

        if (Number(user.balance) < total) {
          return res.status(400).json({ success:false, message:"Insufficient balance" });
        }

        const before = Number(user.balance);
        const after = before - total;

        db.run("UPDATE users SET balance=? WHERE id=?", [after, user.id], (err) => {
          if (err) return res.status(500).json({ success:false, message: err.message });

          db.run(
            "INSERT INTO orders (user_id,product_id,product_name,quantity,total,game_id,status) VALUES (?,?,?,?,?,?,?)",
            [user.id, product.id, product.name, quantity, total, game_id || "", "Pending"],
            function(err){
              if (err) return res.status(500).json({ success:false, message: err.message });

              db.run(
                "INSERT INTO wallet_transactions (user_id,type,amount,balance_before,balance_after,description) VALUES (?,?,?,?,?,?)",
                [user.id,"Purchase",total,before,after,"Purchase of "+product.name],
                (err)=>{
                  if (err) return res.status(500).json({ success:false, message: err.message });

                  res.json({
                    success:true,
                    order_id:this.lastID,
                    balance:after
                  });
                }
              );
            }
          );
        });
      });
    });
  });

  router.get("/admin/all", auth, admin, (req,res)=>{
    db.all("SELECT * FROM orders ORDER BY id DESC", [], (err,rows)=>{
      if(err) return res.status(500).json({success:false,message:err.message});
      res.json({success:true,orders:rows});
    });
  });

  router.put("/:id", auth, admin, (req,res)=>{
    const {status,note} = req.body;

    db.run(
      "UPDATE orders SET status=?, note=? WHERE id=?",
      [status, note || "", req.params.id],
      function(err){
        if(err) return res.status(500).json({success:false,message:err.message});
        if(this.changes===0){
          return res.status(404).json({success:false,message:"Order not found"});
        }
        res.json({success:true,message:"Order updated"});
      }
    );
  });

  router.delete("/:id", auth, admin, (req,res)=>{
    db.run("DELETE FROM orders WHERE id=?", [req.params.id], function(err){
      if(err) return res.status(500).json({success:false,message:err.message});
      if(this.changes===0){
        return res.status(404).json({success:false,message:"Order not found"});
      }
      res.json({success:true,message:"Order deleted"});
    });
  });

  return router;
};
