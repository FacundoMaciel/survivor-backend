import express, { Request, Response } from 'express';
import Survivor from '../models/Survivor';
import GambleSurvivor from '../models/GambleSurvivor';
import PredictionSurvivor from '../models/PredictionSurvivor';
import { joinSurvivor } from '../helpers/joinSurvivor';
import { validateUser } from '../midlewares/validateUser';

// Extend Express Request interface to include 'user'
declare global {
  namespace Express {
    interface User {
      id: string;
    }
    interface Request {
      user?: User;
    }
  }
}

const router = express.Router();

// Get all survivors
router.get('/', async (req: Request, res: Response) => {
  try {
    const survivors = await Survivor.find();
    res.json(survivors);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching survivors' });
  }
});

// Get user status in a survivor
router.get('/status/:userId/:survivorId', async (req: Request, res: Response) => {
  const { userId, survivorId } = req.params;

  try {
    const gamble = await GambleSurvivor.findOne({ userId, survivorId });
    if (!gamble) return res.status(404).json({ error: 'User not joined in survivor' });

    res.status(200).json({
      lives: gamble.lives,
      eliminated: gamble.eliminated,
      joinedAt: gamble.joinedAt
    });

  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user picks in a survivor history
router.get('/picks/:userId/:survivorId', async (req: Request, res: Response) => {
  const { userId, survivorId } = req.params;

  try {
    const picks = await PredictionSurvivor.find({ userId, survivorId });

    const formatted = picks.map(p => ({
      matchId: p.matchId,
      teamPicked: p.prediction,
      result: p.result || 'pending'
    }));

    res.status(200).json({ picks: formatted });

  } catch (err) {
    console.error('Picks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join a survivor
router.post('/join/:id', validateUser, async (req: Request, res: Response) => {
  const survivorId = req.params.id;
  const userId = req.user!.id;
  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: 'Survivor not found' });

    await joinSurvivor(userId, survivorId);

    console.log(`[JOIN] user=${userId} survivor=${survivorId} at=${new Date().toISOString()}`);
    res.status(201).json({ message: 'Successfully joined survivor' });

  } catch (err: any) {
    if (err.message === 'User already joined') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Join error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Choose team
router.post('/pick', /* validateUser, */ async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { survivorId, matchId, teamId } = req.body;
  try {
    // Validar Survivor
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: 'Survivor not found' });

    // Validar que la fecha actual sea antes del startDate
    if (new Date() > new Date(survivor.startDate)) {
      return res.status(400).json({ error: 'Cannot pick after the match has started' });
    }

    // Buscar el match dentro del Survivor
    const match = survivor.competition.find((m: any) => m.matchId === matchId);
    if (!match) return res.status(404).json({ error: 'Match not found in survivor' });

    // Validar que el teamId sea válido
    const validTeamIds = [match.home._id.toString(), match.visitor._id.toString()];
    if (!validTeamIds.includes(teamId)) {
      return res.status(400).json({ error: 'Invalid team selection for this match' });
    }

    // Validar que el usuario esté unido
    const joined = await GambleSurvivor.exists({ userId, survivorId });
    if (!joined) return res.status(403).json({ error: 'User has not joined this survivor' });

    // Actualizar predicción
    const prediction = await PredictionSurvivor.findOneAndUpdate(
      { userId, survivorId },
      { prediction: teamId },
      { new: true }
    );

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction record not found' });
    }

    res.status(200).json({ message: 'Team picked successfully', prediction });

  } catch (err) {
    console.error('Pick error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve match and update lives
router.post('/resolve-match', async (req: Request, res: Response) => {
  const { survivorId, matchId, winnerTeamId, isDraw } = req.body;

  try {
    const predictions = await PredictionSurvivor.find({ survivorId, matchId });

    for (const pred of predictions) {
      const pickedTeam = pred.prediction;
      const failed = isDraw || pickedTeam !== winnerTeamId;

      // Guardar resultado en PredictionSurvivor
      pred.result = failed ? 'fail' : 'success';
      await pred.save();

      if (failed) {
        const gamble = await GambleSurvivor.findOne({ userId: pred.userId, survivorId });
        if (!gamble || gamble.eliminated) continue;

        gamble.lives = Math.max((gamble.lives || 3) - 1, 0);
        if (gamble.lives < 1) gamble.eliminated = true;
        await gamble.save();

        console.log(`[RESOLVE] user=${pred.userId} survivor=${survivorId} match=${matchId} result=fail lives=${gamble.lives}`);
      } else {
        console.log(`[RESOLVE] user=${pred.userId} survivor=${survivorId} match=${matchId} result=success`);
      }
    }

    res.status(200).json({ message: 'Match resolved and lives updated' });

  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;