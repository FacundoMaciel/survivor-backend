import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<ISurvivor, {}, {}, {}, mongoose.Document<unknown, {}, ISurvivor> & ISurvivor & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Survivor.d.ts.map