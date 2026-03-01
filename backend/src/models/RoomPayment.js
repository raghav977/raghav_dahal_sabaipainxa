

const {DataTypes} = require("sequelize");
const sequelize = require("../config/db");

const RoomPayment = sequelize.define("RoomPayment",{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    amount:{
        type:DataTypes.FLOAT,
        allowNull:false
    },
    paymentDate:{
        type:DataTypes.DATE,
        allowNull:true
    },
    status:{
        type:DataTypes.ENUM("pending","completed","failed"),
        defaultValue:"pending",
        allowNull:false
    },
},{
    timestamps:true,
    tableName:"room_payments",
    paranoid:true
});

module.exports = RoomPayment;