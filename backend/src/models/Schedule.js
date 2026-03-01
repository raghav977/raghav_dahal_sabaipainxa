

const sequelize = require("../config/db");
const {DataTypes} = require("sequelize");

const ServiceSchedules = sequelize.define("ServiceSchedules", {
  day_of_week: DataTypes.STRING, 
  start_time: DataTypes.TIME,
  end_time: DataTypes.TIME,
},{
    tableName:"service_schedules",
    timestamps:true,
    paranoid:true
});


module.exports = ServiceSchedules;