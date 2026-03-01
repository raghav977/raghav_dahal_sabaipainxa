const BaseController = require("../controllers/baseController");
const ServiceLocation = require("../models/Location");
const ServiceSchedules = require("../models/Schedule");
const ServiceDocument = require("../models/ServiceDocument");
const ServiceProvider = require("../models/ServiceProvider");
const ServiceProviderServices = require("../models/ServiceProviderService");
const Service = require("../models/Services");
const { getUserRole, checkGetUserRole } = require("./userServices");
const { checkValueInModel, fieldsValidation } = require("./validationServices");

const sequelize = require("../config/db");
const ServiceImages = require("../models/ServiceImages");
const ServiceProviderServiceLocation = require("../models/ServiceProviderServiceLocation");
const { ServiceProviderService } = require("../database/relation");


// const addServiceProivderService = async (user, data) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const {
//       schedules,
//       serviceDocuments,
//       servicePhotos,
//       location,
//       serviceId,
//       rate,
//       description,
//       notes,
//       include,
//     } = data;

//     // --- 1️⃣ Validations ---
//     if (!description || !description.trim()) throw new Error("Description is required");
//     if (!serviceId) throw new Error("Service ID is required");
//     if (!rate) throw new Error("Rate is required");
//     if (!location || location.length === 0) throw new Error("At least one location is required");
//     if (!schedules || schedules.length === 0) throw new Error("At least one schedule is required");
//     if(!servicePhotos || servicePhotos.length === 0) throw new Error("At least one photo is required");

//     console.log("✅ Passed all validations");

//     // --- 2️⃣ User role check ---
//     const role = await checkGetUserRole(user);
//     if (!role.includes("Service_provider") && !role.includes("Admin")) {
//       throw new Error("Only service providers or admins can add services");
//     }
//     console.log("✅ User role is valid:", role);

//     // --- 3️⃣ Service provider / admin flow ---
//     let serviceProviderId = null;

//     if (role.includes("Service_provider")) {
//       const serviceProvider = await ServiceProvider.findOne({
//         where: { userId: user.id },
//         transaction,
//       });

//       if (!serviceProvider) throw new Error("Service provider not found for this user");
//       serviceProviderId = serviceProvider.id;

//       const existingService = await ServiceProviderServices.findOne({
//         where: { serviceProviderId, serviceId },
//         transaction,
//       });
//       if (existingService) throw new Error("This service has already been added by you");

//     } else if (role.includes("Admin")) {
//       const existingService = await ServiceProviderServices.findOne({
//         where: { serviceProviderId: null, serviceId },
//         transaction,
//       });
//       if (existingService) throw new Error("This service has already been added by admin");
//     }

//     console.log("✅ Service provider ID:", serviceProviderId);

    
//     const providerService = await ServiceProviderServices.create(
//       {
//         serviceProviderId,
//         serviceId,
//         description,
//         rate,
//         includes: Array.isArray(include) ? include : [],
//         note: notes || null,
//       },
//       { transaction, returning: true }
//     );
//     if (!providerService) throw new Error("Failed to create provider service");
//     console.log("✅ Provider service created:", providerService.id);

//     console.log("Location data to be added:", location);
//     const locationData = location.map(loc => ({
//       serviceProviderServiceId: providerService.id, 
//       address: loc.address || loc.name || loc,
//       city: loc.city || "",
//       ward: loc.ward || null,
//       latitude: loc.latitude || null,
//       longitude: loc.longitude || null,
//     }));
    
   
//     if (locationData.length > 0) {
//       await ServiceLocation.bulkCreate(locationData, { transaction });
//       console.log("✅ Locations created");
//     }

    
//     if (schedules && schedules.length > 0) {
//       const scheduleData = schedules.map(sch => ({
//         serviceProviderServiceId: providerService.id,
//         day_of_week: sch.day_of_week,
//         start_time: sch.start_time,
//         end_time: sch.end_time,
//       }));
//       await ServiceSchedules.bulkCreate(scheduleData, { transaction });
//       console.log("✅ Schedules created");
//     }

//     // document wala optional wala yo chai
//     if (serviceDocuments && serviceDocuments.length > 0) {
//       const docsData = serviceDocuments.map(doc => ({
//         serviceProviderServiceId: providerService.id,
//         document_path: doc.image_path,
//         document_type: doc.image_type,
//       }));
//       await ServiceDocument.bulkCreate(docsData, { transaction });
//       console.log("✅ Documents created");
//     }

//     // for photos part

