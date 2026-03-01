const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");


const Booking = sequelize.define("Bookings",{
    status:{
        type:DataTypes.ENUM("pending","confirmed","cancelled","completed"),
        defaultValue:"pending"
    },
    contact_number:{
        type:DataTypes.STRING,
        length:10,
        allowNull:false,
    },
    clientCompleted: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
providerCompleted: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
lat:{
      type: DataTypes.FLOAT,
      allowNull: false

},

    lng:{
      type: DataTypes.FLOAT,
      allowNull: false
    }
},{
    tableName:"bookings",
    timestamps:true,
    paranoid:true
})


module.exports = Booking;