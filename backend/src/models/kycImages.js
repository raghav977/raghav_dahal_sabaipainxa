const sequelize = require("../config/db");

const {DataTypes} = require("sequelize");

const KycImages = sequelize.define("KycImages",{
    image_path:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    image_type:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    kycId:{
        type: DataTypes.INTEGER,
        allowNull:true,
    }
},{
    tableName:"kyc_images",
    timestamps:true,
    paranoid:true
});

module.exports = KycImages;
