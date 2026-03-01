

const router = require("express").Router();

const {authMiddleware} = require("../middleware/authMiddleware");

const {getDataForGharbetiDashboard} = require("../controllers/gharbeti.dashboard.controller");

router.get("/", authMiddleware, getDataForGharbetiDashboard);

module.exports = router;
