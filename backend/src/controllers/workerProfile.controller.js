const responses = require("../http/response");
const WorkerProfile = require("../models/WorkerProfile");
const User = require("../models/User");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs").promises;

const UPLOAD_DIR = path.join(__dirname, "../../uploads/worker-profiles");

// Ensure upload directory
const ensureUploadDir = async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error("Error creating upload directory:", err);
  }
};

// Create or update worker profile
const createOrUpdateProfile = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return responses.unauthorized(res, "Authentication required");
    }

    const {
      title,
      bio,
      phone,
      hourly_rate,
      location_name,
      latitude,
      longitude,
      service_radius,
      skills,
      availability_status,
      portfolio_links,
      certifications,
      years_of_experience,
      categories,
    } = req.body;

    if (!title) {
      return responses.badRequest(res, {}, "Title (profession) is required");
    }

    let profile = await WorkerProfile.findOne({ where: { user_id } });

    if (!profile) {
      // Create new profile
      profile = await WorkerProfile.create({
        user_id,
        title,
        bio: bio || null,
        phone: phone || null,
        hourly_rate: hourly_rate || null,
        location_name: location_name || null,
        latitude: latitude || null,
        longitude: longitude || null,
        service_radius: service_radius || 10,
        skills: skills || [],
        availability_status: availability_status || "available",
        portfolio_links: portfolio_links || [],
        certifications: certifications || [],
        years_of_experience: years_of_experience || 0,
        categories: categories || [],
      });
    } else {
      // Update existing profile
      profile.title = title;
      if (bio !== undefined) profile.bio = bio;
      if (phone !== undefined) profile.phone = phone;
      if (hourly_rate !== undefined) profile.hourly_rate = hourly_rate;
      if (location_name !== undefined) profile.location_name = location_name;
      if (latitude !== undefined) profile.latitude = latitude;
      if (longitude !== undefined) profile.longitude = longitude;
      if (service_radius !== undefined) profile.service_radius = service_radius;
      if (skills !== undefined) profile.skills = skills;
      if (availability_status !== undefined) profile.availability_status = availability_status;
      if (portfolio_links !== undefined) profile.portfolio_links = portfolio_links;
      if (certifications !== undefined) profile.certifications = certifications;
      if (years_of_experience !== undefined) profile.years_of_experience = years_of_experience;
      if (categories !== undefined) profile.categories = categories;

      await profile.save();
    }

    // Fetch with user info
    const profileWithUser = await WorkerProfile.findByPk(profile.id, {
      include: [{ model: User, attributes: ["id", "name", "email"] }],
    });

    return responses.success(res, profileWithUser, "Profile saved successfully");
  } catch (err) {
    console.error("Error saving profile:", err);
    return responses.serverError(res, {}, "Failed to save profile");
  }
};

// Get worker profile by ID
const getProfile = async (req, res) => {
  try {
    const { worker_id } = req.params;
    
    // worker_id can be either the WorkerProfile ID or the User ID
    // Try to find by user_id first (most common case)
    let profile = await WorkerProfile.findOne({
      where: { user_id: worker_id },
      include: [{ model: User, attributes: ["id", "name", "email", "phone_number", "profile_picture"] }],
    });

    // If not found, try by WorkerProfile ID
    if (!profile) {
      profile = await WorkerProfile.findByPk(worker_id, {
        include: [{ model: User, attributes: ["id", "name", "email", "phone_number", "profile_picture"] }],
      });
    }

    if (!profile) {
      return responses.notFound(res, "Profile not found");
    }

    return responses.success(res, profile, "Profile fetched");
  } catch (err) {
    console.error("Error fetching profile:", err);
    return responses.serverError(res, {}, "Failed to fetch profile");
  }
};

// Get current user's profile
const getMyProfile = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return responses.unauthorized(res, "Authentication required");
    }

    const profile = await WorkerProfile.findOne({
      where: { user_id },
      include: [{ model: User, attributes: ["id", "name", "email", "phone_number"] }],
    });

    if (!profile) {
      return responses.notFound(res, "Profile not found. Create one first.");
    }

    return responses.success(res, profile, "Your profile");
  } catch (err) {
    console.error("Error fetching profile:", err);
    return responses.serverError(res, {}, "Failed to fetch profile");
  }
};

