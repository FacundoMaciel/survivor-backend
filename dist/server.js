"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const survivorRoutes_1 = __importDefault(require("./routes/survivorRoutes"));
const seedData_1 = __importDefault(require("./seeds/seedData"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/survivor';
// Conexión Mongo
mongoose_1.default.connect(mongoUri)
    .then(() => {
    console.log(`✅ Connected to MongoDB at ${mongoUri}`);
    // Ejecutar seeding después de conectar a la base de datos
    (0, seedData_1.default)();
})
    .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
});
// Rutas
app.use('/api/survivor', survivorRoutes_1.default);
const PORT = process.env.PORT || 4300;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//# sourceMappingURL=server.js.map