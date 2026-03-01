const sequelize = require('../config/db');

const {DataTypes} = require('sequelize');

const District = require('./Districts');
const User = require('./User');

const Municipal = sequelize.define('municipal', {
  id: { type: DataTypes.INTEGER, primaryKey:true, autoIncrement:true },
  municipal_code: { type: DataTypes.INTEGER, allowNull:false, unique:true },
  name_en: { type: DataTypes.STRING, allowNull:false },
  name_np: { type: DataTypes.STRING, allowNull:false },
  district_code: { 
    type: DataTypes.INTEGER, 
    allowNull:false,
    references: { model: 'districts', key:'district_code' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  }
}, { tableName:'municipals', timestamps:false });



module.exports = Municipal;
