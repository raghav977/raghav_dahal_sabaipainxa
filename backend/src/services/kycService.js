const Kyc = require("../models/Kyc");
const ServiceProvider = require("../models/ServiceProvider");
const Gharbeti = require("../models/Gharbeti");

const KycImages = require("../models/kycImages");

const { getFilePath } = require("./fileServices");
const { assignRoleToUser, getUserById } = require("./userServices");
const sendEmail = require("./emailService");
// const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");
const BusinessAccount = require("../models/BusinessAccount");


const submitKyc = async (user, body, files, path) => {
    console.log("this path is", path);
    const entityType = path.includes("service_provider") ? "service_provider" : path.includes("businessAccount") ? "BusinessAccount" : "gharbeti";

    let EntityModel, role;
    if (entityType != "service_provider" && entityType != "gharbeti" && entityType != "BusinessAccount") {
        throw new Error("Please specify the service type for kyc either gharbeti, service_provider or BusinessAccount");
    }
    
    if (entityType === "service_provider") {
        console.log("This is service provider");
        EntityModel = ServiceProvider;
        const assigned_role = await assignRoleToUser(user.id, "Service_provider");
        if (!assigned_role) throw new Error("Failed to assign role to user");
        role = "Service_provider";
    } else if (entityType === "gharbeti") {
        console.log("This is gharbeti");
        EntityModel = Gharbeti;
        const assigned_role = await assignRoleToUser(user.id, "Gharbeti");
        if (!assigned_role) throw new Error("Failed to assign role to user");
        role = "Gharbeti";
    } else if (entityType === "BusinessAccount") {
        console.log("This is business account");
        EntityModel = BusinessAccount;
        const assigned_role = await assignRoleToUser(user.id, "BusinessAccount");
        if (!assigned_role) throw new Error("Failed to assign role to user");
        role = "BusinessAccount";
    }

    // For BusinessAccount, use user_id; for others use userId
    const whereClause = entityType === "BusinessAccount" 
        ? { user_id: user.id } 
        : { userId: user.id };

    let entity = await EntityModel.findOne({ where: whereClause });

    if (!entity) {
        const createData = entityType === "BusinessAccount" 
            ? { user_id: user.id, is_verified: false }
            : { userId: user.id, is_verified: false };
        entity = await EntityModel.create(createData);
    }


    const passport_photo = getFilePath(files?.passport_photo?.[0]);
    console.log("This is passport photo", passport_photo);
    if (!passport_photo) {
        throw new Error("Passport photo is required");
    }

    const { document_type } = body;
    console.log("This is entity type and document type", entityType, document_type);


    let document_url;
    if (document_type === "citizenship_card") {
        const front = getFilePath(files?.citizenship_card_front?.[0]);
        const back = getFilePath(files?.citizenship_card_back?.[0]);
        if (!front || !back) throw new Error("Both front and back images of citizenship card are required");
        document_url = JSON.stringify({ front, back });
    } else {
        const docFile = getFilePath(files?.document_file?.[0]);
        if (!docFile) throw new Error("Document file is required");
        document_url = JSON.stringify({ file: docFile });
    }


    const existingPending = await Kyc.findOne({
        where: { entityId: entity.id, entityType, status: "pending" }
    }); 

    if (existingPending) {
        throw new Error(`${entityType} already has a pending KYC`);
    }


    const kyc = await Kyc.create({
        document_type,
        status: "pending",
        entityType,
        entityId: entity.id,
        userId: user.id,

    });
    console.log("This is kyc", kyc.id);


    const kycimage= await KycImages.create({
        image_type: "passport_photo",
        kycId: kyc.id,
        image_path: passport_photo
    }, { logging: console.log });

   const documentFiles = JSON.parse(document_url);
for (const [key, value] of Object.entries(documentFiles)) {
    const newimage = await KycImages.create({
        image_type: key,   
        kycId: kyc.id,
        image_path: value
    });
}
if (!entity.is_active) {
        await EntityModel.update(
            { is_active: true },
            { where: { id: entity.id } }
        );
        console.log(`${entityType} reactivated after KYC submission`);
    }

    return { entityType, role, entity, kyc, kycimage };
};



