const router = require("express").Router();
// const = require("../controllers/serviceController");
const {addProviderService, getServiceCategory, fetchMyServices, getAllServicesList, fetchServiceDetailById, toggleServiceProviderServiceStatus} = require("../controllers/serviceController");


const {authMiddleware}= require("../middleware/authMiddleware");
const {adminProviderMiddleware} = require("../middleware/adminProviderMiddleware");
const serviceImagesUpload = require("../middleware/serviceImage");
// authentication middleware

// // adding the services
router.post("/add",authMiddleware,adminProviderMiddleware,serviceImagesUpload, addProviderService);

// // get service categories

router.get("/categories",getServiceCategory);


// Fetch my services

router.get("/my-services",authMiddleware,fetchMyServices);
// Get all services
const {GetService} = require("../controllers/serviceController");
const getServiceInstance = new GetService();
router.get("/",authMiddleware, getServiceInstance.list.bind(getServiceInstance));
// delete the serviceprovider service by id

const {GetServicePictureTitle} = require("../controllers/serviceController");
const getServicePictureTitle = new GetServicePictureTitle();


const ServiceProviderServiceController = require("../controllers/serviceProviderController");

const serviceProviderServiceController = new ServiceProviderServiceController();


router.delete("/delete/:id",authMiddleware,adminProviderMiddleware, getServiceInstance.delete.bind(getServiceInstance));

router.get("/service-picture", getServicePictureTitle.list.bind(getServicePictureTitle));

router.get("/service-detail/:id",fetchServiceDetailById);

router.get("/service",getAllServicesList)

router.get("/summary",authMiddleware,adminProviderMiddleware, serviceProviderServiceController.listOnlySpecificFields.bind(serviceProviderServiceController));

router.patch("/toggle-active-status/:id", authMiddleware, adminProviderMiddleware, toggleServiceProviderServiceStatus);
module.exports = router;