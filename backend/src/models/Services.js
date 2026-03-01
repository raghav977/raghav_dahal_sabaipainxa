
const sequelize = require("../config/db");
const {DataTypes} = require("sequelize");

const Service = sequelize.define("Service",{
    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    package_enabled:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status:{
        type:DataTypes.ENUM("public","admin","hidden"),
        defaultValue:"admin"
    }
},{
    tableName:"services",
    timestamps:true,
    paranoid:true
});



module.exports = Service;
