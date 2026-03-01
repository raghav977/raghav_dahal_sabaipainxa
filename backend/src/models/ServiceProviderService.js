const sequelize = require("../config/db")
const { DataTypes } = require("sequelize");

const ServiceProviderServices = sequelize.define("ServiceProviderServices", {
  rate: {
    type: DataTypes.DECIMAL(10,2), 
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255), 
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected","blocked"),
    defaultValue: "pending",
  },
  rejected_reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isReapplied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reappliedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0, 
  },
  includes: {
    type: DataTypes.JSON, 
    allowNull: true,
  },
  note: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  reappliedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_active:{
    type:DataTypes.BOOLEAN,
    defaultValue:true,
  }
}, {
  tableName: "serviceproviderservices",
  timestamps: true,
  paranoid: true, 
});

module.exports = ServiceProviderServices;
