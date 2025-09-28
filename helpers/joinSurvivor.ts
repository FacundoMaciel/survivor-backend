import GambleSurvivor from '../models/GambleSurvivor';
import PredictionSurvivor from '../models/PredictionSurvivor';

export async function joinSurvivor(
    userId: string,
    survivorId: string,
    matchId: string,
    prediction: string
) {
    const alreadyJoined = await GambleSurvivor.exists({ userId, survivorId });
    if (alreadyJoined) throw new Error('User already joined');

    // crear la entrada en survivor
    await GambleSurvivor.create({
        userId,
        survivorId,
        lives: 3,
        eliminated: false,
        joinedAt: new Date(),
    });

    // crear la predicción inicial
    await PredictionSurvivor.create({
        userId,
        survivorId,
        matchId,
        prediction, // acá guardamos el teamId
    });

    return { joined: true };
}