//     if(servicePhotos && servicePhotos.length > 0){
//       try{
//         const firstPhotoPath = servicePhotos[0].image_path || servicePhotos[0]
//         if(!firstPhotoPath){
//           throw new Error("Invalid photo data");
//         }
//         const photoDocs = servicePhotos.map(p=>({
//           serviceProviderServiceId: providerService.id,
//           document_path: p.image_path || p,
//           document_type: "photo"
//         }))
//         await ServiceImages.bulkCreate(photoDocs, {transaction});
//         console.log("✅ Photos added successfully");

//       }
//       catch(err){
//         console.error("❌ Failed to add photos:", err.message);
//       }
//     }

    

    

    
//     await transaction.commit();
//     console.log("✅ Service provider service created successfully:", providerService.id);

//     return providerService;

//   } catch (err) {
    
//     await transaction.rollback();
//     console.error("❌ Failed to add service provider service:", err.message, {
//       stack: err.stack,
//       data,
//       user: user?.id,
//     });
//     throw new Error(err.message || "Something went wrong while adding service");
//   }
// };
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM 24-hour

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function isValidTime(t) {
  return typeof t === "string" && TIME_RE.test(t);
}
function parseFloatSafe(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : NaN;
}
function isPositiveNumber(v) {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}
function isIntegerLike(v) {
  return Number.isInteger(v) || (typeof v === "string" && /^\d+$/.test(v));
}

// const addServiceProivderService = async (user, data, files) => {
//   const t = await sequelize.transaction();

//   try {
//     // 1️⃣ Destructure incoming data
//     let {
//       serviceId,
//       description,
//       rate,
//       notes,
//       include,
//       location, // array of location IDs
//       schedules,
//       serviceDocuments,
//       servicePhotos
//     } = data;

//     console.log("Data received:", data);
//     console.log("Files received:", files);

//     // 2️⃣ Parse JSON fields (frontend may send JSON strings)
//     console.log("Type of schedules:", typeof schedules, schedules);
//     if (typeof schedules[0] === "string") {
//       schedules = schedules.map(s => JSON.parse(s));
//     }
//     if (typeof include === "string") include = JSON.parse(include);
//     if (typeof location === "string") location = JSON.parse(location);

//     // 3️⃣ Basic validations
//     if (!serviceId) throw new Error("Validation: serviceId is required.");
//     const parsedRate = parseFloat(rate);
//     if (isNaN(parsedRate) || parsedRate <= 0) throw new Error("Validation: rate must be positive.");
//     if (!description || !description.trim()) throw new Error("Validation: description is required.");
//     if (!Array.isArray(location) || location.length === 0) throw new Error("Validation: at least one location is required.");
//     if (!Array.isArray(schedules) || schedules.length === 0) throw new Error("Validation: at least one schedule is required.");
//     if ((!Array.isArray(servicePhotos) || servicePhotos.length === 0) && (!files || files.length === 0))
//       throw new Error("Validation: at least one photo is required.");

//     // 4️⃣ Role check
//     const role = await checkGetUserRole(user);
//     if (!role.includes("Service_provider") && !role.includes("Admin"))
//       throw new Error("Authorization: only service providers or admins can add services.");

//     let serviceProviderId = null;
//     if (role.includes("Service_provider")) {
//       const sp = await ServiceProvider.findOne({ where: { userId: user.id }, transaction: t });
//       if (!sp) throw new Error("Service provider record not found for user.");
//       serviceProviderId = sp.id;
//     }

//     // 5️⃣ Prevent duplicate service for the provider
//     const existing = await ServiceProviderServices.findOne({
//       where: { serviceProviderId, serviceId },
//       transaction: t
//     });
//     if (existing) throw new Error("Duplicate: this service is already added.");

//     // 6️⃣ Normalize schedules
//     console.log("Raw schedules:", schedules);
//     const normalizedSchedules = schedules.map(s => {
//       let dayIndex = null;
//       if (typeof s.day_of_week === "number") dayIndex = s.day_of_week;
//       else if (typeof s.day_of_week === "string") {
//         const short = s.day_of_week.trim().slice(0,3).toLowerCase();
//         const map = { mon:0, tue:1, wed:2, thu:3, fri:4, sat:5, sun:6 };
//         if (map[short] !== undefined) dayIndex = map[short];
//       }
//       console.log("Day index:", dayIndex);
//       if (dayIndex === null) throw new Error(`Schedule validation: invalid day_of_week: ${s.day_of_week}`);
//       const [sh, sm] = s.start_time.split(":").map(Number);
//       const [eh, em] = s.end_time.split(":").map(Number);
//       if (eh*60+em <= sh*60+sm) throw new Error("Schedule validation: end_time must be after start_time.");
//       return { day_of_week: dayIndex, start_time: s.start_time, end_time: s.end_time };
//     });

