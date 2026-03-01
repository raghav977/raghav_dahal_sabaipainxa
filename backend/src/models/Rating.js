const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Rating = sequelize.define("Rating", {
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max:5
    },
  },
  ratingType: {
    type: DataTypes.ENUM("excellent", "good", "average", "poor"),
    allowNull: false,
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
},{
    tableName:"ratings",
    timestamps:true,
    paranoid:true
});

module.exports = Rating;
