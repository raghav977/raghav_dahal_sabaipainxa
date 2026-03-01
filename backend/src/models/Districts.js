const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Province = require("./Provinces");

const District = sequelize.define('district', {
  id: { type: DataTypes.INTEGER, primaryKey:true, autoIncrement:true },
  district_code: { type: DataTypes.INTEGER, allowNull:false, unique:true },
  name_en: { type: DataTypes.STRING, allowNull:false, unique:true },
  name_np: { type: DataTypes.STRING, allowNull:false, unique:true },
  province_code: { 
    type: DataTypes.INTEGER, 
    allowNull:false,
    references: { model: 'provinces', key: 'province_code' }, // FK references province.province_code
    onUpdate: "CASCADE",
    onDelete: "RESTRICT"
  }
}, { tableName: 'districts', timestamps:false });

module.exports = District;
