// routes/wallet.js
const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

module.exports = (db) => {
  const router = express.Router();

  // Current wallet balance
  router.get("/", auth, (req, res) => {
    db.get(
      "SELECT balance FROM users WHERE id = ?",
      [req.user.id],
      (err, user) => {
        if (err)
          return res.status(500).json({
            success: false,
            message: err.message
          });

        if (!user)
          return res.status(404).json({
            success: false,
            message: "User not found"
          });

        res.json({
          success: true,
          balance: user.balance
        });
      }
    );
  });

  // Wallet transactions
  router.get("/transactions", auth, (req, res) => {
    db.all(
      "SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY id DESC",
      [req.user.id],
      (err, rows) => {
        if (err)
          return res.status(500).json({
            success: false,
            message: err.message
          });

        res.json({
          success: true,
          transactions: rows
        });
      }
    );
  });

  // Deposit request
  router.post("/deposit", auth, (req, res) => {

    const { amount, method, txid } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    db.run(
      "INSERT INTO deposits (user_id, amount, method, txid, status) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.id,
        amount,
        method || "Manual",
        txid || "",
        "Pending"
      ],
      function (err) {

        if (err)
          return res.status(500).json({
            success: false,
            message: err.message
          });

        res.json({
          success: true,
          message: "Deposit request submitted",
          deposit_id: this.lastID
        });

      }
    );

  });

  // Approve Deposit (Admin)
  router.post("/deposit/:id/approve", auth, admin, (req, res) => {

    db.get(
      "SELECT * FROM deposits WHERE id = ?",
      [req.params.id],
      (err, dep) => {

        if (err)
          return res.status(500).json({
            success: false,
            message: err.message
          });

        if (!dep)
          return res.status(404).json({
            success: false,
            message: "Deposit not found"
          });

        if (dep.status === "Approved")
          return res.status(400).json({
            success: false,
            message: "Already approved"
          });

        db.get(
          "SELECT balance FROM users WHERE id = ?",
          [dep.user_id],
          (err, user) => {

            if (err)
              return res.status(500).json({
                success: false,
                message: err.message
              });
if (!user) {
    return res.status(404).json({
        success: false,
        message: "User not found"
    });
}
            const before = Number(user.balance);
            const after = before + Number(dep.amount);

            db.run(
              "UPDATE users SET balance = ? WHERE id = ?",
              [after, dep.user_id],
              (err) => {

                if (err)
                  return res.status(500).json({
                    success: false,
                    message: err.message
                  });

                db.run(
                  "UPDATE deposits SET status = 'Approved' WHERE id = ?",
                  [dep.id]
                );

                db.run(
                  "INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)",
                  [
                    dep.user_id,
                    "Deposit",
                    dep.amount,
                    before,
                    after,
                    "Manual deposit"
                  ]
                );

                res.json({
                  success: true,
                  message: "Deposit approved",
                  balance: after
                });}
            );

          }
        );

      }
    );

  });

  return router;
};