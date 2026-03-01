

const sequelize = require("../config/db")

const {DataTypes} = require("sequelize")


const PaymentActual = sequelize.define("PaymentActual",{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true

    },
    status:{
        type:DataTypes.ENUM("pending","completed","failed"),
        defaultValue:"pending"
    }
},
{
    tableName:"payments",
    timestamps:true
})



module.exports = PaymentActual;