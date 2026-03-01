


const sequelize = require("../config/db")

const {DataTypes} = require("sequelize");



const Notification = sequelize.define('notification',{
    id:{
        type:DataTypes.INTEGER, primaryKey:true, autoIncrement:true
    },
    userId:{
        type:DataTypes.INTEGER, allowNull:false,
        references:{ model:'users', key:'id' },
        onUpdate:'CASCADE',
        onDelete:'CASCADE'
    },
    title:{ type:DataTypes.STRING, allowNull:false },
    message:{ type:DataTypes.TEXT, allowNull:false },
    isRead:{ type:DataTypes.BOOLEAN, defaultValue:false }
},{ tableName:'notifications', timestamps:true });

module.exports = Notification;