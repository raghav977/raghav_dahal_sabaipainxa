const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const messages = require("../http/messages");
const responses = require("../http/response");
const UPLOAD_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    }
    ,
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
  return cb(new Error('Only image and PDF files are allowed!'), false);
}

    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: fileFilter });

const fileMid = (req, res, next) => {
    const uploadFields = upload.fields([
        { name: 'passport_photo', maxCount: 1 },
        { name: 'citizenship_front', maxCount: 1 },
        { name: 'citizenship_back', maxCount: 1 },
        { name: 'citizenship_card_front', maxCount: 1 },
        { name: 'citizenship_card_back', maxCount: 1 },
        { name: 'document_file', maxCount: 1 }
    ]);

    uploadFields(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            return responses.badRequest(res, {}, err.message);
        } else if (err) {
            return responses.serverError(res, {}, err.message);
        }
        next();
    });
};
module.exports = fileMid;