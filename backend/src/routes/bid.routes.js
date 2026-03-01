const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleware");
const { adminProviderMiddleware } = require("../middleware/adminProviderMiddleware");

const { UserBookingController, getUserBids, acceptBid, declineBid } = require("../controllers/bid.controller");

const userBookingController = new UserBookingController();
const getUserBookings = userBookingController.getUserBookings.bind(userBookingController);

// ----------------------------
// User bookings
// ----------------------------
router.get("/user", authMiddleware, getUserBookings);

// Get user bids for a booking
router.get("/user/bids", authMiddleware, getUserBids);

// ----------------------------
// Accept a bid
// Only service provider or authorized user can accept
// ----------------------------
router.post("/accept", authMiddleware, acceptBid);

// ----------------------------
router.post("/decline", authMiddleware, declineBid);

module.exports = router;
