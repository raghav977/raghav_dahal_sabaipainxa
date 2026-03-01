const sequelize = require("../config/db")
const { DataTypes } = require("sequelize");

const Otp = sequelize.define('Otp', {
  Otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true }
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  is_verified:{
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  created_at:{
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true,
  }
}, {
  tableName: 'otps',
  timestamps: true,
});

module.exports = Otp;