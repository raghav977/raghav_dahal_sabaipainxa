const express = require("express");
const router = express.Router();
const multer = require("multer");

const jobController = require("../controllers/job.controller");
const { authMiddleware } = require("../middleware/authMiddleware");

// Multer configuration for resume uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      cb(new Error("Only PDF and Word documents allowed"));
    } else {
      cb(null, true);
    }
  },
});

// Public listing
router.get("/", jobController.list.bind(jobController));

// Business-only listing (includes responses/participants)
router.get("/business", authMiddleware, jobController.businessList.bind(jobController));

// Create job (authenticated)
router.post("/create", authMiddleware, jobController.create.bind(jobController));

// Apply to job with resume upload
router.post("/:id/apply", upload.single("resume"), jobController.apply.bind(jobController));

// Retrieve job detail with responses (public)
router.get("/:id", jobController.retrieveWithResponses.bind(jobController));

// Update (owner or admin)
router.put("/:id", authMiddleware, jobController.update.bind(jobController));

// Delete (owner or admin)
router.delete("/:id", authMiddleware, jobController.delete.bind(jobController));

module.exports = router;
