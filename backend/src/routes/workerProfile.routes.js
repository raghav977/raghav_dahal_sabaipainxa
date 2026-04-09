const express = require("express");
const router = express.Router();
const workerProfileController = require("../controllers/workerProfile.controller");
const { authMiddleware } = require("../middleware/authMiddleware");
const multer = require("multer");

// Multer configuration for profile photos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png"];
    if (!allowedMimes.includes(file.mimetype)) {
      cb(new Error("Invalid file type"));
    } else {
      cb(null, true);
    }
  },
});

// Create or update profile (requires auth)
router.post("/", authMiddleware, workerProfileController.createOrUpdateProfile);

// Get current user's profile (requires auth)
router.get("/my-profile", authMiddleware, workerProfileController.getMyProfile);

// Get worker profile by ID (public)
router.get("/:worker_id", workerProfileController.getProfile);

// Search worker profiles (public)
router.get("/search/profiles", workerProfileController.searchProfiles);

// Upload profile photo (requires auth)
router.post(
  "/:worker_id/upload-photo",
  authMiddleware,
  upload.single("profile_photo"),
  workerProfileController.uploadProfilePhoto
);

// Update availability (requires auth)
router.put("/availability/update", authMiddleware, workerProfileController.updateAvailability);

// Add skill (requires auth)
router.post("/skills/add", authMiddleware, workerProfileController.addSkill);

// Remove skill (requires auth)
router.delete("/skills/:skill_id", authMiddleware, workerProfileController.removeSkill);

module.exports = router;
