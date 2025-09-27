import mongoose, { Document, Schema } from 'mongoose';

interface ITeam {
  _id: any;
  name: string;
  flag: string;
}

interface IMatch {
  matchId: string;
  home: ITeam;
  visitor: ITeam;
}

interface ISurvivor extends Document {
  name: string;
  competition: IMatch[];
  startDate: Date;
  lives: number;
}

const TeamSchema = new Schema({
  name: { type: String, required: true },
  flag: { type: String, required: true }
});

const MatchSchema = new Schema({
  matchId: { type: String, required: true },
  home: { type: TeamSchema, required: true },
  visitor: { type: TeamSchema, required: true }
});

const SurvivorSchema: Schema = new mongoose.Schema({
  name: { type: String, required: true },
  competition: [MatchSchema],
  startDate: { type: Date, required: true },
  lives: { type: Number, default: 3 }
});

export default mongoose.model<ISurvivor>('Survivor', SurvivorSchema);