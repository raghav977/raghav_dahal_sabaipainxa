
const sequelize = require("../config/db");

const {DataTypes} = require("sequelize");

const ServiceImages = sequelize.define("ServiceImages",{
    image_path:{
        type: DataTypes.STRING,
        allowNull: true,
    }
},{
    tableName:"service_images",
    timestamps:true,
    paranoid:true
});

module.exports = ServiceImages;
