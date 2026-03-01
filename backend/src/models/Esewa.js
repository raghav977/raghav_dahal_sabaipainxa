

const sequelize = require("../config/db")

const {DataTypes}= require("sequelize")


const Esewa = sequelize.define("Esewa",{
    id:{
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
    },
    esewa_id:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    status:{
        type:DataTypes.ENUM("verified","not verified","blocked"),
        defaultValue:"verified"
    },

},{
    tableName:"esewas",
    timestamps:true,
    paranoid:true
})

module.exports = Esewa