// Upload profile photo
const uploadProfilePhoto = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return responses.unauthorized(res, "Authentication required");
    }

    if (!req.file) {
      return responses.badRequest(res, {}, "No file uploaded");
    }

    const allowedMimes = ["image/jpeg", "image/png"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return responses.badRequest(res, {}, "Only JPG and PNG allowed");
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return responses.badRequest(res, {}, "File too large (max 5MB)");
    }

    await ensureUploadDir();

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(req.file.originalname);
    const filename = `${user_id}-${timestamp}-${random}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filepath, req.file.buffer);

    const profile_photo = `/uploads/worker-profiles/${filename}`;

    let profile = await WorkerProfile.findOne({ where: { user_id } });
    if (!profile) {
      return responses.badRequest(res, {}, "Create profile first");
    }

    profile.profile_photo = profile_photo;
    await profile.save();

    return responses.success(res, { profile_photo }, "Photo uploaded");
  } catch (err) {
    console.error("Error uploading photo:", err);
    return responses.serverError(res, {}, "Failed to upload photo");
  }
};

// Search worker profiles (for business accounts)
const searchProfiles = async (req, res) => {
  try {
    const {
      skills,
      location_name,
      latitude,
      longitude,
      radius,
      title,
      min_rating,
      is_verified,
      availability_status,
      min_experience,
      max_hourly_rate,
      page = 1,
      limit = 20,
    } = req.query;

    let where = { is_available: true };
    let searchRadius = parseInt(radius) || 10; // Default 10km

    // Filter by title/profession
    if (title) {
      where.title = { [Op.iLike]: `%${title}%` };
    }

    // Filter by skills (JSON array contains)
    if (skills) {
      const skillArray = typeof skills === "string" ? [skills] : skills;
      where.skills = { [Op.or]: skillArray.map(s => ({ [Op.substring]: s })) };
    }

    // Filter by location name
    if (location_name) {
      where.location_name = { [Op.iLike]: `%${location_name}%` };
    }

    // Filter by rating
    if (min_rating) {
      where.average_rating = { [Op.gte]: parseFloat(min_rating) };
    }

    // Filter by verification
    if (is_verified !== undefined) {
      where.is_verified = is_verified === "true" || is_verified === true;
    }

    // Filter by availability
    if (availability_status) {
      where.availability_status = availability_status;
    }

    // Filter by experience
    if (min_experience) {
      where.years_of_experience = { [Op.gte]: parseInt(min_experience) };
    }

    // Filter by hourly rate
    if (max_hourly_rate) {
      where.hourly_rate = { [Op.lte]: parseFloat(max_hourly_rate) };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Geographic search (if coordinates provided)
    let profiles;
    if (latitude && longitude) {
      // Simple distance filtering (proper implementation needs PostGIS)
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      profiles = await WorkerProfile.findAll({
        where,
        include: [{ model: User, attributes: ["id", "name", "email", "phone_number"] }],
        limit: parseInt(limit),
        offset,
        order: [["average_rating", "DESC"]],
      });

      // Filter by distance (basic haversine formula)
      profiles = profiles.filter((p) => {
        if (!p.latitude || !p.longitude) return false;
        const distance = calculateDistance(lat, lon, p.latitude, p.longitude);
        return distance <= searchRadius;
      });
    } else {
      profiles = await WorkerProfile.findAll({
        where,
        include: [{ model: User, attributes: ["id", "name", "email", "phone_number"] }],
        limit: parseInt(limit),
        offset,
        order: [["average_rating", "DESC"]],
      });
    }

    const total = await WorkerProfile.count({ where });

    return responses.success(
      res,
      {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        data: profiles,
      },
      "Profiles fetched"
    );
  } catch (err) {
    console.error("Error searching profiles:", err);
    return responses.serverError(res, {}, "Failed to search profiles");
  }
};

// Helper: Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Update availability status
const updateAvailability = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return responses.unauthorized(res, "Authentication required");
    }

    const { is_available, availability_status } = req.body;

    let profile = await WorkerProfile.findOne({ where: { user_id } });
    if (!profile) {
      return responses.notFound(res, "Profile not found");
    }

    if (is_available !== undefined) {
      profile.is_available = is_available;
    }
    if (availability_status !== undefined) {
      profile.availability_status = availability_status;
    }

    await profile.save();

    return responses.success(res, profile, "Availability updated");
  } catch (err) {
    console.error("Error updating availability:", err);
    return responses.serverError(res, {}, "Failed to update availability");
  }
};

// Add skill to profile
const addSkill = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return responses.unauthorized(res, "Authentication required");
    }

    const { skill_name, proficiency_level } = req.body;
    if (!skill_name) {
      return responses.badRequest(res, {}, "Skill name is required");
    }

    let profile = await WorkerProfile.findOne({ where: { user_id } });
    if (!profile) {
      return responses.notFound(res, "Profile not found");
    }

    const newSkill = {
      id: Date.now(),
      name: skill_name,
      proficiency: proficiency_level || "intermediate",
    };

    if (!profile.skills) profile.skills = [];
    profile.skills.push(newSkill);

    await profile.save();

    return responses.success(res, profile, "Skill added");
  } catch (err) {
    console.error("Error adding skill:", err);
    return responses.serverError(res, {}, "Failed to add skill");
  }
};

// Remove skill from profile
const removeSkill = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return responses.unauthorized(res, "Authentication required");
    }

    const { skill_id } = req.params;

    let profile = await WorkerProfile.findOne({ where: { user_id } });
    if (!profile) {
      return responses.notFound(res, "Profile not found");
    }

    if (!profile.skills || profile.skills.length === 0) {
      return responses.badRequest(res, {}, "No skills found");
    }

    profile.skills = profile.skills.filter((s) => s.id != skill_id);
    await profile.save();

    return responses.success(res, profile, "Skill removed");
  } catch (err) {
    console.error("Error removing skill:", err);
    return responses.serverError(res, {}, "Failed to remove skill");
  }
};

module.exports = {
  createOrUpdateProfile,
  getProfile,
  getMyProfile,
  uploadProfilePhoto,
  searchProfiles,
  updateAvailability,
  addSkill,
  removeSkill,
};
