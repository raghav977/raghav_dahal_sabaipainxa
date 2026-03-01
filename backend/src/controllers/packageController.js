const responses = require("../http/response");
const Package = require("../models/package");
const ServiceProviderServices = require("../models/ServiceProviderService");
const Service = require("../models/Services");
const BaseController = require("./baseController");



class PackageController extends BaseController{
   constructor(){
    super(Package,{
        searchFields:["name"],
    });
   }

//    override new package for validaiton haru pani


    async create(req,res){
        const user = req.user;
        const data = req.body;
        if(!user){
            return responses.unauthorized(res, "User not authenticated");
        }
        if(!data.serviceProviderServiceId){
            return responses.badRequest(res, "serviceProviderServiceId is required to create a package");
        }
        
        if(!data.name || !data.description || !data.price){
            return responses.badRequest(res, "name, description and price are required fields");
        }

        if(Number(data.price) < 0){
            return responses.badRequest(res, "price cannot be negative");
        }

        if(data.includes && !Array.isArray(data.includes)){
            return responses.badRequest(res, "includes must be an array");
        }

        // check if that serviceproviderservice service has package_enabled true or false

        const serviceProviderService = await ServiceProviderServices.findOne({
            where:{id:data.serviceProviderServiceId},
            include:[{
                model:Service,
                attributes:["package_enabled","name"]
            }]
        });

        if(!serviceProviderService){
            return responses.badRequest(res, "Invalid serviceProviderServiceId");
        }

        if(!serviceProviderService.Service.package_enabled){
            return responses.badRequest(res, `Packages cannot be added to the service ${serviceProviderService.Service.name} as it does not support packages.`);
        }

        // Create the package
        const pck = await Package.create({
            ...data,
            serviceProviderServiceId: serviceProviderService.id
        });

        return responses.created(res, {pck}, "Package created successfully");
    }
}







module.exports = PackageController