

const sequelize = require('../config/db');

const { DataTypes } = require('sequelize');

const ServiceLocation = sequelize.define("ServiceLocation", {
  address: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },
  ward: { type: DataTypes.STRING, allowNull: true },
  latitude: { type: DataTypes.FLOAT, allowNull: true },
  longitude: { type: DataTypes.FLOAT, allowNull: true },
  radius: { type: DataTypes.FLOAT, allowNull: true },
},{
    tableName:"service_locations",
    timestamps:true,
    paranoid:true
});

module.exports = ServiceLocation;