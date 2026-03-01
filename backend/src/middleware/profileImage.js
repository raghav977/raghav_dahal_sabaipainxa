// ...existing code...
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const responses = require("../http/response");

// store profile uploads under /uploads/profilelinkkkk (public URL will be /uploads/profilelinkkkk/<file>)
const PUBLIC_DIR_NAME = "profile";
const PUBLIC_PATH = `/uploads/${PUBLIC_DIR_NAME}`;
const UPLOAD_DIR = path.join(__dirname, `../../uploads/${PUBLIC_DIR_NAME}`);
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

const profileMiddleware = (req, res, next) => {
    const uploadSingle = upload.single('profile_image');
    
    uploadSingle(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(500).json({ message: err.message });
        }

        // attach a public URL to the uploaded file (so controllers can store/use it)
        if (req.file && req.file.filename) {
            req.file.profile_url = `${PUBLIC_PATH}/${req.file.filename}`;
        }

        console.log("Profile image upload middleware passed, public url:", req.file && req.file.profile_url);
        next();
    });
};

module.exports = profileMiddleware;
// ...existing code...