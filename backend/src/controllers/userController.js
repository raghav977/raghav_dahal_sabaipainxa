
const otpServices = require("../services/otpServices");
const userServices = require("../services/userServices");

const { Op } = require("sequelize");
const tokenService = require("../services/tokenService");
const Room = require("../models/Room");
const Kyc = require("../models/Kyc");
const KycImages = require("../models/kycImages");
const Gharbeti = require("../models/Gharbeti");

const bcrypt = require("bcrypt")

// const sendMail = require("../utils/sendMail");
const sendEmail = require("../services/emailService");

const {checkEmailExists, fieldsValidation, checkValueInModel, validateEmail, passwordStrength} = require("../services/validationServices")
const responses = require("../http/response");
// const client = require("../config/redis");
const User = require("../models/User");
const Municipal = require("../models/Municipal");
const { get } = require("../app");
const Role = require("../models/Role");
const ServiceProvider = require("../models/ServiceProvider");
const Booking = require("../models/Booking");
const ServiceProviderServices = require("../models/ServiceProviderService");
const Service = require("../models/Services");
const Bid = require("../models/Bid");


// const requestOtpForRegistration = async(req,res,next)=>{
//     try{
//         const {email} = req.body;
//         if(!fieldsValidation(email)){
//             return responses.badRequest(res,{}, "Email is required");
//         }
//         const emailFound = await checkEmailExists(email);
//         if(emailFound){
//             return responses.conflict(res,{}, "Email already registered. Please login or use a different email.");
//         }
//     const otpResponse = await otpServices.createAndStoreOtp(email);
//         const formatForMessage = {
//             to: email,
//             subject: "Your OTP for registration",
//             text: `Your OTP for registration is ${otpResponse}. It is valid for 10 minutes.`
//         }
//         const emailSent = await sendEmail(formatForMessage.to, formatForMessage.subject, formatForMessage.text);
//         if(!emailSent){
//             return responses.badRequest(res,{}, "Failed to send OTP. Please try again.");
//         }
//         return responses.success(res,{otpResponse}, "OTP sent successfully to your email. Please verify to complete registration.")
//     }
//     catch(err){
//         console.error("Error in requestOtpForRegistration:", err);
//         return responses.serverError(res, {}, "An error occurred. Please try again later.");
//     }
// }

const requestOtpForRegistration = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!fieldsValidation(email)) {
      return responses.badRequest(res, {}, "Email is required");
    }

    const is_valid = validateEmail(email)
    if(!is_valid){
        return responses.badRequest(res,{},"Please enter valid email")
    }

    const emailFound = await checkEmailExists(email);
    if (emailFound) {
      return responses.conflict(
        res,
        {},
        "Email already registered. Please login or use a different email."
      );
    }

    const otpResponse = await otpServices.createAndStoreOtp(email);

    
    res.status(200).json({
      success: true,
      message: "OTP generated. Check your email for verification.",
    });


    sendEmail(
      email,
      "Your OTP for registration",
      `Your OTP is ${otpResponse}. It is valid for 10 minutes.`
    ).catch((err) => console.error("Email sending failed:", err));
  } catch (err) {
    console.error("Error in requestOtpForRegistration:", err);
    return responses.serverError(res, {}, err.message || "An error occurred. Please try again later.");
  }
};


