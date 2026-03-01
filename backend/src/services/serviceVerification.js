const ServiceProviderServices = require("../models/ServiceProviderService");
const sendEmail = require("./emailService");


const verifyServiceProviderServiceWala = async(user,status,rejected_message=null,serviceProviderServiceId)=>{
    try{
        const serviceProviderService = await ServiceProviderServices.findOne({where:{id:serviceProviderServiceId}});
        if(!serviceProviderService){
            throw new Error("Service Provider Service not found");
        }

        if(serviceProviderService.status === "approved"){
            throw new Error("Service Provider Service is already approved");
        }
        if(serviceProviderService.status === "rejected"){
            throw new Error("Service Provider Service is already rejected");
        }

        

        serviceProviderService.status = status;
        if(status === "rejected" && rejected_message){
            serviceProviderService.status = "rejected";
            serviceProviderService.rejected_reason = rejected_message;
            const sendMail = await sendEmail(user.email,"Service Provider Service Rejected",`Your service provider service has been rejected for the following reason: ${rejected_message}`);
            if(!sendMail){
                console.error("Failed to send rejection email to user:", user.email);
                throw new Error("Failed to send rejection email");
            }
        }
        if(status === "approved"){
            serviceProviderService.status = "approved";
            serviceProviderService.rejected_reason = null;
            const sendMail = await sendEmail(user.email,"Service Provider Service Approved","Your service provider service has been approved. You can now start offering this service to customers.");
            if(!sendMail){
                console.error("Failed to send approval email to user:", user.email);
                throw new Error("Failed to send approval email");
            }
        }
        await serviceProviderService.save();
        return serviceProviderService;


        
    }
    catch(err){
        console.error("Error verifying service provider service:", err);
        throw new Error("Error verifying service provider service");
    }
}

const getServiceProviderServiceByStatus = async(status=null)=>{
    try{
        let whereClause = {};
        if(status){
            whereClause.status = status;
        }
        const services = await ServiceProviderServices.findAll({where:whereClause});
        return services;
    }
    catch(err){
        console.error("Error fetching service provider services by status:", err);
        throw new Error("Error fetching service provider services by status");
    }
    
}

module.exports = {verifyServiceProviderServiceWala,getServiceProviderServiceByStatus};