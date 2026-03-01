


const sequelize = require("../config/db")

const {DataTypes}= require("sequelize")


const Khalti = sequelize.define("Khalti",{
    id:{
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
    },
    khalti_id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        unique:true
    },
    status:{
        type:DataTypes.ENUM("verified","not verified","blocked"),
        defaultValue:"verified"
    },
    
},{
    tableName:"khaltis",
    timestamps:true,
    paranoid:true
})

module.exports = Khalti