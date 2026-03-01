
const responses = require("../../http/response");
const Bid = require("../../models/Bid");
const Booking = require("../../models/Booking");
const Kyc = require("../../models/Kyc");
const Role = require("../../models/Role");
const Room = require("../../models/Room");
const ServiceProviderServices = require("../../models/ServiceProviderService");
const Service = require("../../models/Services");
const User = require("../../models/User")

const getDashboardMetricsData = async(req,res,next)=>{
    try{
        const totalUsers = await User.count();
        const totalServiceProviders = await User.count({
            include: [{
                model: Role,
                where: { name: 'service_provider' },
                through: { attributes: [] }
            }]
        });

        const totalServices = await Service.count();
        const totalGharbeti = await User.count({
            include: [{
                model: Role,
                where: { name: 'gharbeti' },
                through: { attributes: [] }
            }]
        });
        const totalBookings = await Booking.count();
        const totalRooms = await Room.count();
        const totalBids = await Bid.count();
        
        return responses.success(res,{
            totalUsers,
            totalServiceProviders,
            totalServices,
            totalGharbeti,
            totalBookings,
            totalRooms,
            totalBids
        },"Dashboard metrics data fetched successfully.");
        
    } catch(err){
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }

}

const getServicesData = async(req,res,next)=>{
    try{
        const services = await ServiceProviderServices.count();
        const verifiedServiceProviders = await ServiceProviderServices.count({
            where: { status: "approved" }
        });

        const pendingServiceProviders = await ServiceProviderServices.count({
            where: { status: "pending" }
        });

        const rejectedServiceProviders = await ServiceProviderServices.count({
            where: { status: "rejected" }
        });

        return responses.success(res,{
            services,
            verifiedServiceProviders,
            pendingServiceProviders,
            rejectedServiceProviders
        },"Services data fetched successfully.");

    }
    catch(err){

    }
}

const getRoomData = async(req,res,next)=>{
    try{
        const totalRooms = await Room.count();
        const approvedRooms = await Room.count({
            where: { status: "approved" }
        });
        
        const pendingRooms = await Room.count({
            where: { status: "pending" }
        });

        const rejectedRooms = await Room.count({
            where: { status: "rejected" }
        });

        const availableRooms = await Room.count({
            where: { availability_status:true }
        });

        const bookedRooms = await Room.count({
            where: { availability_status: false }
        });

        return responses.success(res,{
            totalRooms,
            approvedRooms,
            pendingRooms,
            rejectedRooms,
            availableRooms,
            bookedRooms
        },"Room data fetched successfully.");

    }
    catch(err){

    }
}

const getKycData = async(req,res,next)=>{
    try{
        const totalKycSubmissions = await Kyc.count();
        const approvedKyc = await Kyc.count({
            where: { status: "approved" }
        });
        
        const pendingKyc = await Kyc.count({
            where: { status: "pending" }
        });

        const rejectedKyc = await Kyc.count({
            where: { status: "rejected" }
        });

        return responses.success(res,{
            totalKycSubmissions,
            approvedKyc,
            pendingKyc,
            rejectedKyc
        },"KYC data fetched successfully.");

    }
    catch(err){

    }
}

const getServices = async(req,res,next)=>{
    try{
        const services = await Service.count();
        return responses.success(res,{services},"Services fetched successfully.");
    }
    catch(err){
        console.error("Error fetching services:", err);
        return responses.serverError(res, "Unable to fetch services");
    }
}

module.exports = {
    getDashboardMetricsData,getServicesData,getRoomData,getKycData,getServices
}