const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Job = sequelize.define("Job", {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  requirements: { type: DataTypes.TEXT, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true },
  preferred_location: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: true },
  work_type: { type: DataTypes.STRING, allowNull: true },
  salary_min: { type: DataTypes.FLOAT, allowNull: true },
  salary_max: { type: DataTypes.FLOAT, allowNull: true },
  pay_type: { type: DataTypes.STRING, allowNull: true },
  benefits: { type: DataTypes.TEXT, allowNull: true },
  contact_email: { type: DataTypes.STRING, allowNull: true },
  contact_phone: { type: DataTypes.STRING, allowNull: true },
  application_link: { type: DataTypes.STRING, allowNull: true },
  application_deadline: { type: DataTypes.DATE, allowNull: true },
  required_documents: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM("draft", "open", "closed"), defaultValue: "open" },
  created_by: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "jobs",
  timestamps: true,
  paranoid: true,
  indexes: [
    // prevent duplicate job titles for the same creator (business)
    { unique: true, fields: ["title", "created_by"] }
  ]
});

// Define associations
Job.associate = function(models) {
  Job.belongsTo(models.User, { as: 'creator', foreignKey: 'created_by' });
};

module.exports = Job;
