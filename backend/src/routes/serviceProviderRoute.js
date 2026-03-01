const express = require('express');
const router = express.Router();


const ServiceProviderServiceController = require("../controllers/serviceProviderController");
const serviceProviderServiceController = new ServiceProviderServiceController();


const {authMiddleware} = require("../middleware/authMiddleware");
const {adminProviderMiddleware} = require("../middleware/adminProviderMiddleware");
const serviceImagesUpload = require('../middleware/serviceImage');

const {getProviderDashboardMetricsData} = require("../controllers/provider.dashboard.controller");
// List all service providers with search, filter, pagination, ordering
router.get("/services",authMiddleware,adminProviderMiddleware, serviceProviderServiceController.list.bind(serviceProviderServiceController));

// Get details of a specific service provider by ID
router.get("/services/:id",authMiddleware,adminProviderMiddleware, serviceProviderServiceController.retrieve.bind(serviceProviderServiceController));
// You can add more 

// adding a image upload for the service provider service

router.post("/services/:id/upload",authMiddleware,adminProviderMiddleware,serviceImagesUpload, serviceProviderServiceController.uploadImages.bind(serviceProviderServiceController));


// routefor fetching only title,rate,description,status,createdat,updatedat,location,id of serviceprovider services

router.get("/service/summary",authMiddleware,adminProviderMiddleware, serviceProviderServiceController.listOnlySpecificFields.bind(serviceProviderServiceController));


router.get("/dashboard",authMiddleware,adminProviderMiddleware,getProviderDashboardMetricsData);

module.exports = router;    