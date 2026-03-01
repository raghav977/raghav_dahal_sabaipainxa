const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Package = sequelize.define("Package", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  includes:{
    type: DataTypes.JSON,
    allowNull: true,
  },
  note:{
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: "packages",
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ["serviceProviderServiceId", "name"],
    },
  ],
});

module.exports = Package;
