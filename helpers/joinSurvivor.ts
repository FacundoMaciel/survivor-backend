import GambleSurvivor from '../models/GambleSurvivor';
import PredictionSurvivor from '../models/PredictionSurvivor';

export async function joinSurvivor(userId: string, survivorId: string) {
    const alreadyJoined = await GambleSurvivor.exists({ userId, survivorId });
    if (alreadyJoined) throw new Error('User already joined');

    await GambleSurvivor.create({ userId, survivorId });
    await PredictionSurvivor.create({ userId, survivorId });

    return { joined: true };
}