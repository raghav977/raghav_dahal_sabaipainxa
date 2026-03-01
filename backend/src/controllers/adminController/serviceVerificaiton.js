
const ServiceProvider = require("../../models/ServiceProvider");
const Gharbeti = require("../../models/Gharbeti");
const Kyc = require("../../models/Kyc");

const  sendMail  = require("../../services/emailService");
const { getUserRole } = require("../../services/userServices");
const responses = require("../../http/response");
const { fieldsValidation } = require("../../services/validationServices");
const { createService, deleteService, updateService } = require("../../services/servicesd");
const { verifyServiceProviderServiceWala } = require("../../services/serviceVerification");

const ServiceProviderService = require("../../models/ServiceProviderService");
const Service = require("../../models/Services");
const ServiceDocument = require("../../models/ServiceDocument");
const User = require("../../models/User");


const getServiceProviderServiceByStatus = async (req, res) => {
    try {
        const { status, is_active, limit = 10, offset = 0 } = req.query;

        // Validate status
        const validStatuses = ["pending", "approved", "rejected", "all"];
        if (status && !validStatuses.includes(status)) {
            return responses.badRequest(res, "Invalid status value");
        }

        const where = {};
        if (status && status !== "all") where.status = status;

        if (typeof is_active !== "undefined") {
            if (is_active !== "true" && is_active !== "false") {
                return responses.badRequest(res, "is_active must be 'true' or 'false'");
            }
            where.is_active = is_active === "true";
        }

        const services = await ServiceProviderService.findAndCountAll({
            where,
            include: [
                {
                    model: ServiceProvider,
                    attributes: ["id", "is_verified"],
                    include: [
                        {
                            model: User,
                            attributes: ["id", "name", "email"],
                        },
                    ],
                },
                {
                    model: Service,
                    attributes: ["id", "name"],
                },
                {
                    model: ServiceDocument,
                    attributes: ["id", "document_path", "document_type"],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        const results = services.rows.map((service) => ({
            serviceId: service.id,
            serviceName: service.Service?.name || "N/A",
            description: service.description || "",
            documentUrls: service.ServiceDocuments?.map((doc) => doc.document_path) || [],
            serviceProviderName: service.ServiceProvider?.user?.name || "N/A",
            serviceProviderEmail: service.ServiceProvider?.user?.email || "N/A",
            status: service.status,
            is_active: service.is_active,
            reapplied: !!service.isReapplied,
            providerVerified: !!service.ServiceProvider?.is_verified,
            rejectedReason: service.rejected_reason || null,
        }));

        return res.json({
            status: "success",
            code: 200,
            message: "Service provider services fetched successfully",
            data: {
                total: services.count,
                limit: parseInt(limit),
                offset: parseInt(offset),
                results,
            },
        });
    } catch (err) {
        console.error("Error fetching services:", err);
        return responses.serverError(res, "Unable to fetch services");
    }
};


const addServices = async(req,res,next)=>{
    const user = req.user;
    const {name,package_enabled=false} = req.body;

    const validate = fieldsValidation(name);

    if(!validate){
        return responses.badRequest(res, "service name is required");
    }

    const newService = await createService(name,package_enabled);
    if(!newService){
        return responses.internalServerError(res, "Unable to create service");
    }



    return responses.created(res,{newService}, "Service added successfully");

}



const deleteServiceReq = async(req,res,next)=>{
    const user = req.user;
    const serviceId = req.params.serviceId;
    if(!serviceId){
        return responses.badRequest(res, "Service ID is required");
    }
    const service = await deleteService(serviceId);
    if(!service){
        return responses.notFound(res, "something went wrong ");
    }
    return responses.success(res, {}, "Service deleted successfully");
}

const updateServiceReq = async(req,res,next)=>{
    try{
        const user = req.user;
        const id = req.params.id;
        const { name,package_enabled } = req.body;
        if(!id){
            return responses.badRequest(res, "Service ID is required");
        }
        const validate = fieldsValidation(name);
        if(!validate){
            return responses.badRequest(res, "Service name is required");
        }
        const updatedService = await updateService(id, name, package_enabled);
        if(!updatedService){
            return responses.serverError(res, "Unable to update service");
        }
        return responses.success(res,{updatedService}, "Service updated successfully");
    }
    catch(err){
        console.log("Something went wrong in updating service:", err);
        return responses.serverError(res, "Unable to update service");
    }
}


const handlePackageToogle = async(req,res,next)=>{
    try{
        const user = req.user;
        const { serviceId, package_enabled } = req.body;
        if(!serviceId){
            return responses.badRequest(res, "Service ID is required");
        }
        if(package_enabled === undefined){
            return responses.badRequest(res, "package_enabled field is required");
        }
        const service = await Service.findByPk(serviceId);
        if(!service){
            return responses.notFound(res, "Service not found");
        }
        service.package_enabled = package_enabled;
        await service.save();
        return responses.success(res,{service}, "Service package status updated successfully");
    }
    catch(err){
        console.log("Something went wrong in updating service package status:", err);
        return responses.serverError(res, "Unable to update service package status");
    }
}



// service provider service verification controller functions 

const verifyServiceProviderService = async(req,res,next)=>{
    try{
        const user = req.user;
        const serviceProviderServiceId = req.params.id;

        const { status,rejected_reason } = req.body;
        if(!status || (status !== "approved" && status !== "rejected")){
            return responses.badRequest(res, "Status must be either 'approved' or 'rejected'");
        }

        if(!serviceProviderServiceId){
            return responses.badRequest(res, "Service Provider Service ID is required");
        }

        const isVerified = await verifyServiceProviderServiceWala(user,status,rejected_reason,serviceProviderServiceId);
        if(!isVerified){
            return responses.serverError(res, "Unable to verify service provider service");
        }

        return responses.success(res, { isVerified }, "Service provider service verified successfully");
    }
    catch(err){
        console.error("Error verifying service provider service:", err);
        return responses.serverError(res, "Unable to verify service provider service");
    }
}


const toogleServiceProviderServiceActiveStatus = async(req,res,next)=>{
    try{
        const user = req.user;
        const serviceProviderServiceId = req.params.id;
        const { is_active } = req.body;

        if(is_active === undefined){
            return responses.badRequest(res, "is_active field is required");
        }
        if(is_active !== true && is_active !== false){
            return responses.badRequest(res, "is_active must be a boolean value");
        }

        if(!serviceProviderServiceId){
            return responses.badRequest(res, "Service Provider Service ID is required");
        }

        const serviceProviderService = await ServiceProviderService.findByPk(serviceProviderServiceId);
        if(!serviceProviderService){
            return responses.notFound(res, "Service Provider Service not found");
        }
        if(serviceProviderService.status !== "approved"){
            return responses.badRequest(res, "Only approved services can have their active status toggled");
        }

        const serviceProvider = await ServiceProvider.findByPk(serviceProviderService.serviceProviderId);
        if(!serviceProvider){
            return responses.notFound(res, "Service Provider not found");
        }
        const serviceProviderUser = await User.findByPk(serviceProvider.userId);
        if(!serviceProviderUser){
            return responses.notFound(res, "Service Provider User not found");
        }

        const email = serviceProviderUser.email;





        serviceProviderService.is_active = is_active;
        await serviceProviderService.save();

       const mailSent =  await sendMail(email,"Service Status Updated",`Your service "${serviceProviderService.description}" has been ${is_active ? "activated" : "deactivated"} by the admin.`);
        if(!mailSent){
            console.error("Failed to send status update email to user:", email);
            return responses.serverError(res, "Failed to send status update email");
        }

        return responses.success(res, { serviceProviderService }, "Service provider service active status updated successfully");
    }
    catch(err){
        console.error("Error updating service provider service active status:", err);
        return responses.serverError(res, "Unable to update service provider service active status");
    }
}

module.exports = {addServices, deleteServiceReq, updateServiceReq, verifyServiceProviderService, getServiceProviderServiceByStatus, handlePackageToogle, toogleServiceProviderServiceActiveStatus};
