const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("business_accounts", "province", {
      type: DataTypes.INTEGER,
      allowNull: true,
      after: "website",
    });
    await queryInterface.addColumn("business_accounts", "district", {
      type: DataTypes.INTEGER,
      allowNull: true,
      after: "province",
    });
    await queryInterface.addColumn("business_accounts", "municipal", {
      type: DataTypes.INTEGER,
      allowNull: true,
      after: "district",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("business_accounts", "province");
    await queryInterface.removeColumn("business_accounts", "district");
    await queryInterface.removeColumn("business_accounts", "municipal");
  },
};
