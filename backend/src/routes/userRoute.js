
const {requestOtpForRegistration,verifyOtpForRegistration,registerUser,loginUser,registerAdmin, getUserProfile, aboutGharbeti, aboutServiceProvider, logoutUser, forgetPassword, resetPassword, updateUserProfile, updateProfile, gharbetiDetail} = require("../controllers/userController");
const { adminProviderMiddleware } = require("../middleware/adminProviderMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");


const {rateLimit} = require("express-rate-limit")

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  message: "Too many OTP requests from this IP, please try again later."
});
const profileMiddleware = require("../middleware/profileImage");


const router = require("express").Router();
router.post("/request-otp", requestOtpForRegistration);
router.post("/verify-otp", verifyOtpForRegistration);
router.post("/register", registerUser);

router.post("/login", loginUser);


router.post("/logout", authMiddleware, logoutUser);



router.post("/register-admin", registerAdmin)

router.post("/forget-password",forgetPassword)

router.post("/reset-password",resetPassword)




router.get("/profile",authMiddleware,getUserProfile);


router.get("/about/gharbeti",authMiddleware,aboutGharbeti);
router.get("/about/gharbeti-detail",authMiddleware,gharbetiDetail);
router.get("/about/service-provider",authMiddleware,aboutServiceProvider);

router.post("/update-profile",authMiddleware,profileMiddleware,updateProfile);


module.exports = router;