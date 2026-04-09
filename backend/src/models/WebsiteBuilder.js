const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const WebsiteBuilder = sequelize.define("WebsiteBuilder", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  business_account_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "business_accounts",
      key: "id",
    },
  },
  website_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  website_slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  theme: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      primaryColor: "#3B82F6",
      secondaryColor: "#10B981",
      font: "Inter, sans-serif",
      style: "modern",
    },
  },
  pages: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  seo: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      title: "",
      description: "",
      keywords: "",
    },
  },
  analytics_code: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  custom_domain: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  is_custom_domain_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      enableComments: false,
      enableNewsletter: false,
      enableContactForm: true,
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "website_builders",
  timestamps: true,
  paranoid: false,
});

module.exports = WebsiteBuilder;
