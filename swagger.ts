import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Survivor API",
      version: "1.0.0",
      description: "API para gestionar el juego Survivor",
    },
    servers: [
      {
        url: "http://localhost:4300/api/survivor", // 🔹 ajusta si deployas
      },
    ],
  },
  apis: ["./routes/*.ts"], // rutas documentadas
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
