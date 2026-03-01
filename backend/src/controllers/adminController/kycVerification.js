
const Kyc = require("../../models/Kyc");
const ServiceProvider = require("../../models/ServiceProvider");

const { getFilePath } = require("../../services/fileServices");
const { assignRoleToUser } = require("../../services/userServices");
const responses = require("../../http/response");
const kycService = require("../../services/kycService");
const { authMiddleware } = require("../../middleware/authMiddleware");
const BaseController = require("../baseController");
const User = require("../../models/User");
const KycImages = require("../../models/kycImages");

const verifyKyc = async (req, res, next) => {
    console.log("KYC verification request received:", { admin: req.user.id, body: req.body });
    try {
        if (req.user.role !== "admin") {
            return responses.forbidden(res, {}, "Only admins can verify KYCs.");
        }
        const { kycId, action, rejectionReason } = req.body;
        if (!kycId || !action) {
            return responses.badRequest(res, {}, "kycId and action are required.");
        }

        // process the KYC verification
        const kyc = await kycService.verifyKyc(kycId, action, rejectionReason);
        return responses.success(res, { kyc }, "KYC verification successful.");
    } catch (error) {
        console.error("Error verifying KYC:", error);
        return responses.serverError(res, {}, "Error verifying KYC.");
    }
};


// get all KYCs - for admin dashboard

const getAllKycStatus = async (req, res, next) => {
    console.log("Get all KYC status request received:", { admin: req.user.id });
    const status = req.query.status; 
    try{
        const kyc = await kycService.getAllKycStatus(status);
        return responses.success(res, { kyc }, "KYC records retrieved successfully.");

    } catch (error) {
        console.error("Error retrieving KYC records:", error);
        return responses.internalServerError(res, {}, "Error retrieving KYC records.");
    }
}


class kycController extends BaseController{
    constructor(){
        super(Kyc,{
            searchFields:["status","rejected_reason","document_type"],
            filterFields:["status","entityType","userId"],
            defaultLimit:10,
            defaultOrder:[["createdAt","DESC"]],
        })
    }

    async list(req,res){
        try{
            const limit = parseInt(req.query.limit) || this.defaultLimit;
            const offset = parseInt(req.query.offset) || 0;
            const search = req.query.search || null;
            const ordering = req.query.ordering || null;

            const where = {};

            // Search functionality
            if(search && this.searchFields.length>0){
                where[Op.or] = this.searchFields.map((field)=>({
                    [field]:{[Op.like] : `%${search}%`},
                }))
            }
            // filtering (exact match wala)
            this.filterFields.forEach((field)=>{
                if(req.query[field]){
                    where[field] = req.query[field];
                }
            });
            // ordering wala yo chai
            let order = this.defaultOrder;
            if(ordering){
                const orderFields = ordering.split(',');
                order = orderFields.map((field)=>{
                    if(field.startsWith('-')){
                        return [field.substring(1),'DESC'];
                    }
                    return [field,'ASC'];
                });
            }


            const {count,rows} = await this.model.findAndCountAll({
                where,
                limit,
                offset,
                order,
                include:[{
                    model:User,
                    attributes:["id","username","email","phone_number"]
                },
                {
                    model:KycImages,
                    attributes:["id","image_path","image_type"]
                }
            ]
        });

        return responses.success(res,{
            total:count,
            limit,
            offset,
            result:rows,
            next: offset + limit < count ? offset + limit : null,
            previous: offset - limit >= 0 ? offset - limit : null,

        },"KYC records retrieved successfully");
    }

    catch(err){
        console.error("Error in listing KYC records:", err);
        return responses.serverError(res,{},"An error occurred while retrieving KYC records.");
    }
}
}


module.exports = {
    verifyKyc,
    getAllKycStatus,
    kycController
};
