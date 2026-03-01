const { Op, literal, where: seqWhere } = require("sequelize");

const { ServiceProviderService, ServiceLocation, ServiceSchedules, ServiceImages, Package } = require("../database/relation");
const responses = require("../http/response");
const ServiceProvider = require("../models/ServiceProvider");
const Service = require("../models/Services");
const { addServiceProivderService, getMyServices } = require("../services/servicesd");
const BaseController = require("./baseController");


const {getDistanceInKm} = require("../helper_functions/distance_calculation");
const { response } = require("../app");
const { toogleServiceProviderServiceActiveStatus } = require("./adminController/serviceVerificaiton");


const addProviderService = async(req,res,next)=>{

    const user = req.user;
    const files = req.files || {};
    const data = req.body;

    console.log("User object in addProviderService controller is:", user);
    let newServiceProviderService=null;
    try{

         newServiceProviderService = await addServiceProivderService(user,data,files);
    }
    catch(err){
        console.error("Error in addProviderService controller:", err);
        return responses.serverError(res, err.message || "An error occurred while adding the service.");
    }
    if(!newServiceProviderService){
        return responses.serverError(res, "Unable to add service");
    }
    console.log("this is the new service provider service:", newServiceProviderService);
    return responses.created(res,{newServiceProviderService}, "Service added successfully. Do you want to add packages?");
}

const getServiceCategory = async(req,res,next)=>{
    try{
        const category = await Service.findAll({
            attributes:["name","id","package_enabled"],
        })
        return responses.success(res,{category}, "Service categories fetched successfully");
    }
    catch(err){
        console.error("Error in getServiceCategory:", err);
        return responses.serverError(res, {}, "An error occurred while fetching service categories.");
    }
}


const fetchMyServices = async(req,res,next)=>{
    const user = req.user;
    try{
        const services = await getMyServices(user);
        return responses.success(res,{services}, "Services fetched successfully");
    }
    catch(err){
        console.error("Error in getMyServices controller:", err);
        return responses.serverError(res, {}, "An error occurred while fetching your services.");
    }
}


class GetService extends BaseController {
  constructor() {
    super(ServiceProviderService, {
      searchFields: ["description"], 
      filterFields: ["status", "serviceId"], 
      defaultLimit: 2,
      defaultOrder: [["createdAt", "DESC"]],
    });
  }

  
  async list(req, res) {
  try {
    const user = req.user;

    console.log("User object in GetService controller is:", user);
    if(!user.is_active){
      return responses.badRequest(res,"This profile is blocked")

    }

    const serviceProvider = await ServiceProvider.findOne({
      where: { userId: user.id },
    });

    console.log("Service provider found:", serviceProvider);

    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Service Provider not found for this user.",
      });
    }

    const limit = parseInt(req.query.limit) || this.defaultLimit;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || null;
    const ordering = req.query.ordering || null;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const latitude = req.query.latitude ? parseFloat(req.query.latitude) : null;
    const longitude = req.query.longitude ? parseFloat(req.query.longitude) : null;
    const radius = req.query.radius ? parseFloat(req.query.radius) : null; 

    const where = { serviceProviderId: serviceProvider.id };

    // 🔍 Text search
    if (search && this.searchFields.length > 0) {
      where[Op.or] = this.searchFields.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }

   
    this.filterFields.forEach((field) => {
      if (req.query[field]) {
        where[field] = req.query[field];
      }
    });

    
    if (minPrice !== null || maxPrice !== null) {
      where.rate = {};
      if (minPrice !== null) where.rate[Op.gte] = minPrice;
      if (maxPrice !== null) where.rate[Op.lte] = maxPrice;
    }

   
    let locationFilter = {};
    if (latitude && longitude && radius) {
      const { fn, col, literal } = require("sequelize");
      
      const distanceQuery = literal(`
        (6371 * acos(
          cos(radians(${latitude}))
          * cos(radians(latitude))
          * cos(radians(longitude))
          * cos(radians(${longitude}))
          + sin(radians(${latitude}))
          * sin(radians(latitude))
        ))
      `);

      locationFilter = {
        [Op.and]: fn("", distanceQuery),
      };
    }

    // 🧾 Ordering
    let order = this.defaultOrder;
    if (ordering) {
      const orderFields = ordering.split(",");
      order = orderFields.map((field) =>
        field.startsWith("-")
          ? [field.substring(1), "DESC"]
          : [field, "ASC"]
      );
    }

    // 🔄 Fetch data
    const { count, rows } = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        {
          model: Service,
          attributes: ["name", "package_enabled"],
        },
        {
          model: ServiceLocation,
          attributes: ["address", "latitude", "longitude"],
        },
        {
          model: ServiceImages,
          attributes: ["image_path"],
        },
        {
          model: Package,
          attributes: ["id", "name", "price", "description"],
        },
        {
          model: ServiceSchedules,
          attributes: ["day_of_week", "start_time", "end_time"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      total: count,
      limit,
      offset,
      next: offset + limit < count ? offset + limit : null,
      previous: offset - limit >= 0 ? offset - limit : null,
      results: rows,
    });
  } catch (err) {
    console.error("Error fetching service provider services:", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    });
  }
}

