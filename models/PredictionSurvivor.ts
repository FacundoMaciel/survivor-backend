// models/PredictionSurvivor.ts
import mongoose, { Document, Schema } from 'mongoose';

interface IPrediction {
  matchId: string;
  teamId: string;
  result?: 'success' | 'fail' | 'pending' | null;
}

export interface IPredictionSurvivor extends Document {
  userId: string;
  survivorId: mongoose.Types.ObjectId | string;
  predictions: IPrediction[];
  createdAt: Date;
}

const PredictionSchema = new Schema<IPrediction>({
  matchId: { type: String, required: true },
  teamId: { type: String, required: true },
  result: {
    type: String,
    enum: ['success', 'fail', 'pending'],
    default: 'pending',
  },
});

const PredictionSurvivorSchema = new Schema<IPredictionSurvivor>({
  userId: { type: String, required: true },
  survivorId: { type: Schema.Types.ObjectId, ref: 'Survivor', required: true },
  predictions: { type: [PredictionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPredictionSurvivor>(
  'PredictionSurvivor',
  PredictionSurvivorSchema
);