//     // 7️⃣ Create the provider service
//     const providerService = await ServiceProviderServices.create({
//       serviceProviderId,
//       serviceId,
//       description: description.trim(),
//       rate: parsedRate,
//       includes: Array.isArray(include) ? include : [],
//       note: notes && notes.trim() ? notes.trim() : null,
//     }, { transaction: t });

//     // 8️⃣ Link locations (many-to-many)
//     await providerService.addServiceLocations(location.map(id => parseInt(id,10)), { transaction: t });

//     // 9️⃣ Insert schedules
//     const scheduleRows = normalizedSchedules.map(s => ({
//       serviceProviderServiceId: providerService.id,
//       ...s
//     }));
//     await ServiceSchedules.bulkCreate(scheduleRows, { transaction: t });

//     // 🔟 Insert documents if any
//     if (Array.isArray(serviceDocuments)) {
//       const docRows = serviceDocuments.map(d => ({
//         serviceProviderServiceId: providerService.id,
//         document_path: typeof d === "string" ? d : d.path || d.image_path,
//         document_type: d.type || "document"
//       }));
//       await ServiceDocument.bulkCreate(docRows, { transaction: t });
//     }

//     // 1️⃣1️⃣ Insert photos (from frontend paths + uploaded files)
//     const uploadedPhotoRows = (files || []).map(f => ({
//       serviceProviderServiceId: providerService.id,
//       image_path: f.path
//     }));
//     await ServiceImages.bulkCreate(uploadedPhotoRows, { transaction: t });

//     // 1️⃣2️⃣ Commit transaction
//     await t.commit();

//     // 1️⃣3️⃣ Fetch created service with relations
//     const created = await ServiceProviderService.findByPk(providerService.id, {
//       include: [
//         { model: ServiceLocation, through: { attributes: [] } }, // many-to-many
//         { model: ServiceSchedules, attributes: ["id","day_of_week","start_time","end_time"] },
//         { model: ServiceImages, attributes: ["id","image_path"] },
//         { model: ServiceDocument, attributes: ["id","document_path","document_type"] }
//       ]
//     });

//     return created;

//   } catch (err) {
//     if (!t.finished) await t.rollback();
//     console.error("❌ Failed to add service provider service:", err.stack || err);
//     throw new Error(err.message || "Failed to add service provider service");
//   }
// };

const addServiceProivderService = async (user, data, files) => {
  const t = await sequelize.transaction();



  try {
    let { serviceId, description, rate, notes, include, locations, schedules } = data;

  

    console.log("Data received:", data);
    console.log("Files received:", files);

    // Parse JSON fields if they are strings
    if (typeof schedules === "string") schedules = JSON.parse(schedules);
    if (typeof include === "string") include = JSON.parse(include);
    if (typeof locations === "string") locations = JSON.parse(locations);

    // Validations
    if (!serviceId) throw new Error("Validation: serviceId is required.");
    const parsedRate = parseFloat(rate);
    console.log("Parsed rate:", parsedRate);
    if (isNaN(parsedRate) || parsedRate <= 0) throw new Error("Validation: rate must be positive.");
    if (!description?.trim()) throw new Error("Validation: description is required.");
    if (!Array.isArray(locations) || locations.length === 0) throw new Error("Validation: at least one location is required.");
    if (!Array.isArray(schedules) || schedules.length === 0) throw new Error("Validation: at least one schedule is required.");

    // Role check
    const role = await checkGetUserRole(user);
    if (!role.includes("Service_provider") && !role.includes("Admin"))
      throw new Error("Authorization: only service providers or admins can add services.");

    // Get service provider ID
    let serviceProviderId = null;
    if (role.includes("Service_provider")) {
      const sp = await ServiceProvider.findOne({ where: { userId: user.id }, transaction: t });
      if (!sp) throw new Error("Service provider record not found for user.");
      serviceProviderId = sp.id;
    }

    // Check for duplicate service
    const existing = await ServiceProviderServices.findOne({ where: { serviceProviderId, status: ["pending", "approved"], serviceId }, transaction: t });
    if (existing) throw new Error("Duplicate: this service is already added.");

    // Parse schedule strings if needed
    schedules = schedules.map(s => (typeof s === "string" ? JSON.parse(s) : s)).filter(Boolean);

    // Normalize schedules
    const normalizedSchedules = schedules.map(s => {
      const dayStr = s.day_of_week || s.day || s.dayOfWeek;
      if (!dayStr) throw new Error(`Invalid day in schedule: ${dayStr}`);
      const short = dayStr.trim().slice(0, 3).toLowerCase();
      const [sh, sm] = s.start_time.split(":").map(Number);
      const [eh, em] = s.end_time.split(":").map(Number);
      if (eh * 60 + em <= sh * 60 + sm) throw new Error("Schedule validation: end_time must be after start_time.");

      return { day_of_week: short, start_time: s.start_time, end_time: s.end_time };
    });

    // Create service
    const providerService = await ServiceProviderServices.create(
      {
        serviceProviderId,
        serviceId,
        description: description.trim(),
        rate: parsedRate,
        includes: Array.isArray(include) ? include : [],
        note: notes?.trim() || null,
      },
      { transaction: t }
    );

    // Insert locations
    const locationRows = locations.map(loc => ({
      serviceProviderServiceId: providerService.id,
      address: loc.address || null,
      city: loc.city || null,
      ward: loc.ward || null,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: loc.radius || 5,
    }));
    await ServiceLocation.bulkCreate(locationRows, { transaction: t });

    // Insert schedules
    const scheduleRows = normalizedSchedules.map(s => ({
      serviceProviderServiceId: providerService.id,
      ...s,
    }));
    await ServiceSchedules.bulkCreate(scheduleRows, { transaction: t });

    // Insert documents
    const serviceDocuments = files?.documents || [];
    if (serviceDocuments.length) {
      const docRows = serviceDocuments.map(d => ({
        serviceProviderServiceId: providerService.id,
        document_path: d.path,
        document_type: d.mimetype || "document",
      }));
      await ServiceDocument.bulkCreate(docRows, { transaction: t });
    }

    // Insert images
    const serviceImages = files?.images || [];
    if (serviceImages.length) {
      const imageRows = serviceImages.map(f => ({
        serviceProviderServiceId: providerService.id,
        image_path: f.path,
      }));
      await ServiceImages.bulkCreate(imageRows, { transaction: t });
    }

    await t.commit();

    // Fetch the created service with all relations
    const created = await ServiceProviderServices.findByPk(providerService.id, {
      include: [
        { model: ServiceLocation },
        { model: ServiceSchedules },
        { model: ServiceImages },
        { model: ServiceDocument },
      ],
    });

    return created;
  } catch (err) {
    if (!t.finished) await t.rollback();
    console.error("❌ Failed to add service provider service:", err);
    throw new Error(err.message || "Failed to add service provider service");
  }
};




