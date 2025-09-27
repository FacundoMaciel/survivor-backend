import mongoose, { Document } from 'mongoose';
interface ITeam {
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
declare const _default: mongoose.Model<ISurvivor, {}, {}, {}, mongoose.Document<unknown, {}, ISurvivor> & ISurvivor & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Survivor.d.ts.map