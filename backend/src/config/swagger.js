// src/config/swagger.js
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API Documentation",
      version: "1.0.0",
      description: "API documentation for the backend server",
    },
    servers: [
      {
        url: "http://localhost:5000", // change if needed
      },
    ],
  },

  apis: ["./src/routes/**/*.js"], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
