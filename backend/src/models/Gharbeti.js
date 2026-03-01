
const {DataTypes} = require("sequelize");
const sequelize = require("../config/db");

const Gharbeti = sequelize.define("Gharbeti",{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    is_verified:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_blocked:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },  
    is_paid:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_active:{
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
},{
    tableName: "gharbetis",
    timestamps: true,
    paranoid: true
});
module.exports = Gharbeti;
