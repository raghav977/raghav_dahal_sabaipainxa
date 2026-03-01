const express = require("express");

const router = express.Router();

const {authMiddleware} = require("../middleware/authMiddleware");
const {adminProviderMiddleware} = require("../middleware/adminProviderMiddleware");

const {createBooking,ProviderBookingController, cancelBooking,getBookingStatus,getBookingDetail} = require("../controllers/booking.controller");
const { getBookingsByStatusForAdmin, handleMarkAsComplete } = require("../controllers/adminController/booking.admin.controller");
const { adminMiddleware } = require("../middleware/adminMiddleware");

const providerBookingController = new ProviderBookingController();

const getProviderBookings = providerBookingController.providerList.bind(providerBookingController);





router.post("/create",authMiddleware,createBooking);
router.get("/provider",authMiddleware,adminProviderMiddleware,getProviderBookings);

// router.get("/user",authMiddleware, getUserBookings);

router.post("/cancel/:bookingId",authMiddleware,cancelBooking);

router.get("/getallbookings",authMiddleware,adminMiddleware,getBookingsByStatusForAdmin);

router.get("/get-booking-status/:bookingId",authMiddleware,getBookingStatus)

router.post("/mark-as-complete/:bookingId",authMiddleware,handleMarkAsComplete)

router.get("/detail/:bookingId",authMiddleware,getBookingDetail);




module.exports = router;