




const express = require("express");
const router = express.Router();


const {authMiddleware} = require("../middleware/authMiddleware");
const {adminProviderMiddleware} = require("../middleware/adminProviderMiddleware");

const {submitRating,getRating} = require("../controllers/rating.controller");


router.post("/submit",authMiddleware,submitRating);
router.get("/:bookingId",authMiddleware,getRating);

module.exports = router;