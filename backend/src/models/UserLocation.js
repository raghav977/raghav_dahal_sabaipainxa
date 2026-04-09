const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const UserLocation = sequelize.define("UserLocation", {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: true },
  latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  availability: { type: DataTypes.ENUM("full-time", "part-time", "remote"), allowNull: false, defaultValue: "full-time" },
  radius_km: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 10 },
}, {
  tableName: "user_locations",
  timestamps: true,
  paranoid: true,
});

module.exports = UserLocation;
