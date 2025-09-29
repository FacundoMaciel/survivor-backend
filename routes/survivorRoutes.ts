import express, { Request, Response } from 'express';
import Survivor from '../models/Survivor';
import GambleSurvivor from '../models/GambleSurvivor';
import PredictionSurvivor from '../models/PredictionSurvivor';

// 🔹 Extendemos la interfaz de Express Request para incluir "user"
//    Esto permite usar req.user en los controladores.
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

/* ===============================
   GET /api/survivor/
   Obtiene todos los survivors disponibles
   =============================== */
router.get('/', async (req: Request, res: Response) => {
  try {
    const survivors = await Survivor.find();
    res.json(survivors);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching survivors' });
  }
});

/* ===============================
   GET /api/survivor/status/:userId/:survivorId
   Devuelve el estado de un usuario dentro de un survivor
   - vidas restantes
   - eliminado o no
   - posición en el ranking
   - total de participantes y activos
   =============================== */
router.get('/status/:userId/:survivorId', async (req: Request, res: Response) => {
  const { userId, survivorId } = req.params;

  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) {
      return res.status(404).json({ error: 'Survivor not found' });
    }

    // Buscar todos los jugadores del survivor
    const gambles = await GambleSurvivor.find({ survivorId }).sort({ lives: -1 });

    // Buscar gamble del usuario
    const userGamble = gambles.find(g => g.userId.toString() === userId);

    // Contar activos
    const activeCount = gambles.filter(g => !g.eliminated && g.lives > 0).length;

    // Posición del usuario
    let position: number | null = null;
    if (userGamble) {
      const sorted = [...gambles].sort((a, b) => b.lives - a.lives);
      position = sorted.findIndex(g => g.userId.toString() === userId) + 1;
    }

    res.json({
      joined: !!userGamble,
      lives: userGamble ? userGamble.lives : survivor.lives,
      eliminated: userGamble ? userGamble.eliminated : false,
      position,
      total: gambles.length,
      active: activeCount,
      simulationDone: survivor.finished ?? false,
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



/* ===============================
   GET /api/survivor/ranking/:survivorId
   Devuelve el ranking de todos los jugadores en un survivor
   - score = cantidad de aciertos (predicciones con result=success)
   - ordenado por score y luego por vidas
   =============================== */
router.get("/ranking/:survivorId", async (req, res) => {
  const { survivorId } = req.params;

  try {
    const predictions = await PredictionSurvivor.find({ survivorId });
    const gambles = await GambleSurvivor.find({ survivorId });

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

    ranking.sort((a, b) => b.score - a.score || b.lives - a.lives);

    res.json({ ranking });
  } catch (err) {
    console.error("Ranking error:", err);
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
});

/* ===============================
   GET /api/survivor/picks/:userId/:survivorId
   Devuelve el historial de predicciones de un usuario
   =============================== */
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

router.get('/simulation/:survivorId', async (req: Request, res: Response) => {
  const { survivorId } = req.params;
  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: 'Survivor not found' });
    if (!survivor.finished) return res.status(400).json({ error: 'Simulation not completed yet' });

    return res.status(200).json({ results: survivor.survivorResults || {} });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get("/results/:userId/:survivorId", async (req: Request, res: Response) => {
  const { userId, survivorId } = req.params;
  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: "Survivor not found" });

    const prediction = await PredictionSurvivor.findOne({ userId, survivorId });
    const gamble = await GambleSurvivor.findOne({ userId, survivorId });

    if (!prediction || !gamble) {
      return res.json({ results: [], lives: 0, simulationDone: survivor.finished });
    }

    const results: any[] = [];
    survivor.competition.forEach((jornada) => {
      jornada.matches.forEach((m) => {
        const pick = prediction.predictions.find((p) => p.matchId === m.matchId);
        const matchResult = survivor.survivorResults[m.matchId];

        results.push({
          matchId: m.matchId,
          home: m.home,
          visitor: m.visitor,
          userTeam: pick ? pick.teamId : null,
          winner: matchResult ? matchResult.winner : null,
          result: pick ? pick.result : null,
        });
      });
    });

    res.json({
      results,
      lives: gamble.lives,
      simulationDone: survivor.finished,
    });
  } catch (err) {
    console.error("Results error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


/* ===============================
   POST /api/survivor/join/:id
   Un usuario se une a un survivor
   - crea GambleSurvivor con sus vidas
   - crea PredictionSurvivor vacío
   =============================== */
router.post("/join/:id", async (req: Request, res: Response) => {
  const survivorId = req.params.id;
  const { userId } = req.body;

  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: "Survivor not found" });

    const alreadyJoined = await GambleSurvivor.exists({ userId, survivorId });
    if (alreadyJoined) {
      return res.status(400).json({ error: "User already joined" });
    }

    await GambleSurvivor.create({
      userId,
      survivorId,
      lives: survivor.lives,
      eliminated: false,
      joinedAt: new Date(),
    });

    await PredictionSurvivor.create({
      userId,
      survivorId,
      predictions: [],
    });

    console.log(`[JOIN] user=${userId} survivor=${survivorId}`);
    res.status(201).json({ message: "Successfully joined survivor" });
  } catch (err) {
    console.error("Join error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ===============================
   POST /api/survivor/predict/:id
   Guardar predicciones de un usuario
   - agrega o actualiza teamId en cada matchId
   =============================== */
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
    console.log(`[PREDICT] user=${userId} survivor=${survivorId}`);
    res.status(200).json({ message: 'Predictions saved' });
  } catch (err) {
    console.error('Predict error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===============================
   POST /api/survivor/pick
   Seleccionar un equipo para un partido
   - valida survivor, match y team
   - guarda en PredictionSurvivor
   =============================== */
router.post('/pick', async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { survivorId, matchId, teamId } = req.body;

  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: 'Survivor not found' });

    // No permitir picks después de la fecha de inicio
    if (new Date() > new Date(survivor.startDate)) {
      return res.status(400).json({ error: 'Cannot pick after the match has started' });
    }

    const round = survivor.competition.find((r: any) =>
      r.matches.some((m: any) => m.matchId === matchId)
    );
    if (!round) return res.status(404).json({ error: 'Match not found in survivor' });

    const match = round.matches.find((m: any) => m.matchId === matchId);
    if (!match) return res.status(404).json({ error: 'Match not found in survivor' });

    // Validar que el equipo elegido pertenece al partido
    const validTeamIds = [match.home._id.toString(), match.visitor._id.toString()];
    if (!validTeamIds.includes(teamId)) {
      return res.status(400).json({ error: 'Invalid team selection for this match' });
    }

    const joined = await GambleSurvivor.exists({ userId, survivorId });
    if (!joined) return res.status(403).json({ error: 'User has not joined this survivor' });

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

/* ===============================
   POST /api/survivor/simulate/:id
   Simula resultados de los partidos
   - genera resultados aleatorios (success/fail/draw)
   - asigna ganador y guarda en PredictionSurvivor
   - actualiza vidas en GambleSurvivor
   - devuelve resultados de cada partido
   =============================== */
router.post("/simulate/:id", async (req: Request, res: Response) => {
  const survivorId = req.params.id;

  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: "Survivor not found" });

    if (survivor.finished) {
      return res.status(400).json({ error: "Survivor already simulated" });
    }

    // 🔹 Bloqueo si no hay predicciones
    const predictionsCount = await PredictionSurvivor.countDocuments({ survivorId });
    if (predictionsCount === 0) {
      return res.status(400).json({ error: "No hay predicciones para simular" });
    }

    // 🔹 resultados random por cada partido
    const results: Record<string, any> = {};

    survivor.competition.forEach((jornada) => {
      jornada.matches.forEach((m) => {
        const random = Math.random();

        if (random < 0.4) {
          results[m.matchId] = { winner: m.home };
        } else if (random < 0.8) {
          results[m.matchId] = { winner: m.visitor };
        } else {
          results[m.matchId] = { winner: null }; // empate
        }
      });
    });

    survivor.survivorResults = results;
    survivor.finished = true;
    await survivor.save();

    // 🔹 actualizar vidas de cada usuario en GambleSurvivor
    const predictions = await PredictionSurvivor.find({ survivorId });

    for (const pred of predictions) {
      const gamble = await GambleSurvivor.findOne({ userId: pred.userId, survivorId });
      if (!gamble) continue;

      let lives = gamble.lives;

      pred.predictions.forEach((p) => {
        const matchResult = results[p.matchId];

        if (!matchResult || !matchResult.winner) {
          // empate o sin resultado => resta vida
          lives -= 1;
          p.result = "fail";
        } else if (p.teamId === matchResult.winner._id.toString()) {
          // acertó
          p.result = "success";
        } else {
          // perdió
          lives -= 1;
          p.result = "fail";
        }
      });

      gamble.lives = lives;
      if (lives <= 0) gamble.eliminated = true;

      await gamble.save();
      await pred.save();
    }

    res.json({ message: "Simulation complete", results });
  } catch (err) {
    console.error("Simulate error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ===============================
   POST /api/survivor/resolve-match
   Resolver un partido manualmente (cuando termina en la vida real)
   - actualiza resultados en predicciones
   - descuenta vidas de los que fallaron
   =============================== */
router.post('/resolve-match', async (req: Request, res: Response) => {
  const { survivorId, matchId, winnerTeamId, isDraw } = req.body;

  try {
    const predictions = await PredictionSurvivor.find({ survivorId });

    for (const record of predictions) {
      const prediction = record.predictions.find(p => p.matchId === matchId);
      if (!prediction) continue;

      const pickedTeam = prediction.teamId;
      const failed = isDraw || pickedTeam !== winnerTeamId;

      prediction.result = failed ? 'fail' : 'success';
      await record.save();

      if (failed) {
        const gamble = await GambleSurvivor.findOne({ userId: record.userId, survivorId });
        if (!gamble || gamble.eliminated) continue;

        gamble.lives = Math.max((gamble.lives || 3) - 1, 0);
        if (gamble.lives < 1) gamble.eliminated = true;
        await gamble.save();

        console.log(`[RESOLVE] user=${record.userId} survivor=${survivorId} match=${matchId} result=fail`);
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
