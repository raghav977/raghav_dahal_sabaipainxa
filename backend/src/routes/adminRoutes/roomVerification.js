const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../../middleware/authMiddleware");
const {adminMiddleware} = require("../../middleware/adminMiddleware");

const {RoomVerificationController,getAllRoomPayments,getRoomDetail} = require("../../controllers/adminController/roomVerification");

const roomVerificationController = new RoomVerificationController();

// approve a room
router.put("/approve/:id", authMiddleware, adminMiddleware, roomVerificationController.approveRoom.bind(roomVerificationController));

router.put("/reject/:id", authMiddleware, adminMiddleware, roomVerificationController.rejectRoom.bind(roomVerificationController));

// list all rooms with pending status
router.get("/status", authMiddleware, adminMiddleware, roomVerificationController.list.bind(roomVerificationController));

router.get("/room-payments", authMiddleware, adminMiddleware, getAllRoomPayments);

router.get("/room-detail/:id", authMiddleware, adminMiddleware, getRoomDetail);

module.exports = router;
