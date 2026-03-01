
const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const paymentRecords = sequelize.define("PaymentRecords", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('initiated', 'completed', 'failed', 'released'),
        allowNull: false,
        defaultValue: 'initiated',
    },
    released_at: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: "paymentrecords",
    timestamps: true,


});

module.exports = paymentRecords;