const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const WorkerProfile = sequelize.define("WorkerProfile", {
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    unique: true // One profile per user
  },
  title: { 
    type: DataTypes.STRING(255), 
    allowNull: false,
    comment: "Job title or profession (e.g., Plumber, Carpenter)"
  },
  bio: { 
    type: DataTypes.TEXT, 
    allowNull: true,
    comment: "Professional bio/summary"
  },
  profile_photo: { 
    type: DataTypes.STRING, 
    allowNull: true,
    comment: "Profile photo URL"
  },
  phone: { 
    type: DataTypes.STRING(20), 
    allowNull: true,
    comment: "Contact phone number"
  },
  hourly_rate: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: true,
    comment: "Hourly rate in NPR"
  },
  // Location
  latitude: { 
    type: DataTypes.DECIMAL(10, 8), 
    allowNull: true,
    comment: "GPS latitude"
  },
  longitude: { 
    type: DataTypes.DECIMAL(11, 8), 
    allowNull: true,
    comment: "GPS longitude"
  },
  location_name: { 
    type: DataTypes.STRING(255), 
    allowNull: true,
    comment: "Location text (e.g., Kathmandu, Nepal)"
  },
  service_radius: { 
    type: DataTypes.INTEGER, 
    defaultValue: 10,
    comment: "Service radius in kilometers"
  },
  // Skills (JSON array)
  skills: { 
    type: DataTypes.JSON, 
    defaultValue: [],
    comment: "Array of skills [{id, name}, ...]"
  },
  // Ratings & Reviews
  total_reviews: { 
    type: DataTypes.INTEGER, 
    defaultValue: 0
  },
  average_rating: { 
    type: DataTypes.DECIMAL(3, 2), 
    defaultValue: 0,
    comment: "Average rating from 0 to 5"
  },
  // Availability
  is_available: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true,
    comment: "Whether worker is currently available"
  },
  availability_status: {
    type: DataTypes.ENUM("available", "busy", "offline"),
    defaultValue: "available"
  },
  // Verification
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Is KYC verified?"
  },
  // Portfolio
  portfolio_links: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: "Array of portfolio URLs"
  },
  // Certifications
  certifications: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: "Array of certifications [{name, issuer, date}, ...]"
  },
  // Experience
  years_of_experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Categories (for filtering)
  categories: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: "Array of service categories"
  },
}, {
  tableName: "worker_profiles",
  timestamps: true,
  paranoid: false,
  indexes: [
    { fields: ["user_id"] },
    { fields: ["is_available"] },
    { fields: ["availability_status"] },
    { fields: ["is_verified"] },
  ]
});

module.exports = WorkerProfile;
