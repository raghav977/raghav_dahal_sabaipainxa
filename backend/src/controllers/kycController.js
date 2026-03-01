const responses = require("../http/response");
const kycService = require("../services/kycService");
// const KycImages = require("../models/kycImages"); 

const applyKyc = async (req, res, next) => {
    try {
        const user = req.user;
        const body = req.body;
        const files = req.files;

        const path = req.query.data;
        console.log('Thisis path',path);

        const createKyc = await kycService.submitKyc(user, body, files, path);
        const { kyc, entityType, role, entity } = createKyc;
        return responses.success(res, { kyc,role,entityType,entity }, "KYC submitted successfully. It is now pending review.");
    } catch (err) {
        console.error("Error in applyKyc:", err);
        return responses.serverError(res, {}, err.message || "An error occurred. Please try again later.");
    }
};


const documentType = async(req,res,next)=>{
    try{
        const type = await kycService.getDocumentTypes();
        return responses.success(res,{type},"Document types fetched successfully");

    }
    catch(err){
        console.error("Error in getDocumentTypes:", err);
        return responses.serverError(res, err.message || "An error occurred. Please try again later.");

    }
}
module.exports = { applyKyc, documentType };