const multer = require("multer");
const path = require("path");
const fs = require("fs");
const responses = require("../http/response");

// Upload folder for room images
const UPLOAD_DIR = path.join(__dirname, "../../uploads/rooms");

// Create folder if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

// Multer instance
const upload = multer({ storage, fileFilter });

// Middleware function for multiple room images
const roomImagesUpload = (req, res, next) => {
  // "images" is the field name from frontend, max 10 files
  const uploadFields = upload.array("images", 10);

  uploadFields(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (file size, maxCount etc.)
      return responses.badRequest(res, {}, err.message);
    } else if (err) {
      // Other errors
      return responses.serverError(res, {}, err.message);
    }
    // Success → continue to controller
    next();
  });
};

module.exports = roomImagesUpload;
