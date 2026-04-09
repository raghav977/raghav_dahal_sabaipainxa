const responses = require("../http/response");
const BusinessAccount = require("../models/BusinessAccount");
const User = require("../models/User");
const Kyc = require("../models/Kyc");
const KycImages = require("../models/kycImages");
const Role = require("../models/Role");
const { Op } = require("sequelize");
const kycService = require("../services/kycService");

// Register business account with KYC documents
const registerBusinessAccount = async (req, res) => {
  try {
    // Get user_id from authenticated user (via authMiddleware)
    const user = req.user;
    const { company_name, company_email, industry, website, province, district, municipal } = req.body;
    const files = req.files || {};

    console.log("Registering business account for user_id:", user?.id);
    console.log("The request body is", req.body);
    console.log("The uploaded files are", files);

    if (!user?.id || !company_name || !company_email) {
      return responses.badRequest(res, {}, "User authentication, company_name, and company_email are required");
    }

    const userRecord = await User.findByPk(user.id);
    if (!userRecord) return responses.notFound(res, "User not found");

    // Check if business account already exists
    const existing = await BusinessAccount.findOne({ where: { user_id: user.id } });
    if (existing) return responses.conflict(res, {}, "Business account already exists for this user");

    // Create business account first
    const bizAccount = await BusinessAccount.create({
      user_id: user.id,
      company_name,
      company_email,
      industry: industry || null,
      website: website || null,
      province: province || null,
      district: district || null,
      municipal: municipal || null,
      kyc_status: "pending",
    });

    // Now use kycService to handle all KYC logic
    try {
      const kycResult = await kycService.submitKyc(user, req.body, files, "businessAccount");
      
      return responses.created(res, { bizAccount, kyc: kycResult.kyc }, "Business account registered. Awaiting KYC verification.");
    } catch (kycErr) {
      // If KYC submission fails, we should ideally rollback the business account creation
      // But for now, we'll just return the error
      console.error("KYC submission failed:", kycErr);
      return responses.serverError(res, {}, kycErr.message || "Failed to submit KYC");
    }
  } catch (err) {
    console.error("Error registering business account:", err);
    return responses.serverError(res, {}, "Failed to register business account");
  }
};

// Get business account by user_id
const getBusinessAccount = async (req, res) => {
  try {
    const user_id = req.params.user_id || req.user?.id;
    if (!user_id) return responses.badRequest(res, {}, "user_id is required");

    const bizAccount = await BusinessAccount.findOne({ where: { user_id } });
    if (!bizAccount) return responses.notFound(res, "Business account not found");

    return responses.success(res, bizAccount, "Business account fetched");
  } catch (err) {
    console.error(err);
    return responses.serverError(res, {}, "Failed to fetch business account");
  }
};

// Admin: verify business account (set is_active = true)
const verifyBusinessAccount = async (req, res) => {
  try {
    const { business_account_id, approval } = req.body;
    const admin_id = req.user?.id;

    if (!business_account_id || !approval) {
      return responses.badRequest(res, {}, "business_account_id and approval (true/false) are required");
    }

    const bizAccount = await BusinessAccount.findByPk(business_account_id);
    if (!bizAccount) return responses.notFound(res, "Business account not found");

    if (approval === true) {
      bizAccount.kyc_status = "verified";
      bizAccount.is_active = true;
      bizAccount.verified_at = new Date();
      bizAccount.verified_by = admin_id;
      await bizAccount.save();

      // Also update KYC record
      const kyc = await Kyc.findOne({ where: { entityId: business_account_id, entityType: "BusinessAccount" } });
      if (kyc) {
        kyc.status = "verified";
        await kyc.save();
      }

      return responses.success(res, bizAccount, "Business account verified and activated");
    } else {
      const { rejection_reason } = req.body;
      bizAccount.kyc_status = "rejected";
      bizAccount.kyc_rejection_reason = rejection_reason || "Rejected by admin";
      await bizAccount.save();

      const kyc = await Kyc.findOne({ where: { entityId: business_account_id, entityType: "BusinessAccount" } });
      if (kyc) {
        kyc.status = "rejected";
        kyc.rejection_reason = rejection_reason || "Rejected by admin";
        await kyc.save();
      }

      return responses.success(res, bizAccount, "Business account rejected");
    }
  } catch (err) {
    console.error(err);
    return responses.serverError(res, {}, "Failed to verify business account");
  }
};

// List all business accounts (admin only)
const listBusinessAccounts = async (req, res) => {
  try {
    const { status = "all", page = 1, limit = 20 } = req.query;
    const where = {};
    if (status !== "all") where.kyc_status = status;

    const { count, rows } = await BusinessAccount.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["createdAt", "DESC"]],
    });

    return responses.success(res, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows,
    }, "Business accounts fetched");
  } catch (err) {
    console.error(err);
    return responses.serverError(res, {}, "Failed to list business accounts");
  }
};

module.exports = {
  registerBusinessAccount,
  getBusinessAccount,
  verifyBusinessAccount,
  listBusinessAccounts,
};