const createService = async(name,package_enabled)=>{
    try{
        const checkService = await checkValueInModel(Service,"name",name);
        if(checkService){
            throw new Error("Service with this name already exists.");
        }
        const newService = await Service.create({name, package_enabled});
        return newService;
    }
    catch(err){
        console.log("Something went wrong in creating service:", err);
        throw err;

    }
}


const updateService = async(id, name, package_enabled)=>{
    try{
        const service = await Service.findByPk(id);
        if(!service){
            throw new Error("Service not found.");
        }
        const checkService = await Service.findOne({ where: { name } });
        console.log("THis is id of service being updated:", id);
        console.log("This is checkService id:", checkService ? checkService.id : null);
        if (checkService && Number(checkService.id) !== Number(id)) {
            throw new Error("Service with this name already exists.");
        }
        service.name = name;  
        service.package_enabled = package_enabled;
        await service.save();
        return service;
    }
    catch(err){
        console.log("Something went wrong in updating service:", err);
        throw err;
    }
}

const deleteService = async(id)=>{
    try{
        const service = await Service.findByPk(id);
        if(!service){
            throw new Error("Service not found.");
        }
        await service.destroy();
        return true;
    }
    catch(err){
        console.log("Something went wrong in deleting service:", err);
        throw err;
    }
}

const getAllServices = async()=>{
    try{
        const services = await Service.findAll();
        return services;
    }
    catch(err){
        console.log("Something went wrong in fetching services:", err);
        throw err;
    }
}




const getServiceById = async(id)=>{ 
    try{
        const service = await Service.findByPk(id);
        if(!service){
            throw new Error("Service not found.");
        }
        return service;
    }
    catch(err){
        console.log("Something went wrong in fetching service by id:", err);
        throw err;
    }
}


const getMyServices = async(user)=>{
    try{
        const serviceProvider = await ServiceProvider.findOne({where:{userId:user.id}});
        if(!serviceProvider){
            throw new Error("Service provider not found for this user.");
        }
        const myServices = await ServiceProviderServices.findAll({where:{serviceProviderId:serviceProvider.id},include:[Service,ServiceLocation,ServiceSchedules,ServiceDocument]});
        return myServices;
    }
    catch(err){
        console.log("Something went wrong in fetching my services:", err);

        throw err;
    }
}



module.exports = {
    addServiceProivderService,
    createService,
    updateService,
    deleteService,
    getAllServices,
    getServiceById,
    getMyServices
}