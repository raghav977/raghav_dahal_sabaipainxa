const express = require("express");
const {applyKyc, documentType} = require("../controllers/kycController");
const {authMiddleware} = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const fileMid = require("../middleware/fileMiddle");

const router = express.Router();

router.post("/apply",authMiddleware,fileMid, applyKyc);

router.get("/document-type",documentType)
// admin routes for KYC verification will be in adminRoute.js


module.exports = router;