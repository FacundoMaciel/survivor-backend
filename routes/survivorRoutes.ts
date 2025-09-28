import express, { Request, Response } from 'express';
import Survivor from '../models/Survivor';
import GambleSurvivor from '../models/GambleSurvivor';
import PredictionSurvivor from '../models/PredictionSurvivor';


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

// /api/survivor/ranking
router.get("/ranking/:survivorId", async (req, res) => {
  const { survivorId } = req.params;

  try {
    const predictions = await PredictionSurvivor.find({ survivorId });
    const gambles = await GambleSurvivor.find({ survivorId });

    // Mapear ranking
    const ranking = predictions.map((p) => {
      const score = p.predictions.filter((pr) => pr.result === "success").length;
      const gamble = gambles.find((g) => g.userId === p.userId);

      return {
        userId: p.userId,
        score,
        lives: gamble ? gamble.lives : 0,
        eliminated: gamble ? gamble.eliminated : false,
      };
    });

    // Ordenar por score (desc), y luego por vidas
    ranking.sort((a, b) => b.score - a.score || b.lives - a.lives);

    res.json({ ranking });
  } catch (err) {
    console.error("Ranking error:", err);
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});



// Get user picks in a survivor history
router.get('/picks/:userId/:survivorId', async (req: Request, res: Response) => {
  const { userId, survivorId } = req.params;

  try {
    const record = await PredictionSurvivor.findOne({ userId, survivorId });

    if (!record) {
      return res.status(404).json({ error: 'No predictions found' });
    }

    const formatted = record.predictions.map(p => ({
      matchId: p.matchId,
      teamPicked: p.teamId,
      result: p.result || 'pending'
    }));

    res.status(200).json({ picks: formatted });
  } catch (err) {
    console.error('Picks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join a survivor
router.post('/join/:id', async (req: Request, res: Response) => {
  const survivorId = req.params.id;
  const { userId } = req.body;

  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: 'Survivor not found' });

    // Verificar si ya está unido
    const alreadyJoined = await GambleSurvivor.exists({ userId, survivorId });
    if (alreadyJoined) {
      return res.status(400).json({ error: 'User already joined' });
    }

    // Crear el estado de juego con 3 vidas
    await GambleSurvivor.create({
      userId,
      survivorId,
      lives: survivor.competition.length, // arranca acá con las vidas
      eliminated: false,
      joinedAt: new Date(),
    });

    // Crear la "bandeja" de predicciones vacía
    await PredictionSurvivor.create({
      userId,
      survivorId,
      predictions: [],
    });

    console.log(`[JOIN] user=${userId} survivor=${survivorId} at=${new Date().toISOString()}`);
    res.status(201).json({ message: 'Successfully joined survivor' });
  } catch (err) {
    console.error('Join error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * POST /predict/:id
 * Guardar predicciones → agrega { matchId, teamId } al predictions_survivor
 */
router.post('/predict/:id', async (req: Request, res: Response) => {
  const survivorId = req.params.id;
  const { userId, predictions } = req.body;

  try {
    const predictionDoc = await PredictionSurvivor.findOne({ userId, survivorId });
    if (!predictionDoc) {
      return res.status(404).json({ error: 'PredictionSurvivor not found. Join first.' });
    }

    predictions.forEach((pred: any) => {
      const existing = predictionDoc.predictions.find((p: any) => p.matchId === pred.matchId);
      if (existing) {
        existing.teamId = pred.teamId;
      } else {
        predictionDoc.predictions.push({
          matchId: pred.matchId,
          teamId: pred.teamId,
          result: 'pending',
        });
      }
    });

    await predictionDoc.save();

    console.log(`[PREDICT] user=${userId} survivor=${survivorId} predictions=${predictions.length}`);
    res.status(200).json({ message: 'Predictions saved' });
  } catch (err) {
    console.error('Predict error:', err);
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

// Games simulator endpoint
// survivorRoutes.ts

router.post('/simulate/:survivorId', async (req: Request, res: Response) => {
  const { survivorId } = req.params;

  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) {
      return res.status(404).json({ error: 'Survivor not found' });
    }

    const predictions = await PredictionSurvivor.find({ survivorId });
    if (!predictions.length) {
      return res.status(404).json({ error: 'No predictions found for this survivor' });
    }

    const outcomes = ['success', 'fail', 'draw'] as const;
    const resultsByMatch: Record<string, any> = {};

    // obtener todos los matchIds únicos
    const allMatchIds = new Set(
      predictions.flatMap(record => record.predictions.map(p => p.matchId))
    );

    for (const matchId of allMatchIds) {
      const randomResult = outcomes[Math.floor(Math.random() * outcomes.length)];

      // buscar los datos del match en survivor.competition
      const matchData = survivor.competition.find(m => m.matchId === matchId);

      if (!matchData) continue;

      // por simplicidad: elegimos ganador al azar entre home y visitor
      const winner =
        randomResult === 'draw'
          ? null
          : Math.random() < 0.5
            ? matchData.home
            : matchData.visitor;

      resultsByMatch[matchId] = {
        result: randomResult,
        winner: winner ? { name: winner.name, flag: winner.flag } : null,
      };

      // actualizar predicciones de cada usuario
      for (const record of predictions) {
        const prediction = record.predictions.find(p => p.matchId === matchId);
        if (!prediction) continue;

        let failed = false;
        if (randomResult === 'draw') {
          failed = true;
        } else if (randomResult === 'fail') {
          // "fail" = apostó por el otro equipo
          failed = winner ? prediction.teamId !== winner._id.toString() : true;
        } else if (randomResult === 'success') {
          failed = false;
        }

        prediction.result = failed ? 'fail' : 'success';
        await record.save();

        // actualizar gamble_survivor
        if (failed) {
          const gamble = await GambleSurvivor.findOne({
            userId: record.userId,
            survivorId,
          });

          if (gamble && !gamble.eliminated) {
            gamble.lives = Math.max((gamble.lives || survivor.lives) - 1, 0);
            if (gamble.lives < 1) gamble.eliminated = true;
            await gamble.save();
          }
        }
      }
    }

    res.status(200).json({
      message: 'Simulation completed',
      results: resultsByMatch,
    });
  } catch (err) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Resolve match and update lives
router.post('/resolve-match', async (req: Request, res: Response) => {
  const { survivorId, matchId, winnerTeamId, isDraw } = req.body;

  try {
    const predictions = await PredictionSurvivor.find({ survivorId });

    for (const record of predictions) {
      // Buscar predicción dentro del array
      const prediction = record.predictions.find(p => p.matchId === matchId);
      if (!prediction) continue;

      const pickedTeam = prediction.teamId;
      const failed = isDraw || pickedTeam !== winnerTeamId;

      // Guardar resultado en PredictionSurvivor
      prediction.result = failed ? 'fail' : 'success';
      await record.save();

      if (failed) {
        const gamble = await GambleSurvivor.findOne({ userId: record.userId, survivorId });
        if (!gamble || gamble.eliminated) continue;

        gamble.lives = Math.max((gamble.lives || 3) - 1, 0);
        if (gamble.lives < 1) gamble.eliminated = true;
        await gamble.save();

        console.log(`[RESOLVE] user=${record.userId} survivor=${survivorId} match=${matchId} result=fail lives=${gamble.lives}`);
      } else {
        console.log(`[RESOLVE] user=${record.userId} survivor=${survivorId} match=${matchId} result=success`);
      }
    }

    res.status(200).json({ message: 'Match resolved and lives updated' });
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;