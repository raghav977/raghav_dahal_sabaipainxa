const express = require("express");
const router = express.Router();
const { registerBusinessAccount, getBusinessAccount, verifyBusinessAccount, listBusinessAccounts } = require("../controllers/businessAccount.controller");
const { authMiddleware } = require("../middleware/authMiddleware");
const fileMiddle = require("../middleware/fileMiddle"); // for multi-file uploads

// Authenticated: register business account with KYC (user_id comes from auth header)
router.post("/register", authMiddleware, fileMiddle, registerBusinessAccount);

// Get business account details
router.get("/:user_id", getBusinessAccount);

// Admin: verify/reject business account
router.post("/:business_account_id/verify", authMiddleware, verifyBusinessAccount);

// Admin: list all business accounts
router.get("/admin/list", authMiddleware, listBusinessAccounts);

module.exports = router;
