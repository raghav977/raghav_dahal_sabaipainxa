

// const {express} = require('express');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { adminMiddleware } = require('../../middleware/adminMiddleware');
const { getDashboardMetricsData,getKycData,getRoomData,getServicesData } = require('../../controllers/adminController/dashboard.controller');

// const router = express.Router();
const router = require("express").Router();


router.get("/metrics",authMiddleware,adminMiddleware,getDashboardMetricsData)

router.get("/services",authMiddleware,adminMiddleware,getServicesData)

router.get("/rooms",authMiddleware,adminMiddleware,getRoomData)

router.get("/kyc",authMiddleware,adminMiddleware,getKycData)

module.exports = router;