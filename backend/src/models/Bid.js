const sequelize = require("../config/db");


const {DataTypes} = require("sequelize");

const Bid = sequelize.define("Bids",{
    bidAmount:{
        type:DataTypes.FLOAT,
        allowNull:false
    },
    status:{
        type:DataTypes.ENUM("pending","accepted","rejected"),
        defaultValue:"pending"

    }
},
{
    tableName:"bids",
    timestamps:true,
    paranoid:true
})

module.exports=Bid;