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

/**
 * @swagger
 * /:
 *   get:
 *     summary: Obtener todos los survivors
 *     tags: [Survivor]
 *     responses:
 *       200:
 *         description: Lista de survivors
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const survivors = await Survivor.find();
    res.json(survivors);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching survivors' });
  }
});

/**
 * @swagger
 * /status/{userId}/{survivorId}:
 *   get:
 *     summary: Obtener estado de un usuario en un survivor
 *     tags: [Survivor]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: survivorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado del usuario en survivor
 */
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

/**
 * @swagger
 * /ranking/{survivorId}:
 *   get:
 *     summary: Obtener ranking de un survivor
 *     tags: [Survivor]
 *     parameters:
 *       - in: path
 *         name: survivorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ranking de jugadores
 */
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

/* =============================== PODRIA SER UTIL LUEGO
   GET /api/survivor/picks/:userId/:survivorId
   Devuelve el historial de predicciones de un usuario
   =============================== */
// router.get('/picks/:userId/:survivorId', async (req: Request, res: Response) => {
//   const { userId, survivorId } = req.params;

//   try {
//     const record = await PredictionSurvivor.findOne({ userId, survivorId });

//     if (!record) {
//       return res.status(404).json({ error: 'No predictions found' });
//     }

//     const formatted = record.predictions.map(p => ({
//       matchId: p.matchId,
//       teamPicked: p.teamId,
//       result: p.result || 'pending'
//     }));

//     res.status(200).json({ picks: formatted });
//   } catch (err) {
//     console.error('Picks error:', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

/**
 * @swagger
 * /results/{survivorId}:
 *   get:
 *     summary: Obtener resultados de los partidos de un survivor
 *     tags: [Survivor]
 *     parameters:
 *       - in: path
 *         name: survivorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de resultados
 */
router.get("/results/:userId/:survivorId", async (req: Request, res: Response) => {
  const { userId, survivorId } = req.params;

  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: "Survivor not found" });

    const prediction = await PredictionSurvivor.findOne({ userId, survivorId });
    const gamble = await GambleSurvivor.findOne({ userId, survivorId });

    if (!prediction || !gamble) {
      return res.json({
        results: [],
        lives: 0,
        simulationDone: survivor.finished,
      });
    }

    const results: any[] = [];

    survivor.competition.forEach((jornada: any) => {
      jornada.matches.forEach((m: any) => {
        const matchId = String(m.matchId);
        const pick = prediction.predictions.find((p: any) => p.matchId === m.matchId);
        const matchResult = survivor.survivorResults?.[matchId] || null;

        results.push({
          matchId,
          home: m.home,
          visitor: m.visitor,
          userTeam: pick?.teamId || null,
          winner: matchResult?.winner || null,
          // 🔹 Tomar el resultado directamente de la predicción del usuario
          result: pick?.result || "pending",
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

/**
 * @swagger
 * /join:
 *   post:
 *     summary: Unirse a un survivor
 *     tags: [Survivor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               survivorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario unido correctamente
 */
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

/**
 * @swagger
 * /predict:
 *   post:
 *     summary: Registrar predicción de un partido
 *     tags: [Survivor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               matchId:
 *                 type: string
 *               teamId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Predicción registrada
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
    console.log(`[PREDICT] user=${userId} survivor=${survivorId}`);
    res.status(200).json({ message: 'Predictions saved' });
  } catch (err) {
    console.error('Predict error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /pick:
 *   post:
 *     summary: Seleccionar un equipo (pick) para un partido en un survivor
 *     tags:
 *       - Survivor
 *     description: |
 *       Selecciona un equipo para un partido en el survivor especificado.
 *       **Nota:** el usuario se toma desde la sesión/auth (`req.user.id`).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               survivorId:
 *                 type: string
 *                 description: ID del survivor
 *               matchId:
 *                 type: string
 *                 description: ID del partido
 *               teamId:
 *                 type: string
 *                 description: ID del equipo seleccionado (home o visitor)
 *             required:
 *               - survivorId
 *               - matchId
 *               - teamId
 *     responses:
 *       200:
 *         description: Selección guardada correctamente
 *       400:
 *         description: Error de validación (ej. partido ya empezado o equipo inválido)
 *       403:
 *         description: El usuario no se unió al survivor
 *       404:
 *         description: Survivor, partido o registro de predicción no encontrado
 *       500:
 *         description: Error interno del servidor
 */
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

/**
 * @swagger
 * /simulate/{survivorId}:
 *   post:
 *     summary: Simular resultados de un survivor
 *     tags: [Survivor]
 *     parameters:
 *       - in: path
 *         name: survivorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Survivor simulado correctamente
 */
router.post("/simulate/:id", async (req: Request, res: Response) => {
  const survivorId = req.params.id;

  try {
    const survivor = await Survivor.findById(survivorId);
    if (!survivor) return res.status(404).json({ error: "Survivor not found" });

    if (survivor.finished) {
      return res.status(400).json({ error: "Survivor already simulated" });
    }

    const predictions = await PredictionSurvivor.find({ survivorId });
    if (predictions.length === 0) {
      return res.status(400).json({ error: "No hay predicciones para simular" });
    }

    const results: Record<string, any> = {};

    survivor.competition.forEach((jornada) => {
      jornada.matches.forEach((m) => {
        const random = Math.random();
        if (random < 0.4) results[m.matchId] = { winner: m.home };
        else if (random < 0.8) results[m.matchId] = { winner: m.visitor };
        else results[m.matchId] = { winner: null }; // empate
      });
    });

    survivor.survivorResults = results;
    survivor.finished = true;
    await survivor.save();

    // 🔹 actualizar vidas y resultados de cada usuario
    for (const pred of predictions) {
      const gamble = await GambleSurvivor.findOne({ userId: pred.userId, survivorId });
      if (!gamble) continue;

      let lives = gamble.lives;

      pred.predictions.forEach((p) => {
        const matchResult = results[p.matchId];

        if (!matchResult) {
          // caso suspendido o algo raro, sin resultado
          lives -= 1;
          p.result = "fail";
        } else if (!matchResult.winner) {
          // 🔹 empate => resta 0.5 vidas, pero sigue siendo "fail" en el schema
          lives -= 0.5;
          p.result = "fail";
        } else if (p.teamId === matchResult.winner._id.toString()) {
          p.result = "success";
        } else {
          // derrota normal
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

export default router;
