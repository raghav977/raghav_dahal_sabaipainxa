const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const BusinessAccount = sequelize.define("BusinessAccount", {
  user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  company_name: { type: DataTypes.STRING, allowNull: false },
  company_email: { type: DataTypes.STRING, allowNull: false, unique: true },
  industry: { type: DataTypes.STRING, allowNull: true },
  website: { type: DataTypes.STRING, allowNull: true },
  province: { type: DataTypes.INTEGER, allowNull: true },
  district: { type: DataTypes.INTEGER, allowNull: true },
  municipal: { type: DataTypes.INTEGER, allowNull: true },
  kyc_status: { type: DataTypes.ENUM("pending", "verified", "rejected"), defaultValue: "pending" },
  kyc_rejection_reason: { type: DataTypes.TEXT, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: false }, // admin must verify
  verified_at: { type: DataTypes.DATE, allowNull: true },
  verified_by: { type: DataTypes.INTEGER, allowNull: true }, // admin user_id
}, {
  tableName: "business_accounts",
  timestamps: true,
  paranoid: true,
});

// Define associations
BusinessAccount.associate = function(models) {
  BusinessAccount.belongsTo(models.User, { foreignKey: 'user_id' });
};

module.exports = BusinessAccount;
