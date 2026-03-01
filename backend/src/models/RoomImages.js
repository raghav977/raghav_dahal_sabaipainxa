const sequelize = require("../config/db")

const {DataTypes} = require("sequelize");

const RoomImages = sequelize.define("RoomImages",{
    image_path:{
        type: DataTypes.STRING,
        allowNull: false,
    }
},{
    tableName:"room_images",
    timestamps:true,
    paranoid:true
});

module.exports = RoomImages;