

const express = require('express');

const router = express.Router();


const {authMiddleware} = require("../middleware/authMiddleware");

const {getNotifications, markNotificationsRead} = require("../controllers/notification.controller");
const { route } = require('./userRoute');
// const { markNotificationsRead } = require('../controllers/notification.controller');


router.get("/",authMiddleware,getNotifications);

router.post("/mark-read",authMiddleware,markNotificationsRead);

module.exports = router;