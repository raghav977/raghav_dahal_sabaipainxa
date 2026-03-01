const sequelize = require("../config/db");

const {DataTypes} = require("sequelize");

const ServiceProvider = sequelize.define("ServiceProvider", {
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_blocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },


},{
    tableName:"service_providers",
    timestamps:true,
    paranoid:true
})

module.exports = ServiceProvider;