async delete(req, res) {
    try {
      const id = req.params.id;
      const user = req.user;

      console.log("User object in delete method is:", user);

      const serviceProvider = await ServiceProvider.findOne({
        where: { userId: user.id },
      });

      if (!serviceProvider) {
        return res.status(404).json({
          success: false,
          message: "Service Provider not found for this user.",
        });
      }

      const service = await this.model.findOne({
        where: { id, serviceProviderId: serviceProvider.id },
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found or does not belong to this provider.",
        });
      }

      await service.destroy();

      return res.status(200).json({
        success: true,
        message: "Service deleted successfully.",
      });
    } catch (err) {
      console.error("Error deleting service provider service:", err);
      return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
      });
    }
  }

}

const toggleServiceProviderServiceStatus = async (req, res, next) => {
  const serviceProviderServiceId = req.params.id;
  const user = req.user;
  const { status, is_active } = req.body;
  // accept either `status` or `is_active` for compatibility
  const newStatus = typeof is_active !== "undefined" ? is_active : status;

  try {
    const serviceProvider = await ServiceProvider.findOne({ where: { userId: user.id } });
    if (!serviceProvider) {
      return responses.notFound(res, "Service Provider not found for this user.");
    }

    const serviceProviderService = await ServiceProviderService.findOne({ where: { id: serviceProviderServiceId, serviceProviderId: serviceProvider.id } });
    if (!serviceProviderService) {
      return responses.notFound(res, "Service not found or does not belong to this provider.");
    }

    if (newStatus !== true && newStatus !== false) {
      return responses.badRequest(res, {}, "Invalid status value. Must be true or false.");
    }

    serviceProviderService.is_active = newStatus;
    await serviceProviderService.save();
    return responses.success(res, { serviceProviderService }, `Service ${newStatus ? "activated" : "deactivated"} successfully.`);
  } catch (err) {
    console.error("Error in deactivateService controller:", err);
    return responses.serverError(res, {}, "An error occurred while deactivating the service.");
  }
};


const getAllServicesList = async(req,res,next)=>{
    try{
        const services = await Service.findAll({
            attributes:["id","name","package_enabled"],
            order:[["name","ASC"]]
        });
        return responses.success(res,{services}, "Services fetched successfully");
    }
    catch(err){
        console.error("Error in getAllServicesList controller:", err);
        return responses.serverError(res, {}, "An error occurred while fetching services.");
    }
}



// get services picture title, and id only for frontend display

