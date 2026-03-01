

const express = require("express");
const router = express.Router();

const PackageController = require("../controllers/packageController");

const packageController = new PackageController();


const {authMiddleware} = require("../middleware/authMiddleware");
const {adminMiddleware} = require("../middleware/adminMiddleware");
const {adminProviderMiddleware} = require("../middleware/adminProviderMiddleware");


// Create a new package

router.post("/create",authMiddleware,adminProviderMiddleware, packageController.create.bind(packageController));


module.exports = router;