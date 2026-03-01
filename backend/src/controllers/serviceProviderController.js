const BaseController = require("./baseController");


const responses = require("../http/response");

const {Op} = require("sequelize");
const ServiceProviderServices = require("../models/ServiceProviderService");
const ServiceSchedules = require("../models/Schedule");
const ServiceLocation = require("../models/Location");
const ServiceDocument = require("../models/ServiceDocument");
const ServiceImages = require("../models/ServiceImages");
const Package = require("../models/package");
const { getServiceProviderFromUserId, getUserRole } = require("../services/userServices");
const Service = require("../models/Services");

class ServiceProviderServiceController extends BaseController{
    constructor(){
        super(ServiceProviderServices),{
            searchFields:["description"],
            filterFields:["status"],
            defaultLimit:2,

        }

    }

    // fetchserviceprovideronlytitle,rate,description,status,createdat,updatedat,location,id

 async listOnlySpecificFields(req, res) {
  console.log("🌍 Inside public listOnlySpecificFields method");
  try {
    console.log("Query parameters received:", req.query);

    const {
      search,
      filter,
      page,
      limit,
      orderBy,
      orderDirection,
      minPrice,
      maxPrice,
      latitude,
      longitude,
      radius,
    } = req.query;

    console.log("this is limit", limit);
    console.log("this is page", page);

    const whereClause = {};

    const user = req.user;
    if (!user) {
      return responses.unauthorized(res, "User not authenticated");
    }

    console.log("This is user", user);


    let roles = [];
    const roleRecords = await getUserRole(user);
    for (const r of roleRecords) {
      console.log("This is name", r.name);
      roles.push(r.name);
    }
    console.log("This is roles array", roles);


    if (!roles.includes("Admin")) {
      if (roles.includes("Service_provider")) {
        const serviceProvider = await getServiceProviderFromUserId(user.id);
        if (!serviceProvider) {
          return responses.notFound(res, "Service provider not found for user");
        }
        whereClause.serviceProviderId = serviceProvider.id;
      } else {
        return responses.forbidden(
          res,
          "You are not authorized to view these services."
        );
      }
    }

    console.log("Constructed whereClause:", whereClause);


    if (search) {
      whereClause[Op.or] = this.searchFields.map((field) => ({
        [field]: { [Op.iLike]: `%${search}%` },
      }));
    }

    console.log("Where clause after search:", whereClause);


    if (filter) {
      try {
        const filterObj = JSON.parse(filter);
        Object.keys(filterObj).forEach((key) => {
          if (this.filterFields.includes(key)) {
            whereClause[key] = filterObj[key];
          }
        });
      } catch (e) {
        console.warn("⚠️ Invalid filter JSON:", e.message);
      }
    }

    console.log("Where clause after filter:", whereClause);

    // 💰 Price range
    if (minPrice || maxPrice) {
      whereClause.rate = {};
      if (minPrice) whereClause.rate[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.rate[Op.lte] = parseFloat(maxPrice);
    }

    console.log("Where clause after price filter:", whereClause);

    // 📍 Location filter (Haversine)
    let locationWhere = {};
    if (latitude && longitude && radius) {
      const { literal } = require("sequelize");
      const distanceFormula = literal(`
        (6371 * acos(
          cos(radians(${latitude}))
          * cos(radians(latitude))
          * cos(radians(longitude) - radians(${longitude}))
          + sin(radians(${latitude}))
          * sin(radians(latitude))
        )) <= ${radius}
      `);
      locationWhere = distanceFormula;
    }

    console.log("Location where clause:", locationWhere);

    // 📄 Pagination + sorting
    const offset =
      page && limit ? (parseInt(page) - 1) * parseInt(limit) : 0;
    const finalLimit = limit ? parseInt(limit) : this.defaultLimit;
    const order =
      orderBy && orderDirection
        ? [[orderBy, orderDirection.toUpperCase()]]
        : [["createdAt", "DESC"]];

    // ⚙️ Fetch data
    const { count, rows } = await this.model.findAndCountAll({
      where: whereClause,
      limit: finalLimit,
      offset: offset,
      order: order,
      attributes: ["id", "rate", "status", "createdAt", "updatedAt","rejected_reason","is_active"],
      include: [
        {
          model: Service,
          attributes: ["id", "name", "package_enabled"],
        },
        {
          model: ServiceLocation,
          attributes: [
            "id",
            "address",
            "city",
            "ward",
            "latitude",
            "longitude",
          ],
          ...(latitude && longitude && radius
            ? { where: locationWhere }
            : {}),
        },
        {
          model: ServiceImages,
          attributes: ["image_path"],
        },
      ],
    });

    console.log("Fetched services count:", count);


    return responses.success(
      res,
      {
        total: count,
        limit: finalLimit,
        offset: offset,
        results: rows,
      },
      "Public services fetched successfully"
    );
  } catch (err) {
    console.error("❌ Error in public listOnlySpecificFields:", err);
    return responses.serverError(
      res,
      "An error occurred while fetching public services."
    );
  }
}






    async retrieve(req,res){
        try{
            const service = await ServiceProviderServices.findOne({
                where:{id:req.params.id},
                attributes:["id",
          "rate",
          "description",
          "status",
          "rejected_reason",
          "createdAt",
          "updatedAt",],
          include:[{
            model:ServiceSchedules,
            attributes: ["id", "day_of_week", "start_time", "end_time"],
            },{
                model:ServiceLocation,
                attributes: ["id", "address", "city", "ward", "latitude", "longitude"],
            },
            {
                model:ServiceDocument,
                attributes: ["id", "document_path", "document_type"],

            },
            {
                model:ServiceImages,
                attributes: ["id", "image_path"],
            },
            {
                model:Package,
                attributes: ["id", "name", "price", "description"],

            }
        ]
            })

            if(!service){
                return responses.notFound(res,{}, "Service not found");
            }
            return responses.success(res,{service}, "Service retrieved successfully");
        }
        catch(err){
            console.error("Error in retrieving service:", err);
            return responses.serverError(res,{}, "An error occurred while retrieving the service.");
        }
    }

    async uploadImages(req, res) {
      console.log("Files received for upload:", req.files);
  try {
    if (!req.files || req.files.length === 0) {
        console.error("No files uploaded");
      return responses.badRequest(res, {}, "No files uploaded");
    }

    const service = await ServiceProviderServices.findOne({
      where: { id: req.params.id },
    });

    if (!service) {
        console.log("Service not found with id:", req.params.id);
      return responses.notFound(res, "Service not found");
    }

    const serviceProvider = await getServiceProviderFromUserId(req.user.id);

    if (!serviceProvider) {
        console.log("Service provider not found for user id:", req.user.id);
      return responses.notFound(res, "Service provider not found");
    }

    if (service.serviceProviderId !== serviceProvider.id) {
        console.log("Your serviceprovider id is ",serviceProvider.id);
        console.log("Service provider id from service is ",service.serviceProviderId);
      return responses.unauthorized(res, "You are not authorized to upload images for this service");
    }

    // Save all uploaded files
    const newImages = await Promise.all(
      req.files.map((file) =>
        ServiceImages.create({
          serviceProviderServiceId: service.id,
          image_path: file.path,
        })
      )
    );
        

    return responses.success(res, { images: newImages }, "Images uploaded successfully");
  } catch (err) {
    console.error("Error in uploading images:", err);
    return responses.serverError(res, {}, "An error occurred while uploading the images.");
  }
}

}


// fetchserviceprovideronlytitle,rate,description,status,createdat,updatedat,location,id




module.exports = ServiceProviderServiceController;