const multer = require('multer');
const path = require('path');
const fs = require('fs');
const responses = require("../http/response");

const UPLOAD_DIR = path.join(__dirname, '../../uploads/services');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Field-specific file filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "images") {
    // Only allow images
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed in 'images' field!"), false);
    }
  } else if (file.fieldname === "documents") {
    // Allow images and PDFs
    if (!file.mimetype.startsWith("image/") && file.mimetype !== "application/pdf") {
      return cb(new Error("Only images or PDFs are allowed in 'documents' field!"), false);
    }
  } else {
    return cb(new Error("Unexpected field"), false);
  }
  cb(null, true);
};

// Multer instance
const upload = multer({ storage, fileFilter });

// Middleware
const serviceImagesUpload = (req, res, next) => {
  const uploadFields = upload.fields([
    { name: "images", maxCount: 8 },
    { name: "documents", maxCount: 5 },
  ]);

  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer Error:", err);
      return responses.badRequest(res, {}, err.message);
    } else if (err) {
      console.error("Error:", err);
      return responses.serverError(res, {}, err.message);
    }

    // Normalize paths for DB
    for (const field in req.files) {
      req.files[field] = req.files[field].map(file => ({
        ...file,
        path: "/" + path.relative(path.join(__dirname, "../../"), file.path).replace(/\\/g, "/")
      }));
    }

    console.log("Files ready for DB:", req.files);
    next();
  });
};

module.exports = serviceImagesUpload;
