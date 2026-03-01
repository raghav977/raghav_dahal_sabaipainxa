const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); 

const PaymentAccount = sequelize.define('PaymentAccount', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: { 
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: { 
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'payment_accounts',
  timestamps: true
});

module.exports = PaymentAccount;
