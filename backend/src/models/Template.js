

const { DataTypes, ENUM } = require("sequelize")
const sequelize = require("../config/db")


const Template = sequelize.define("Template",{
    slug:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true,
    },
    category:{
        type:ENUM('nibedan','cv','patra'),
        allowNull:false,
    },
    language:{
        type:ENUM('nepali','english'),
        allowNull:false,
    },
    title:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    description:{
        type:DataTypes.STRING,
        allowNull:true,

    },
    
        content:{
            type:DataTypes.TEXT('long'),
            allowNull:false,
        },
        isActive:{
            type:DataTypes.BOOLEAN,
            defaultValue:true,
        },
    
       
},{
    tableName:"templates",
    timestamps:true,
    paranoid:true
})

module.exports =Template;