const express = require("express");

const upload = require("../middleware/fileMiddle");

const roomImage = require("../middleware/roomImage");

const {ListRoomPublicController,DetailRoomPublicController} = require("../controllers/public.room");

const {initiateRoomPayment, payToAccessRoom,verifyRoomPayment,initiateGharbetiRoomPayment, verifyGharbetiRoomPayment} = require("../controllers/roompayment.controller");

const router = express.Router();

const {authMiddleware}= require("../middleware/authMiddleware");

const GharbetiRoomController = require("../controllers/gharbetiRoomController");

const {toggleRoomAvailability, fetchRoomDetail} = require("../controllers/room.availability.controller");
const adminGharbetiMiddleware = require("../middleware/gharbetiMiddleware");

router.post("/create", authMiddleware, adminGharbetiMiddleware,roomImage, GharbetiRoomController.create.bind(GharbetiRoomController));

router.put("/update/:id", authMiddleware,adminGharbetiMiddleware, roomImage, GharbetiRoomController.update.bind(GharbetiRoomController));

router.delete("/delete/:id", authMiddleware, adminGharbetiMiddleware, GharbetiRoomController.delete.bind(GharbetiRoomController));

router.get("/my-rooms", authMiddleware, adminGharbetiMiddleware, GharbetiRoomController.list.bind(GharbetiRoomController));

router.get("/my-rooms/:id", authMiddleware, adminGharbetiMiddleware, fetchRoomDetail);

// router.get("/all",authMiddleware)

router.get("/all", ListRoomPublicController);
router.get("/:roomId", DetailRoomPublicController);

router.get("/initiate-payment/:roomId", authMiddleware, initiateRoomPayment);
router.get("/verify-access/:roomId", authMiddleware, payToAccessRoom);

router.post("/verify-payment", authMiddleware, verifyRoomPayment);

router.post("/initiate-gharbeti-payment/", authMiddleware, initiateGharbetiRoomPayment);


router.post("/verify-gharbeti-payment", authMiddleware, verifyGharbetiRoomPayment);



router.put("/toggle-availability/:id", authMiddleware, adminGharbetiMiddleware,toggleRoomAvailability );

module.exports = router;