const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const JobResponse = sequelize.define("JobResponse", {
  job_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  cover_letter: { type: DataTypes.TEXT, allowNull: true },
  resume_url: { type: DataTypes.STRING, allowNull: true },
  // Additional info
  desired_position: { type: DataTypes.STRING(255), allowNull: true },
  years_experience: { type: DataTypes.INTEGER, allowNull: true },
  availability_days: { type: DataTypes.INTEGER, defaultValue: 7, comment: "When can start (days from now)" },
  expected_pay: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  portfolio_url: { type: DataTypes.STRING, allowNull: true },
  linkedin_url: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM("pending", "accepted", "rejected", "shortlisted"), defaultValue: "pending" },
  // Rejection reason
  rejection_reason: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: "job_responses",
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ["job_id", "user_id"], unique: true }, // Prevent duplicate applications
    { fields: ["job_id", "status"] },
    { fields: ["user_id"] },
  ]
});

module.exports = JobResponse;
