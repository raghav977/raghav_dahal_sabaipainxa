

const sequelize = require("../config/db");

const {DataTypes} = require("sequelize");

const Room = sequelize.define("Room",{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    name:{
        type:DataTypes.STRING,
        allowNull:false
    },
    lat:{
        type:DataTypes.FLOAT,
        allowNull:false
    },
    lng:{
        type:DataTypes.FLOAT,
        allowNull:false
    },
     contact:{
        type:DataTypes.STRING,
        allowNull:true
    },
    price:{
        type:DataTypes.FLOAT,
        allowNull:false
    },
    description:{
        type:DataTypes.TEXT,
        allowNull:true
    },
    availability_status:{
        type:DataTypes.BOOLEAN,
        defaultValue:true
    },
    note:{
        type:DataTypes.TEXT,
        allowNull:true
    },
    status:{
        type:DataTypes.ENUM("pending","approved","rejected"),  
        defaultValue:"pending"
    },
    rejection_reason:{
        type:DataTypes.TEXT,
        allowNull:true
    },
    is_active:{
        type:DataTypes.BOOLEAN,
        defaultValue:true
    }
},{
    tableName:"rooms",
    timestamps:true,
    indexes:[
        {
            unique:true,
            fields:["name"]
        }
    ]
});     
    
module.exports = Room;