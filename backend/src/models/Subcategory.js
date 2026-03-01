const sequelize = require("../config/db");

const {DataTypes} = require("sequelize");

const Subcategory = sequelize.define("Subcategory", {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
},{
    tableName:"subcategories",
    timestamps:true,
    paranoid:true
});

module.exports = Subcategory;
