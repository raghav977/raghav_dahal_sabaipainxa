const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// const ServiceProviderServiceLocation = sequelize.define(
//   'serviceProviderServiceLocation',
//   {
//     id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//     serviceProviderServiceId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: { model: 'serviceProviderServices', key: 'id' },
//       onUpdate: 'CASCADE',
//       onDelete: 'CASCADE',
//     },
//     locationId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: { model: 'serviceLocations', key: 'id' },
//       onUpdate: 'CASCADE',
//       onDelete: 'CASCADE',
//     },
//   },
//   {
//     tableName: 'providerlocations',
//     timestamps: false,
//     indexes: [
//       {
//         unique: true,
//         fields: ['serviceProviderServiceId', 'locationId'],
//         name: 'spServiceLoc_unique', 
//       },
//     ],
//   }
// );

// module.exports = ServiceProviderServiceLocation;
// 