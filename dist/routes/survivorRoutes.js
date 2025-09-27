"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Survivor_1 = __importDefault(require("../models/Survivor"));
const router = express_1.default.Router();
// Get all survivors
router.get('/', async (req, res) => {
    try {
        const survivors = await Survivor_1.default.find();
        res.json(survivors);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching survivors' });
    }
});
// Join survivor
router.post('/join/:id', async (req, res) => {
    //  YOUR CODE HERE
});
// Choose team
router.post('/pick', async (req, res) => {
    //  YOUR CODE HERE
});
exports.default = router;
//# sourceMappingURL=survivorRoutes.js.map