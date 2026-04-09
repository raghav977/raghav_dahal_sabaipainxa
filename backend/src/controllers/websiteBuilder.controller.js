const responses = require("../http/response");
const WebsiteBuilder = require("../models/WebsiteBuilder");
const BusinessAccount = require("../models/BusinessAccount");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs").promises;

// Production-ready optimizations:
// 1. Image files stored separately, not in database (no base64 bloat)
// 2. Selective column queries (exclude JSON data on list views)
// 3. Raw queries where possible (reduce Sequelize overhead)
// 4. Proper indexing and caching strategies

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "../../uploads/website-images");
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error("Error creating upload directory:", err);
  }
};

// Create a new website for a business account
const createWebsite = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const { website_name, theme, pages } = req.body;

    if (!user_id) {
      return responses.unauthorized(res, "User authentication required");
    }

    // Find business account for this user
    const businessAccount = await BusinessAccount.findOne({ where: { user_id } });
    if (!businessAccount) {
      return responses.notFound(res, "Business account not found");
    }

    if (!website_name) {
      return responses.badRequest(res, {}, "website_name is required");
    }

    // Generate slug from website name
    const website_slug = website_name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Check if slug already exists
    const existing = await WebsiteBuilder.findOne({ where: { website_slug } });
    if (existing) {
      return responses.conflict(res, {}, "Website slug already exists. Please use a different name.");
    }

    // Create website with default theme if not provided
    const defaultTheme = {
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      font: "Inter, sans-serif",
      style: "modern",
    };

    const website = await WebsiteBuilder.create({
      business_account_id: businessAccount.id,
      website_name,
      website_slug,
      theme: theme || defaultTheme,
      pages: pages || [],
    });

    return responses.created(res, website, "Website created successfully");
  } catch (err) {
    console.error("Error creating website:", err);
    return responses.serverError(res, {}, "Failed to create website");
  }
};

// OPTIMIZED: Get all websites for a business account (WITHOUT JSON data)
// This prevents MySQL sort memory issues when large JSON is present
const getBusinessWebsites = async (req, res) => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return responses.unauthorized(res, "User authentication required");
    }

    const businessAccount = await BusinessAccount.findOne({ where: { user_id } });
    if (!businessAccount) {
      return responses.notFound(res, "Business account not found");
    }

    // OPTIMIZATION: Select only necessary columns, exclude large JSON data
    const websites = await WebsiteBuilder.findAll({
      where: { business_account_id: businessAccount.id },
      attributes: [
        "id",
        "website_name",
        "website_slug",
        "is_published",
        "custom_domain",
        "createdAt",
        "updatedAt",
      ],
      order: [["createdAt", "DESC"]],
      raw: true, // Return plain objects, faster than Sequelize instances
      limit: 100, // Pagination to prevent memory issues
    });

    return responses.success(res, websites, "Websites fetched successfully");
  } catch (err) {
    console.error("Error fetching websites:", err);
    return responses.serverError(res, {}, "Failed to fetch websites");
  }
};

// Get a single website by ID (with all data for editor)
const getWebsite = async (req, res) => {
  try {
    const { website_id } = req.params;
    const user_id = req.user?.id;

    const website = await WebsiteBuilder.findByPk(website_id);
    if (!website) {
      return responses.notFound(res, "Website not found");
    }

    // Verify ownership
    const businessAccount = await BusinessAccount.findByPk(website.business_account_id);
    if (businessAccount.user_id !== user_id) {
      return responses.forbidden(res, "You don't have access to this website");
    }

    return responses.success(res, website, "Website fetched successfully");
  } catch (err) {
    console.error("Error fetching website:", err);
    return responses.serverError(res, {}, "Failed to fetch website");
  }
};

