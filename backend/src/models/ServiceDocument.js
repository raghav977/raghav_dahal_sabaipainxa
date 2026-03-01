const sequelize = require("../config/db")

const {DataTypes} = require("sequelize");

const ServiceDocument = sequelize.define("ServiceDocument",{
    document_path:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    document_type:{
        type:DataTypes.STRING,
        allowNull:false,
    }
},{
    tableName:"service_documents",
    timestamps:true,
    paranoid:true
});


module.exports = ServiceDocument;