const verifyOtpForRegistration = async(req,res,next)=>{
    try{
        const {email, otp} = req.body;
        if(!otp){
            return responses.badRequest(res,{}, "OTP is required");
        }
        if(!fieldsValidation(email)){
            return responses.badRequest(res,{}, "Email is required");
        }
        
        const otpVerification = await otpServices.verifyOtp(email, otp);
        if(!otpVerification.valid){
            return responses.badRequest(res,{}, otpVerification.message);
        }
        return responses.success(res,{}, "OTP verified successfully. You can now proceed with registration.");
    }
    catch(err){
        console.error("Error in verifyOtpForRegistration:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}

const registerUser = async(req,res,next)=>{
    try{

        const {name, email, password, municipal_code} = req.body;





        const municipalCodeExists = await checkValueInModel(Municipal, "municipal_code", municipal_code);
        if(!municipalCodeExists){
            return responses.badRequest(res,{}, "Invalid Municipal Code. Please enter a valid code.");
        }
        if(!fieldsValidation(name, email, password)){
            return responses.badRequest(res,{}, "Name, Email, Username, Password, and Municipal Code are required");
        }

        const is_validate = validateEmail(email);
        if(!is_validate){
            return responses.badRequest(res,{},"Please enter valid Email")
        }

        const passwordStatus = passwordStrength(password);
        if(passwordStatus=='Weak'){
            return responses.badRequest(res,{},"Your password is too weak")
        }




        const emailFound = await checkEmailExists(email);
        if(emailFound){
            return responses.conflict(res,{}, "Email already registered. Please login or use a different email.");
        }

        const newUser = await userServices.createUser({name, email, password, municipal_code});
        console.log("New user created:", newUser);
        if(!newUser){
            return responses.serverError(res,{}, "Failed to create user. Please try again.");
        }
        return responses.success(res,{newUser}, "User registered successfully.");
    }
    catch(err){
        console.error("Error in registerUser:", err);
        return responses.serverError(res, {}, `An error occured :: ${err.message}`);
    }
}

const loginUser = async(req,res,next)=>{
    try{
        const {email, password} = req.body;
        if(!fieldsValidation(email, password)){
            return responses.badRequest(res, "Email and Password are required");
        }
        const is_valid = validateEmail(email)
        if(!is_valid){
            return responses.badRequest(res,{},"Please enter valid email")
        }
        // Further login logic goes here
        const user = await userServices.getUserByEmail(email);
        if(!user){
            return responses.notFound(res, "User not found. Please register first.");
        }
        const passwordMatch = await userServices.comparePassword(password, user.password);
        if(!passwordMatch){
            return responses.unauthorized(res, "Invalid password. Please try again.");
        }
        const token = await tokenService.generateToken(user);
        const refreshToken = await tokenService.generateRefreshToken(user);

        if(!refreshToken){
            return responses.serverError(res,{}, "Failed to generate refresh token. Please try again.");
        }

        if(!token){
            return responses.serverError(res,{}, "Failed to generate token. Please try again.");
        }
        const is_active = user.is_active;
        if(!is_active){
            return responses.unauthorized(res, "User account is inactive. You are blocked by the admin. Please contact support.");
        }

    // Do not set cookies from server. Return tokens in response body for the client to store (e.g., localStorage).
    user.password = undefined;
    return responses.success(res, { user, token, refreshToken }, "Login successful.");

    } catch(err){
        console.error("Error in loginUser:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}

const logoutUser = async(req,res,next)=>{
    try{
            // Expect access token via Authorization header: "Bearer <token>".
            const token = req.headers["authorization"]?.split(" ")?.[1];
            if (!token) {
                return responses.badRequest(res, "No token provided.");
            }
            // Optionally blacklist the token via tokenService.blackListToken(token);
            return responses.success(res, {}, "Logout successful.");
    }
    catch(err){
        console.error("Error in logoutUser:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}

const getUserProfile = async(req,res,next)=>{
    try{

        const userId = req.user.id;
        // console.log("This is userId in getUserProfile:", userId);
        const user = await userServices.getUserById(userId);
         let serviceProvider = null;
    let gharbeti = null;
    let businessAccount = null;

    try {
      serviceProvider = await userServices.getServiceProviderFromUserId(userId);
    } catch (err) {
      
      serviceProvider = null;
    }

        try {
      gharbeti = await userServices.getGharbetiFromUserId(userId);
    } catch (err) {
      
      gharbeti = null;
    }

    try {
      const BusinessAccount = require("../models/BusinessAccount");
      businessAccount = await BusinessAccount.findOne({ where: { user_id: userId } });
    } catch (err) {
      
      businessAccount = null;
    }

const gharbeti_id = gharbeti && gharbeti.is_active ? gharbeti.id : null;
console.log("This is gharbeti id:", gharbeti_id);
        const service_provider_id = serviceProvider && serviceProvider.is_active ? serviceProvider.id : null;
        const business_id = businessAccount ? businessAccount.id : null;
        console.log("This is service provider id:", service_provider_id);
        console.log("This is business id:", business_id);
        if(!user){
            return responses.notFound(res,"User not found.");
        }
        user.password = undefined;
        const token = await tokenService.generateToken(user);
        return responses.success(res,{user, service_provider_id, gharbeti_id, business_id, token}, "User profile fetched successfully.");
    }
    catch(err){
        console.error("Error in getUserProfile:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
};


const updateUserProfile = async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const {name, username, primary_address, secondary_address} = req.body;
        if(!fieldsValidation(name, username, primary_address, secondary_address)){
            return responses.badRequest(res,{}, "Name, Username, Primary Address, and Secondary Address are required");
        }
        const user = await userServices.getUserById(userId);
        if(!user){
            return responses.notFound(res,{}, "User not found.");
        }
        const updatedUser = await userServices.updateUser(userId, {name, username, primary_address, secondary_address});
        if(!updatedUser){
            return responses.serverError(res,{}, "Failed to update user. Please try again.");
        }
        updatedUser.password = undefined;
        return responses.success(res,{updatedUser}, "User profile updated successfully.");
    }
    catch(err){
        console.error("Error in updateUserProfile:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}


const changeUserPassword = async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const {currentPassword, newPassword} = req.body;
        if(!fieldsValidation(currentPassword, newPassword)){
            return responses.badRequest(res,{}, "Current Password and New Password are required");
        }
        const user = await userServices.getUserById(userId);
        if(!user){
            return responses.notFound(res,{}, "User not found.");
        }
        const passwordMatch = await userServices.comparePassword(currentPassword, user.password);
        if(!passwordMatch){
            return responses.unauthorized(res,{}, "Current Password is incorrect");
        }
        const updatedUser = await userServices.updateUser(userId, {password: newPassword});
        if(!updatedUser){
            return responses.serverError(res,{}, "Failed to update password. Please try again.");
        }
        return responses.success(res,{}, "Password changed successfully.");
    }
    catch(err){
        console.error("Error in changeUserPassword:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}


const deleteUserAccount = async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const user = await userServices.getUserById(userId);
        if(!user){
            return responses.notFound(res,{}, "User not found.");
        }
        const deleted = await userServices.deleteUser(userId);
        if(!deleted){
            return responses.serverError(res,{}, "Failed to delete user. Please try again.");
        }
        return responses.success(res,{}, "User account deleted successfully.");
    }
    catch(err){
        console.error("Error in deleteUserAccount:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}

const changeUserStatusBlockUnblock = async(req,res,next)=>{
    try{
        const userId = req.params.userId;
        const action = req.params.action;
        
        if(!userId) return responses.badRequest(res, {}, "User ID is required");

        const user = await userServices.getUserById(userId);
        if(!user) return responses.notFound(res, "User not found");

        if(action === "block"){
            user.is_active = false;
            const { blocked_reason } = req.body;
            if(!blocked_reason){
                return responses.badRequest(res, {}, "Blocked reason is required");
            }
            user.blocked_reason = blocked_reason || "Blocked by admin";
            const emailSent = await sendEmail(
                user.email,
                "Account Blocked Notification",
                `Dear ${user.name || user.username},\n\nYour account has been blocked. Reason: ${user.blocked_reason}\n\nIf you believe this is a mistake, please contact support.\n\nBest regards,\nSupport Team`
            );

            if (!emailSent) {
                console.error("Failed to send account blocked email to user:", user.email);
                return responses.serverError(res, { err: "Failed to send account blocked notification email." });
            }

        }
        else if(action === "unblock"){
            user.is_active = true;
        }
        else{
            return responses.badRequest(res, {}, "Invalid action");
        }

        await user.save();

        const msg = action === 'block' ? 'User blocked successfully.' : 'User unblocked successfully.';
        return responses.success(res, { user: { id: user.id, is_active: user.is_active } }, msg);
    }
    catch(err){
        console.error("Error in changeUserStatusBlockUnblock:", err);
        return responses.serverError(res, {}, err.message || "Failed to change user status.");
    }
}


const getAllUsers = async (req, res, next) => {
  const userId = req.user.id;


  const user = await userServices.getUserById(userId);
  if (!user) {
    return responses.notFound(res, "User not found.");
  }


  const role = await userServices.getUserRole(user);
  const isAdmin = role.find(r => r.name === "Admin");
  if (!isAdmin) {
    return responses.forbidden(res, "Only admins can access all users.");
  }

  try {

    const {
      role: roleFilter = "all",
      status: statusFilter = "all",
      search = "",
      page = 1,
      limit = 20
    } = req.query;

    // 4️⃣ Call service layer with filters
    const { users, total } = await userServices.getAllUsersWithPaginations({
      role: roleFilter,
      status: statusFilter,
      search,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    // 5️⃣ Prepare paginated response
    const totalPages = Math.ceil(total / parseInt(limit));

    return responses.success(res, {
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages
    }, "User list fetched successfully.");

  } catch (err) {
    console.error("Error in getAllUsers:", err);
    return responses.serverError(res, {}, "An error occurred. Please try again later.");
  }
};


// Public endpoint: find users near a lat/lng within radius (km)
const searchNearbyUsers = async (req, res, next) => {
    try {
        const latitude = req.query.latitude ? parseFloat(req.query.latitude) : null;
        const longitude = req.query.longitude ? parseFloat(req.query.longitude) : null;
        const radius = req.query.radius ? parseFloat(req.query.radius) : 10; // km
        const availability = req.query.availability || null; // full-time, part-time, remote
        const skills = req.query.skills || null; // comma-separated keywords to match name/username/email for now

        if (!latitude || !longitude) {
            return responses.badRequest(res, {}, "latitude and longitude are required");
        }

        const sequelize = require('../config/db');
        // Haversine formula (approx) using MySQL functions
        const haversine = `(
            6371 * acos(
                cos(radians(:lat)) * cos(radians(ul.latitude)) * cos(radians(ul.longitude) - radians(:lng)) +
                sin(radians(:lat)) * sin(radians(ul.latitude))
            )
        )`;

        let sql = `SELECT u.id as user_id, u.name, u.email, u.profile_picture, u.phone_number, ul.latitude, ul.longitude, ul.address, ul.availability, ul.radius_km, ${haversine} as distance_km
            FROM user_locations ul
            JOIN users u ON ul.user_id = u.id
            WHERE u.is_active = 1`;

        if (availability) {
            sql += ` AND ul.availability = :availability`;
        }

        if (skills) {
            // naive skills filter: match against name/email/username
            sql += ` AND (u.name LIKE :skillLike OR u.email LIKE :skillLike OR u.username LIKE :skillLike)`;
        }

        sql += ` HAVING distance_km <= :radius ORDER BY distance_km ASC LIMIT :limit OFFSET :offset`;

        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const replacements = { lat: latitude, lng: longitude, radius, availability, skillLike: `%${skills}%`, limit, offset };

        const [results] = await sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });

        return responses.success(res, { total: results.length, page, limit, data: results }, "Nearby users fetched");
    } catch (err) {
        console.error("Error in searchNearbyUsers:", err);
        return responses.serverError(res, {}, "Failed to search nearby users");
    }
}

// Create a user availability/location entry (no auth for now).
const createUserLocation = async (req, res, next) => {
    try {
        const { user_id, address, latitude, longitude, availability, radius_km } = req.body;
        if (!user_id || !latitude || !longitude) {
            return responses.badRequest(res, {}, "user_id, latitude and longitude are required");
        }
        const UserLocation = require('../models/UserLocation');
        const newLoc = await UserLocation.create({ user_id, address: address || null, latitude, longitude, availability: availability || 'full-time', radius_km: radius_km || 10 });
        return responses.created(res, newLoc, "User location created");
    } catch (err) {
        console.error("Error in createUserLocation:", err);
        return responses.serverError(res, {}, "Failed to create user location");
    }
}

// List user locations (optionally filter by user_id)
const listUserLocations = async (req, res, next) => {
    try {
        const UserLocation = require('../models/UserLocation');
        const where = {};
        if (req.query.userId) where.user_id = req.query.userId;
        const locations = await UserLocation.findAll({ where });
        return responses.success(res, { total: locations.length, data: locations }, "User locations fetched");
    } catch (err) {
        console.error("Error in listUserLocations:", err);
        return responses.serverError(res, {}, "Failed to list user locations");
    }
}

// Delete a user location by id (no auth for now)
const deleteUserLocation = async (req, res, next) => {
    try {
        const UserLocation = require('../models/UserLocation');
        const id = req.params.id;
        if (!id) return responses.badRequest(res, {}, "Location id is required");
        const loc = await UserLocation.findByPk(id);
        if (!loc) return responses.notFound(res, "Location not found");
        await loc.destroy();
        return responses.deleted(res, {}, "User location deleted");
    } catch (err) {
        console.error("Error in deleteUserLocation:", err);
        return responses.serverError(res, {}, "Failed to delete user location");
    }
}

// Search candidates for business (by location + radius)
const searchCandidatesForBusiness = async (req, res, next) => {
    try {
        const latitude = req.query.latitude ? parseFloat(req.query.latitude) : null;
        const longitude = req.query.longitude ? parseFloat(req.query.longitude) : null;
        const radius = req.query.radius ? parseFloat(req.query.radius) : 10; // km
        const position = req.query.position || null; // optional job position/title to filter

        if (!latitude || !longitude) {
            return responses.badRequest(res, {}, "latitude and longitude are required");
        }

        // Import WorkerProfile model
        const WorkerProfile = require('../models/WorkerProfile');
        const User = require('../models/User');
        
        // Get all worker profiles
        const workers = await WorkerProfile.findAll({
            where: {
                is_available: true // Only show available workers
            },
            include: [{
                model: User,
                attributes: ['id', 'name', 'email', 'phone_number', 'profile_picture']
            }],
            limit: 100,
            offset: 0
        });

        // Calculate distance for each worker and filter by radius
        const results = workers
            .map(worker => {
                if (!worker.latitude || !worker.longitude) return null;
                
                // Haversine formula to calculate distance
                const lat1 = latitude * Math.PI / 180;
                const lat2 = parseFloat(worker.latitude) * Math.PI / 180;
                const lng1 = longitude * Math.PI / 180;
                const lng2 = parseFloat(worker.longitude) * Math.PI / 180;
                
                const dLat = lat2 - lat1;
                const dLng = lng2 - lng1;
                
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                         Math.cos(lat1) * Math.cos(lat2) *
                         Math.sin(dLng / 2) * Math.sin(dLng / 2);
                
                const c = 2 * Math.asin(Math.sqrt(a));
                const distance = 6371 * c; // km
                
                return {
                    user_id: worker.user_id,
                    name: worker.user?.name || 'Unknown',
                    email: worker.user?.email || '',
                    phone_number: worker.user?.phone_number || '',
                    profile_picture: worker.user?.profile_picture || '',
                    title: worker.title,
                    bio: worker.bio,
                    latitude: worker.latitude,
                    longitude: worker.longitude,
                    address: worker.location_name,
                    availability: worker.availability_status,
                    distance_km: distance,
                    skills: worker.skills,
                    hourly_rate: worker.hourly_rate,
                    is_verified: worker.is_verified,
                    average_rating: worker.average_rating
                };
            })
            .filter(worker => worker && worker.distance_km <= radius)
            .sort((a, b) => a.distance_km - b.distance_km);

        return responses.success(res, { 
            total: results.length, 
            page: 1, 
            limit: 100, 
            data: results 
        }, "Candidates fetched");
    } catch (err) {
        console.error("Error in searchCandidatesForBusiness:", err);
        return responses.serverError(res, {}, "Failed to search candidates");
    }
}



const getUserAllDetail = async (req, res) => {
  const userId = req.params.id;

  try {
    if (!userId) return responses.badRequest(res, "User ID is required.");

    // 1️⃣ Fetch user
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: ServiceProvider,
          attributes: ["id", "is_verified", "is_blocked"],
          include: [
            {
              model: ServiceProviderServices,
              attributes: ["id"],
              include: [
                { model: Service, attributes: ["id", "name"] },
                {
                  model: Booking,
                  attributes: ["id", "status", "createdAt", "userId", "lat", "lng"],
                  include: [
                    {
                      model: Bid,
                      attributes: ["id", "bidAmount", "status", "userId"],
                      where: { status: { [Op.ne]: "rejected" } },
                      required: false,
                    },
                  ],
                  required: false,
                },
              ],
            },
          ],
          required: false,
        },
        {
          model: Booking,
          attributes: ["id", "status", "createdAt", "serviceProviderServiceId", "lat", "lng"],
          include: [
            {
              model: ServiceProviderServices,
              attributes: ["id"],
              include: [{ model: Service, attributes: ["id", "name"] }],
            },
            { model: Bid, attributes: ["id", "bidAmount", "status", "userId"] },
          ],
          required: false,
        },
      ],
    });

    if (!user) return responses.notFound(res, "User not found.");

    const roles = await userServices.getUserRole(user);
    const roleNames = roles?.map(r => r.name) || [];

    const userObj = user.get({ plain: true });

    const userRole = roleNames.includes("Service_provider")
      ? "service_provider"
      : roleNames.includes("Service_seeker")
      ? "service_seeker"
      : "User";

    // 2️⃣ Map provider services
    let services = [];
    if (userRole === "service_provider" && userObj.ServiceProviders) {
      services = userObj.ServiceProviders.map(sp => ({
        id: sp.id,
        is_verified: sp.is_verified,
        is_blocked: sp.is_blocked,
        serviceList: sp.ServiceProviderServices?.map(sps => ({
          id: sps.id,
          name: sps.Service?.name || "Unknown",
          bookings: sps.Bookings?.map(b => ({
            id: b.id,
            status: b.status,
            date: b.createdAt,
            userId: b.userId,
            lat: b.lat,
            lng: b.lng,
            bids: b.Bids?.map(bid => ({
              id: bid.id,
              amount: bid.bidAmount,
              status: bid.status,
              userId: bid.userId,
            })) || [],
          })) || [],
        })) || [],
      }));
    }

    // 3️⃣ Map past bookings for service seeker
    let pastBookings = [];
    if (userObj.Bookings) {
      pastBookings = userObj.Bookings.map(b => ({
        id: b.id,
        status: b.status,
        date: b.createdAt,
        lat: b.lat,
        lng: b.lng,
        service: b.ServiceProviderService?.Service
          ? { id: b.ServiceProviderService.Service.id, name: b.ServiceProviderService.Service.name }
          : null,
        bids: b.Bids?.map(bid => ({
          id: bid.id,
          amount: bid.bidAmount,
          status: bid.status,
          userId: bid.userId,
        })) || [],
      }));
    }

    // 4️⃣ Fetch rooms via gharbeti
    let rooms = [];
    const gharbeti = await Gharbeti.findOne({ where: { userId } });
    if (gharbeti) {
      const userRooms = await Room.findAll({
        where: { gharbetiId: gharbeti.id },
        attributes: [
          "id",
          "name",
          "lat",
          "lng",
          "contact",
          "price",
          "description",
          "availability_status",
          "note",
          "status",
          "rejection_reason",
          "is_active",
          "createdAt",
        ],
      });
      rooms = userRooms.map(r => ({ ...r.get({ plain: true }) }));
    }


    const kycsRaw = await Kyc.findAll({
      where: { userId },
      attributes: [
        "id",
        "document_type",
        "status",
        "verified_at",
        "rejection_reason",
        "entityType",
        "entityId",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ],
      include: [
        {
          model: KycImages,
          attributes: ["id", "image_path", "image_type", "kycId", "createdAt", "updatedAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log("This is raw kycs:", kycsRaw);

    const kycs = kycsRaw.map(kyc => ({
      id: kyc.id,
      document_type: kyc.document_type,
      status: kyc.status,
      verified_at: kyc.verified_at,
      rejection_reason: kyc.rejection_reason,
      entityType: kyc.entityType,
      entityId: kyc.entityId,
      createdAt: kyc.createdAt,
      updatedAt: kyc.updatedAt,
      deletedAt: kyc.deletedAt,
      images: kyc.KycImages?.map(img => ({
        id: img.id,
        image_path: img.image_path,
        image_type: img.image_type,
      })) || [],
    }));

    // 6️⃣ Build final response
    const responseData = {
      id: userObj.id,
      name: userObj.name || userObj.username || "Unknown",
      email: userObj.email,
      phone: userObj.phone_number || userObj.phone || null,
      role: userRole,

      roles: roleNames,
      status: userObj.is_active ? "active" : "blocked",
      blocked_reason: userObj.is_active ? null : userObj.blocked_reason,
      profile_picture: userObj.profile_picture,
      joinedAt: userObj.createdAt,
      services,
      pastBookings,
      rooms,
      kycs, 
    };

    return responses.success(res, responseData, "User details fetched successfully.");
  } catch (err) {
    console.error("Error fetching user details:", err);
    return responses.serverError(res, {}, "Failed to fetch user details.");
  }
};










const forgetPassword = async(req,res,next)=>{
    try{
        const {email} = req.body;
        if(!fieldsValidation(email)){
            return responses.badRequest(res,{}, "Email is required");
        }
        const user = await userServices.getUserByEmail(email);
        if(!user){
            return responses.badRequest(res,{}, "Email not registered. Please sign up.");
        }
        const otpResponse = await otpServices.createAndStoreOtp(email);
        const formatForMessage = {
            to: email,
            subject: "Your OTP for password reset",
            text: `Your OTP for password reset is ${otpResponse}. It is valid for 10 minutes.`
        }
        const emailSent = await sendEmail(formatForMessage.to, formatForMessage.subject, formatForMessage.text);
        if(!emailSent){
            return responses.badRequest(res,{}, "Failed to send OTP. Please try again.");
        }
        return responses.success(res, "OTP sent successfully to your email. Please verify to reset your password.")
    }
    catch(err){
        console.error("Error in forgetPassword:", err);
        return responses.badRequest(res, {}, err.message || "An error occurred. Please try again later.");
    }
}

const resetPassword = async(req,res,next)=>{
    try{
        const {email, otp, newPassword} = req.body;
        if(!fieldsValidation(email, otp, newPassword)){
            return responses.badRequest(res,{}, "Email, OTP, and New Password are required");
        }
        const user = await userServices.getUserByEmail(email);
        if(!user){
            return responses.notFound(res,{}, "Email not registered. Please sign up.");
        }
        const otpVerification = await otpServices.verifyOtp(email, otp);
        if(!otpVerification.valid){
            return responses.badRequest(res,{}, otpVerification.message);
        }
        // const passwordHash = await bcrypt.hash(newPassword, 10);
        const updated = await userServices.updateUserPassword(user.id, newPassword);
        if(!updated){
            return responses.serverError(res,{}, "Failed to reset password. Please try again.");
        }
        return responses.success(res,{}, "Password reset successfully.");
    }
    catch(err){
        console.error("Error in resetPassword:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}

const logoutOtherSessions = async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const user = await userServices.getUserById(userId);
        if(!user){
            return responses.notFound(res,{}, "User not found.");
        }
        const loggedOut = await tokenService.invalidateOtherTokens(userId, req.headers["authorization"]?.split(" ")?.[1]);
        if(!loggedOut){
            return responses.serverError(res,{}, "Failed to logout from other sessions. Please try again.");
        }
        return responses.success(res,{}, "Logged out from other sessions successfully.");
    }
    catch(err){
        console.error("Error in logoutOtherSessions:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}


const registerAdmin = async(req,res,next)=>{
    try{
        const {name, email, password} = req.body;
        if(!fieldsValidation(name, email, password)){
            return responses.badRequest(res,{}, "Name, Email, and Password are required");
        }
        const emailFound = await checkEmailExists(email);
        if(emailFound){
            return responses.conflict(res,{}, "Email already registered. Please login or use a different email.");
        }
        const newUser = await userServices.createUser({name, email, password});
        const assignRole = await userServices.assignRoleToUser(newUser.id, "Admin");
        if(!newUser){
            return responses.serverError(res,{}, "Failed to create user. Please try again.");
        }
        return responses.success(res,{newUser}, "Admin user registered successfully.");
    }
    catch(err){
        console.error("Error in registerAdmin:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}


const aboutGharbeti = async(req,res,next)=>{
    try{
        const user = req.user.id;
        const gharbeti = await userServices.getGharbetiFromUserId(user);
        if(!gharbeti){
            return responses.notFound(res,{}, "Gharbeti profile not found.");
        }

        return responses.success(res,{gharbeti}, "Gharbeti profile fetched successfully.");
    }
    catch(err){
        console.error("Error in aboutGharbeti:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}

const gharbetiDetail = async(req,res,next)=>{
    try{
        const user = req.user.id;
        const gharbeti = await userServices.getGharbetiDetail(user);
        if(!gharbeti){
            return responses.notFound(res,{}, "Gharbeti profile not found.");
        }

        return responses.success(res,{gharbeti}, "Gharbeti profile fetched successfully.");
    }
    catch(err){
        console.error("Error in gharbetiDetail:", err);
        return responses.badRequest(res, {}, "An error occurred. Please try again later.");
    }
}

const aboutServiceProvider = async(req,res,next)=>{
    try{
       
        const user = req.user.id;
        const serviceProvider = await userServices.getServiceProviderFromUserId(user);

        if(!serviceProvider || !serviceProvider.is_active){
            return responses.notFound(res,{}, "Service Provider profile not found.");
        }
        return responses.success(res,{serviceProvider}, "Service Provider profile fetched successfully.");
    }
    catch(err){
        console.error("Error in aboutServiceProvider:", err);
          return responses.serverError(res, {
        details: err.message || err,
    }, err.message || "An error occurred. Please try again later.");
    }
}

const updateProfile = async(req,res,next)=>{
    try{
        const userId = req.user.id;
        const file = req.file;
        if(!file){
            return responses.badRequest(res,{}, "Profile image is required");
        }
        const user = await userServices.getUserById(userId);
        if(!user){
            return responses.notFound(res,{}, "User not found.");
        }
        const updatedUser = await userServices.updateUserProfilePicture(userId, file);
        if(!updatedUser){
            return responses.serverError(res,{}, "Failed to update profile picture. Please try again.");
        }
        updatedUser.password = undefined;
        return responses.success(res,{updatedUser}, "Profile picture updated successfully.");

    }
    catch(err){
        console.error("Error in updateProfile:", err);
        return responses.serverError(res, {}, "An error occurred. Please try again later.");
    }
}


// admin ko lagi yo chai
const getServiceProviderDetailFromUserId = async(req,res)=>{
    try{
        const userId = req.params.id;
        // console.log("Fetching Service Provider details for userId:", userId);
        if(!userId){
            return responses.badRequest(res, "User ID is required.");
        }
        const serviceProvider = await userServices.getServiceProviderFromUserId(userId);
        if(!serviceProvider){
            return responses.notFound(res, "Service Provider not found for this user.");
        }
        return responses.success(res,{serviceProvider}, "Service Provider details fetched successfully.");
    }
    catch(err){
        console.error("Error in getServiceProviderDetailFromUserId:", err);
        return responses.serverError(res, {err: err.message || "An error occurred. Please try again later."});

    }
}


const getUserDetail = async(req,res,next)=>{
    try{
        const id = req.params.id;
        if(!id){
            return responses.badRequest(res, "User ID is required.");
        }
        const userDetail = await userServices.getUserFullDetails(id);
        if(!userDetail){
            return responses.notFound(res, "User not found.");
        }
        userDetail.kyc = userDetail.kyc || [];
        return responses.success(res, {userDetail}, "User details fetched successfully.");
    }
    catch(err){
        console.error("Error in getUserDetail:", err);
        return responses.serverError(res, {err: err.message || "An error occurred. Please try again later."});
    }
}



const blockUser = async(req,res,next)=>{
    try{
        const {userId} = req.params;
        const {blocked_reason} = req.body;
        if(!userId){
            return responses.badRequest(res, "User ID is required.");
        }
        const user = await userServices.getUserById(userId);
        if(!user){
            return responses.notFound(res, "User not found.");
        }
        user.is_active = false;
        user.blocked_reason = blocked_reason || "Blocked by admin.";

       const emailSent = await sendEmail(
            user.email,
            "Account Blocked Notification",
            `Dear ${user.name || user.username},\n\nYour account has been blocked. Reason: ${user.blocked_reason}\n\nIf you believe this is a mistake, please contact support.\n\nBest regards,\nSupport Team`
        );

        if(!emailSent){
            console.error("Failed to send account blocked email to user:", user.email);
            return responses.serverError(res, {err: "Failed to send account blocked notification email."});
        }

        await user.save();
        return responses.success(res, {}, "User blocked successfully.");

    }
    catch(err){
        console.error("Error in blockUser:", err);
        return responses.serverError(res, {err: err.message || "An error occurred. Please try again later."});
    }
}


module.exports = {
    requestOtpForRegistration,
    verifyOtpForRegistration,
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    changeUserPassword,
    deleteUserAccount,
    getAllUsers,
    forgetPassword,
    resetPassword,
    logoutOtherSessions,
    registerAdmin,
    aboutGharbeti,
    aboutServiceProvider,
    searchNearbyUsers,
    searchCandidatesForBusiness,
    createUserLocation,
    listUserLocations,
    deleteUserLocation,
    changeUserStatusBlockUnblock,
    updateProfile,
    getServiceProviderDetailFromUserId,
    getUserDetail,
    getUserAllDetail,
    gharbetiDetail,
    blockUser
}