// PRODUCTION: Upload and optimize image
const uploadWebsiteImage = async (req, res) => {
  try {
    const { website_id } = req.params;
    const user_id = req.user?.id;

    if (!req.file) {
      return responses.badRequest(res, {}, "No file uploaded");
    }

    // Validate file type (whitelist approach)
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return responses.badRequest(res, {}, "Invalid file type. Only JPG, PNG, GIF, WebP allowed.");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return responses.badRequest(res, {}, "File too large. Maximum 5MB allowed.");
    }

    const website = await WebsiteBuilder.findByPk(website_id);
    if (!website) {
      return responses.notFound(res, "Website not found");
    }

    // Verify ownership
    const businessAccount = await BusinessAccount.findByPk(website.business_account_id);
    if (businessAccount.user_id !== user_id) {
      return responses.forbidden(res, "You don't have access to this website");
    }

    // Ensure upload directory exists
    await ensureUploadDir();

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(req.file.originalname);
    const filename = `${timestamp}-${random}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Save file directly (can add sharp optimization later if needed)
    await fs.writeFile(filepath, req.file.buffer);

    // Return relative path for storage
    const imagePath = `/uploads/website-images/${filename}`;

    return responses.created(res, { imagePath }, "Image uploaded successfully");
  } catch (err) {
    console.error("Error uploading image:", err);
    return responses.serverError(res, {}, "Failed to upload image");
  }
};

// Update website (theme, pages, seo, settings)
const updateWebsite = async (req, res) => {
  try {
    const { website_id } = req.params;
    const user_id = req.user?.id;
    const { theme, pages, seo, settings, analytics_code } = req.body;
    console.log("This is update website body:", req.body);

    const website = await WebsiteBuilder.findByPk(website_id);
    if (!website) {
      return responses.notFound(res, "Website not found");
    }

    // Verify ownership
    const businessAccount = await BusinessAccount.findByPk(website.business_account_id);
    if (businessAccount.user_id !== user_id) {
      return responses.forbidden(res, "You don't have access to this website");
    }

    // Update fields
    if (theme) website.theme = theme;
    if (pages) website.pages = pages;
    if (seo) website.seo = seo;
    if (settings) website.settings = settings;
    if (analytics_code) website.analytics_code = analytics_code;

    await website.save();

    return responses.updated(res, website, "Website updated successfully");
  } catch (err) {
    console.error("Error updating website:", err);
    return responses.serverError(res, {}, "Failed to update website");
  }
};

// Publish/Unpublish website
const togglePublish = async (req, res) => {
  try {
    const { website_id } = req.params;
    const user_id = req.user?.id;
    const { is_published } = req.body;

    const website = await WebsiteBuilder.findByPk(website_id);
    if (!website) {
      return responses.notFound(res, "Website not found");
    }

    // Verify ownership
    const businessAccount = await BusinessAccount.findByPk(website.business_account_id);
    if (businessAccount.user_id !== user_id) {
      return responses.forbidden(res, "You don't have access to this website");
    }

    website.is_published = is_published === true;
    if (is_published === true) {
      website.published_at = new Date();
    } else {
      website.published_at = null;
    }

    await website.save();

    return responses.success(
      res,
      website,
      `Website ${is_published ? "published" : "unpublished"} successfully`
    );
  } catch (err) {
    console.error("Error toggling publish:", err);
    return responses.serverError(res, {}, "Failed to toggle publish status");
  }
};

// Set custom domain
const setCustomDomain = async (req, res) => {
  try {
    const { website_id } = req.params;
    const user_id = req.user?.id;
    const { custom_domain } = req.body;

    if (!custom_domain) {
      return responses.badRequest(res, {}, "custom_domain is required");
    }

    const website = await WebsiteBuilder.findByPk(website_id);
    if (!website) {
      return responses.notFound(res, "Website not found");
    }

    // Verify ownership
    const businessAccount = await BusinessAccount.findByPk(website.business_account_id);
    if (businessAccount.user_id !== user_id) {
      return responses.forbidden(res, "You don't have access to this website");
    }

    // Check if domain already in use
    const existingDomain = await WebsiteBuilder.findOne({
      where: { custom_domain, id: { [Op.ne]: website_id } },
    });
    if (existingDomain) {
      return responses.conflict(res, {}, "This domain is already in use");
    }

    website.custom_domain = custom_domain;
    website.is_custom_domain_verified = false; // Needs DNS verification
    await website.save();

    return responses.updated(res, website, "Custom domain set. Please verify DNS records.");
  } catch (err) {
    console.error("Error setting custom domain:", err);
    return responses.serverError(res, {}, "Failed to set custom domain");
  }
};

// Delete website
const deleteWebsite = async (req, res) => {
  try {
    const { website_id } = req.params;
    const user_id = req.user?.id;

    const website = await WebsiteBuilder.findByPk(website_id);
    if (!website) {
      return responses.notFound(res, "Website not found");
    }

    // Verify ownership
    const businessAccount = await BusinessAccount.findByPk(website.business_account_id);
    if (businessAccount.user_id !== user_id) {
      return responses.forbidden(res, "You don't have access to this website");
    }

    await website.destroy();

    return responses.deleted(res, {}, "Website deleted successfully");
  } catch (err) {
    console.error("Error deleting website:", err);
    return responses.serverError(res, {}, "Failed to delete website");
  }
};

// Get website by slug (public endpoint for preview)
const getWebsiteBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const website = await WebsiteBuilder.findOne({
      where: { website_slug: slug },
      attributes: [
        "id",
        "website_name",
        "website_slug",
        "theme",
        "pages",
        "seo",
        "settings",
        "is_published",
        "custom_domain",
      ],
    });

    if (!website) {
      return responses.notFound(res, "Website not found");
    }

    // Optional: Only show published websites (comment out to allow draft preview)
    // if (!website.is_published) {
    //   return responses.notFound(res, "Website not found");
    // }

    return responses.success(res, website, "Website fetched successfully");
  } catch (err) {
    console.error("Error fetching website by slug:", err);
    return responses.serverError(res, {}, "Failed to fetch website");
  }
};

module.exports = {
  createWebsite,
  getBusinessWebsites,
  getWebsite,
  updateWebsite,
  togglePublish,
  setCustomDomain,
  deleteWebsite,
  getWebsiteBySlug,
  uploadWebsiteImage,
};