class GetServicePictureTitle extends BaseController {
  constructor() {
    super(ServiceProviderService, {
      searchFields: ["description"], 
      filterFields: ["status", "serviceId"], 
      defaultLimit: 10,
      defaultOrder: [["createdAt", "DESC"]],
    });
  }

async list(req, res) {
  try {
    console.log("🌍 Public GetServicePictureTitle list called");
    console.log("Request query parameters:", req.query);

    const limit = parseInt(req.query.limit) || this.defaultLimit;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || null;
    const ordering = req.query.ordering || null;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const serviceId = req.query.serviceId ? parseInt(req.query.serviceId) : null;
    const latitude = req.query.latitude ? parseFloat(req.query.latitude) : null;
    const longitude = req.query.longitude ? parseFloat(req.query.longitude) : null;
    const radius = req.query.radius ? parseFloat(req.query.radius) : null; // in km

    const status = "approved"; 
    // also only fetch approved services for public view and is_active = true
    const is_active = true;
    const where = { status, is_active };


    if (search && this.searchFields.length > 0) {
      where[Op.or] = this.searchFields.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }

    // 🎯 Filtering by category (serviceId)
    if (serviceId) {
      where.serviceId = serviceId;
    }

    // 💰 Price range filter
    if (minPrice !== null || maxPrice !== null) {
      where.rate = {};
      if (minPrice !== null) where.rate[Op.gte] = minPrice;
      if (maxPrice !== null) where.rate[Op.lte] = maxPrice;
    }

    // 📍 Location-based filtering
    let locationFilter = null;

    if (latitude && longitude && radius) {
      const distanceQuery = literal(`
        (6371 * acos(
          cos(radians(${latitude})) 
          * cos(radians(latitude)) 
          * cos(radians(longitude) - radians(${longitude})) 
          + sin(radians(${latitude})) 
          * sin(radians(latitude))
        ))
      `);

      locationFilter = seqWhere(distanceQuery, { [Op.lte]: radius });
    }


    let order = this.defaultOrder;
    if (ordering) {
      const orderFields = ordering.split(",");
      order = orderFields.map((field) =>
        field.startsWith("-")
          ? [field.substring(1), "DESC"]
          : [field, "ASC"]
      );
    }


    const excluded_attributes = ["contact", "note", "rejection_reason", "updatedAt","isReapplied","reappliedCount","includes","status","rejected_reason","deletedAt"];
    const { count, rows } = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      attributes: { exclude: excluded_attributes },
      include: [
        {
          model: Service,
          attributes: ["id", "name"],
        },
        // {
        //   model: ServiceLocation,
        //   attributes: ["address", "latitude", "longitude"],
        //   ...(locationFilter ? { where: locationFilter } : {}),
        // },
        {
          model: ServiceImages,
          attributes: ["image_path"],
        },
        // {
        //   model: Package,
        //   attributes: ["id", "name", "price", "description"],
        // },
        // {
        //   model: ServiceSchedules,
        //   attributes: ["day_of_week", "start_time", "end_time"],
        // },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Public services fetched successfully",
      total: count,
      limit,
      offset,
      next: offset + limit < count ? offset + limit : null,
      previous: offset - limit >= 0 ? offset - limit : null,
      results: rows,
    });
  } catch (err) {
    console.error("❌ Error fetching public services:", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Internal server error",
    });
  }
}



}


const fetchServiceDetailById = async (req, res, next) => {
  const serviceId = req.params.id;
  const { lat: customerLat, lon: customerLon } = req.query;
  console.log("Query parameters received in fetchServiceDetailById:", req.query.lat);

  console.log("Fetching service details for ID:", serviceId, "at customer location:", customerLat, customerLon);

  try {
    const serviceDetail = await ServiceProviderService.findOne({
      where: { id: serviceId },
      include: [
        { model: Service, attributes: ["name", "package_enabled"] },
        { model: ServiceLocation, attributes: ["address", "city", "ward", "latitude", "longitude", "radius"] },
        { model: ServiceSchedules, attributes: ["id", "day_of_week", "start_time", "end_time"] },
        { model: ServiceImages, attributes: ["image_path"] },
        { model: Package, attributes: ["id", "name", "price", "description", "includes", "note"] }
      ]
    });

    if (!serviceDetail) {
      return responses.notFound(res, "Service not found");
    }

    let locationsWithDistance = [];
    let isAvailable = true;

    if (customerLat && customerLon) {
      locationsWithDistance = serviceDetail.ServiceLocations.map(loc => {
        const distance = getDistanceInKm(
          parseFloat(customerLat),
          parseFloat(customerLon),
          loc.latitude,
          loc.longitude
        );
        return { ...loc.toJSON(), distance };
      });

      // Available if any location’s distance >= radius
      isAvailable = locationsWithDistance.some(loc => loc.distance <= loc.radius);
    } else {
      locationsWithDistance = serviceDetail.ServiceLocations.map(loc => loc.toJSON());
    }

    return responses.success(res, {
      serviceDetail: {
        ...serviceDetail.toJSON(),
        ServiceLocations: locationsWithDistance,
        isAvailable, // ✅ added inside serviceDetail
        availabilityMessage: isAvailable ? null : `This provider is not available in your location.`
      }
    }, "Service details fetched successfully");

  } catch (err) {
    console.error("Error in fetchServiceDetailById controller:", err);
    return responses.serverError(res, {}, "An error occurred while fetching service details.");
  }
};





module.exports = {
  addProviderService,
  getServiceCategory,
  fetchMyServices,
  GetService,
  getAllServicesList,
  GetServicePictureTitle,
  fetchServiceDetailById,
  toogleServiceProviderServiceActiveStatus,
  // export provider-side toggle handler so providers can toggle their own services
  toggleServiceProviderServiceStatus,
};