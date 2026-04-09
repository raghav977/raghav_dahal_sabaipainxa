const express = require("express");
const router = express.Router();
const multer = require("multer");

const { authMiddleware } = require("../middleware/authMiddleware");
const websiteController = require("../controllers/websiteBuilder.controller");

// Configure multer for memory storage (we'll handle file saving in controller)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Public route - get website by slug (no auth required)
router.get("/preview/:slug", websiteController.getWebsiteBySlug);

// Protected routes - require authentication
router.use(authMiddleware);

// Create a new website
router.post("/", websiteController.createWebsite);

// Get all websites for authenticated user's business account
router.get("/", websiteController.getBusinessWebsites);

// Get a specific website
router.get("/:website_id", websiteController.getWebsite);

// Upload image for website
router.post("/:website_id/upload-image", upload.single("image"), websiteController.uploadWebsiteImage);

// Update website (theme, pages, seo, settings)
router.put("/:website_id", websiteController.updateWebsite);

// Publish/Unpublish website
router.patch("/:website_id/publish", websiteController.togglePublish);

// Set custom domain
router.patch("/:website_id/domain", websiteController.setCustomDomain);

// Delete website
router.delete("/:website_id", websiteController.deleteWebsite);

module.exports = router;
