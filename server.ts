import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import survivorRoutes from "./routes/survivorRoutes";
import seedSurvivors from "./seeds/seedData";
import { setupSwagger } from "./swagger";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/survivor";

// Conexión Mongo LEvantar backend:docker compose up
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log(`✅ Connected to MongoDB at ${mongoUri}`);
    // Ejecutar seeding después de conectar a la base de datos
    seedSurvivors();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
  });

// Rutas
app.use("/api/survivor", survivorRoutes);

// 🔹 Swagger docs
setupSwagger(app);

const PORT = process.env.PORT || 4300;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

export default app