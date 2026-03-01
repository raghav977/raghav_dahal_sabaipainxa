

const router = require("express").Router();
// const {verifyKycRequest,rejectKycRequest} = require("../../controllers/kycController");
const {authMiddleware} = require("../../middleware/authMiddleware");
const {adminMiddleware} = require("../../middleware/adminMiddleware");
// const multer = require("multer");
// const path = require("path");
// const fileMid = require("../../middleware/fileMiddle");

// Get all KYC requests - only for admin
// router.get("/requests",authMiddleware,adminMiddleware, getAllKycRequests);


const {verifyKyc,getAllKycStatus} = require("../../controllers/adminController/kycVerification");

const {kycController} = require("../../controllers/adminController/kycVerification");


const kycCtrl = new kycController();

// CRUD operations for KYCs

router.get("/all",authMiddleware,adminMiddleware, kycCtrl.list.bind(kycCtrl));

router.delete("/:id",authMiddleware,adminMiddleware, kycCtrl.delete.bind(kycCtrl));




// verify or reject a KYC - only for admin
router.post("/verify",authMiddleware,adminMiddleware, verifyKyc);
// get all KYCs - for admin dashboard
router.get("/all",authMiddleware,adminMiddleware, getAllKycStatus);

module.exports = router;