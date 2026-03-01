
const router = require("express").Router();

const {addServices, deleteServiceReq, updateServiceReq, verifyServiceProviderService,getServiceProviderServiceByStatus, handlePackageToogle,toogleServiceProviderServiceActiveStatus} = require("../../controllers/adminController/serviceVerificaiton");

const {authMiddleware}= require("../../middleware/authMiddleware");

const {adminMiddleware} = require("../../middleware/adminMiddleware");

const AdminServiceController = require("../../controllers/adminController/services.controller");

const adminController = new AdminServiceController();

// get all services
router.get("/",authMiddleware,adminMiddleware, adminController.list.bind(adminController));

// toogle package enabled or disabled for a service

router.put("/package-toggle", authMiddleware, adminMiddleware, handlePackageToogle);



router.post("/add", authMiddleware, adminMiddleware, addServices);
router.delete("/delete/:serviceId", authMiddleware, adminMiddleware, deleteServiceReq);
router.put("/edit/:id", authMiddleware, adminMiddleware, updateServiceReq);

router.put("/toogle-service-status/:id",authMiddleware,adminMiddleware,toogleServiceProviderServiceActiveStatus);



router.post("/verifyservice/:id",authMiddleware,adminMiddleware,verifyServiceProviderService);


router.get("/status",authMiddleware,adminMiddleware,getServiceProviderServiceByStatus);

module.exports = router;