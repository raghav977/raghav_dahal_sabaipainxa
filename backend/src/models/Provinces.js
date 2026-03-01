
const {DataTypes} = require('sequelize');

const sequelize = require('../config/db');


const Province = sequelize.define('province',{
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name_en: { type: DataTypes.STRING, allowNull:false },
  name_np: { type: DataTypes.STRING, allowNull:false },
  province_code: { type: DataTypes.INTEGER, allowNull:false, unique:true }
}, { tableName:'provinces', timestamps:false });

module.exports = Province;


module.exports = Province;