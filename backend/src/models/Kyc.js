const sequelize = require("../config/db");
const {DataTypes} = require("sequelize");

const Kyc = sequelize.define("Kyc", {
  document_type: {
    type: DataTypes.ENUM("passport", "national_id", "driver_license", "citizenship_card"),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    defaultValue: "pending",
  },
  verified_at: {
    type: DataTypes.DATE,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  paranoid: true, 
  timestamps: true,
  tableName: "kycs"
});

module.exports = Kyc;