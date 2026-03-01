const express = require("express");

const router = express.Router();

const {getAllUsers, changeUserStatusBlockUnblock, getServiceProviderDetailFromUserId, getUserDetail,getUserAllDetail} = require("../../controllers/userController");
const { adminMiddleware } = require("../../middleware/adminMiddleware");
const { authMiddleware } = require("../../middleware/authMiddleware");
// const { getuserA÷ } = require("../../services/userServices");





router.get("/all",authMiddleware,adminMiddleware, getAllUsers);


router.get("/profile",authMiddleware,)

router.post("/change-status/:userId/:action",authMiddleware,adminMiddleware,changeUserStatusBlockUnblock)


router.get("/provider-detail/:id",authMiddleware,adminMiddleware,getServiceProviderDetailFromUserId);


router.get("/user-detail/:id",authMiddleware,adminMiddleware,getUserDetail)

router.get("/user-all-detail/:id",authMiddleware,adminMiddleware,getUserAllDetail)

module.exports = router;