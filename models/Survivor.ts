import mongoose, { Document, Schema } from 'mongoose';

interface ITeam {
  _id: mongoose.Types.ObjectId;
  name: string;
  flag: string;
}

interface IMatch {
  matchId: string;
  home: ITeam;
  visitor: ITeam;
}

interface IJornada {
  jornada: number;
  matches: IMatch[];
}

interface ISurvivor extends Document {
  name: string;
  competition: IJornada[];
  startDate: Date;
  lives: number;
  finished?: boolean;
  survivorResults?: any;
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

const JornadaSchema = new Schema({
  jornada: { type: Number, required: true },
  matches: { type: [MatchSchema], required: true }
});

const SurvivorSchema: Schema = new mongoose.Schema({
  name: { type: String, required: true },
  competition: [JornadaSchema],
  startDate: { type: Date, required: true },
  lives: { type: Number, default: 3 },
  finished: { type: Boolean, default: false },
  survivorResults: { type: Schema.Types.Mixed, default: null }
});

export default mongoose.model<ISurvivor>('Survivor', SurvivorSchema);
