
const {requestOtpForRegistration,verifyOtpForRegistration,registerUser,loginUser,registerAdmin, getUserProfile, aboutGharbeti, aboutServiceProvider, logoutUser, forgetPassword, resetPassword, updateUserProfile, updateProfile, gharbetiDetail, searchNearbyUsers, searchCandidatesForBusiness, createUserLocation, listUserLocations, deleteUserLocation} = require("../controllers/userController");
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

// Public nearby users search (lat, lng, radius(km), availability, skills)
router.get("/nearby", searchNearbyUsers);

// Public candidate search for businesses (by location + radius)
router.get("/search-candidates", searchCandidatesForBusiness);

// User locations (no auth for now)
router.post("/locations", createUserLocation);
router.get("/locations", listUserLocations);
router.delete("/locations/:id", deleteUserLocation);


router.get("/about/gharbeti",authMiddleware,aboutGharbeti);
router.get("/about/gharbeti-detail",authMiddleware,gharbetiDetail);
router.get("/about/service-provider",authMiddleware,aboutServiceProvider);

router.post("/update-profile",authMiddleware,profileMiddleware,updateProfile);


module.exports = router;