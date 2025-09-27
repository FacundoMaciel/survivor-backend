// models/PredictionSurvivor.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IPredictionSurvivor extends Document {
  userId: string;
  survivorId: string;
  prediction?: string | null;
  matchId: { type: String, required: true };
  createdAt: Date;
  result?: 'success' | 'fail' | null;
}

const PredictionSurvivorSchema = new Schema({
  userId: { type: String, required: true },
  survivorId: { type: Schema.Types.ObjectId, ref: 'Survivor', required: true },
  prediction: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  matchId: { type: String, required: true },
  result: { type: String, enum: ['success', 'fail'], default: null }
});

export default mongoose.model<IPredictionSurvivor>('PredictionSurvivor', PredictionSurvivorSchema);