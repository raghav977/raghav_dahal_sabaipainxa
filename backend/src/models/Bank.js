

const sequelize = require('../config/db')

const {DataTypes}= require("sequelize")


const Bank = sequelize.define("Bank",{
    id:{
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
    },
    bank_name:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    account_number:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    account_holder_name:{
        type:DataTypes.STRING,
        allowNull:false
    },
    // ifsc_code:{
    //     type:DataTypes.STRING,
    //     allowNull:false,
    //     unique:true
    // },
    // branch_name:{
    //     type:DataTypes.STRING,
    //     allowNull:false
    // },
    status:{
        type:DataTypes.ENUM("verified","not verified","blocked"),
        defaultValue:"verified"
    },

    
},
{
    tableName:"banks",
    timestamps:true,
    paranoid:true
})
module.exports = Bank