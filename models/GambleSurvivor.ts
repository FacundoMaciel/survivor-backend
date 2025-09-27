// models/GambleSurvivor.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IGambleSurvivor extends Document {
  userId: string;
  survivorId: string;
  joinedAt: Date;
  lives: number;
  eliminated: boolean;
}

const GambleSurvivorSchema = new Schema({
  userId: { type: String, required: true },
  survivorId: { type: Schema.Types.ObjectId, ref: 'Survivor', required: true },
  joinedAt: { type: Date, default: Date.now },
  lives: { type: Number, default: 3 },
  eliminated: { type: Boolean, default: false }
});

export default mongoose.model<IGambleSurvivor>('GambleSurvivor', GambleSurvivorSchema);