const verifyKyc = async (kycId, action, rejectionReason = null) => {

    const kyc = await Kyc.findByPk(kycId);
    if (!kyc) throw new Error("KYC record not found");

    // if (kyc.status !== "pending") {
    //     throw new Error("Only pending KYCs can be verified");
    // }

    if (action === "approve") {
        await kyc.update({
            status: "approved",
            verified_at: new Date(),
            rejection_reason: null
        });

        console.log("this is kyc after approval", kyc);

        if (kyc.entityType === "service_provider") {
            await ServiceProvider.update(
                { is_verified: true },
                { where: { id: kyc.entityId } }
            );
        } else if (kyc.entityType === "gharbeti") {
            await Gharbeti.update(
                { is_verified: true },
                { where: { id: kyc.entityId } }
            );
        } else if (kyc.entityType === "BusinessAccount") {
            await BusinessAccount.update(
                { kyc_status: "verified", is_active: true, verified_at: new Date() },
                { where: { id: kyc.entityId } }
            );
        }
        // send approval email
        // const user = 
        const user = await getUserById(kyc.userId);
        if (!user) {
            throw new Error("User not found");
        }
        const emailSubject = "KYC Approved";
        const emailBody = `
            <p>Dear ${user.username},</p>
            <p>Your KYC has been approved. You can now access all the features of your account.</p>
            <p>Thank you for completing the KYC process.</p>
        `;
        const mailSent= await sendEmail(user.email, emailSubject, emailBody);
        if(!mailSent){
            throw new Error("Failed to send approval email");
        }
    } else if (action ==="reject") {
        if (!rejectionReason) {
            throw new Error("Rejection reason is required");
        }

        
        await kyc.update({
            status: "rejected",
            rejection_reason: rejectionReason,
            verified_at: new Date()
        });
        // send rejection email
        const user = await getUserById(kyc.userId);
        if (!user) {
            throw new Error("User not found");
        }
        const emailSubject = "KYC Rejected";
        const emailBody = `
            <p>Dear ${user.username},</p>
            <p>Your KYC has been rejected for the following reason:</p>
            <p>${rejectionReason}</p>
            <p>Please resubmit your KYC with the necessary corrections.</p>
        `;
        const mailSent= await sendEmail(user.email, emailSubject, emailBody);
        if (kyc.entityType === "service_provider") {
            await ServiceProvider.update(
                { is_verified: false , is_active: false},
                { where: { id: kyc.entityId } }
            );

        } else if (kyc.entityType === "gharbeti") {
            await Gharbeti.update(
                { is_verified: false, is_active: false },
                { where: { id: kyc.entityId } }
            );
        } else if (kyc.entityType === "BusinessAccount") {
            await BusinessAccount.update(
                { kyc_status: "rejected", kyc_rejection_reason: rejectionReason },
                { where: { id: kyc.entityId } }
            );
        }
        if(!mailSent){
            throw new Error("Failed to send rejection email");
        }


    } else {
        throw new Error("Invalid action. Use 'approve' or 'reject'.");
    }

    return kyc;
};


// get all KYC records, optionally filtered by status
const getAllKycStatus = async (status = null) => {
    const whereClause = status ? { status } : {};
    const kycs = await Kyc.findAll({ where: whereClause,
        include: [
            {
                model: KycImages,

            }]
     });
    
    return kycs;
};

const getDocumentTypes = async (req, res) => {
  try {
    const [results] = await sequelize.query("SHOW COLUMNS FROM Kycs LIKE 'document_type'");
    const enumValues = results[0].Type.match(/enum\((.*)\)/)[1]
      .replace(/'/g, "")
      .split(",");
      console.log(enumValues);
    return enumValues;
  } catch (err) {
    return err;
  }
};
module.exports = {
    submitKyc,
    verifyKyc,
    getAllKycStatus,
    getDocumentTypes,
};

