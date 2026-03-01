

const express = require("express")

const router = express.Router();

const fileMid = require("../middleware/fileMiddle");



const {authMiddleware} = require("../middleware/authMiddleware");

const {adminProviderMiddleware} = require("../middleware/adminProviderMiddleware");

const {createPaymentAccount,fetchPaymentStatus,initiatePayment,verifyPayment,releasePayment,getPaymentRecordsForProvider,getPaymentStatus,getPaymentHistoryForProvider} = require("../controllers/payment.controller");
const { adminMiddleware } = require("../middleware/adminMiddleware");


router.post("/create-payment-account",authMiddleware,adminProviderMiddleware,createPaymentAccount)


router.get("/payment-status/:bookingId",authMiddleware,fetchPaymentStatus)/

router.post("/initiate-payment/:bookingId",authMiddleware,initiatePayment)

router.post("/verify-status",authMiddleware,verifyPayment)



router.post("/release-payment/:bookingId",authMiddleware,adminMiddleware,releasePayment)

// router.get("/release-payment/:bookingId",authMiddleware,adminMiddleware,releasePayment)


router.get("/provider/payments",authMiddleware,adminProviderMiddleware,getPaymentRecordsForProvider)

router.get("/provider/payment-status",authMiddleware,adminProviderMiddleware,getPaymentStatus);

router.get("/provider/payment-history",authMiddleware,adminProviderMiddleware,getPaymentHistoryForProvider);

router.post("/initiate-room-payment/",authMiddleware,);

module.exports = router;
