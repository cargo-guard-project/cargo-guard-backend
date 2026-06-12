import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { isOperator, isObserver } from '../../guards/role.guard';
import { cargoService } from '../../services/cargo/cargo.service';
import { eventLogService } from '../../services/event-log/event-log.service';
import { validateBody } from '../../middlewares/validate/validate.middleware';
import { CreateCargoDto, UpdateCargoDto } from '../../dto';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/cargo:
 *   get:
 *     tags: [Cargo]
 *     summary: Get all cargo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of cargo
 */
router.get('/', isObserver, async (_req: Request, res: Response) => {
  try {
    const cargo = await cargoService.findAll();
    res.json({ success: true, data: cargo });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get cargo' });
  }
});

/**
 * @swagger
 * /api/cargo/{id}:
 *   get:
 *     tags: [Cargo]
 *     summary: Get cargo by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cargo data
 *       404:
 *         description: Cargo not found
 */
router.get('/:id', isObserver, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const cargo = await cargoService.findById(id);

    if (!cargo) {
      res.status(404).json({ success: false, error: 'Cargo not found' });
      return;
    }

    res.json({ success: true, data: cargo });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get cargo' });
  }
});

/**
 * @swagger
 * /api/cargo:
 *   post:
 *     tags: [Cargo]
 *     summary: Create new cargo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, temperatureMin, temperatureMax, humidityMin, humidityMax]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mona Lisa Replica
 *               description:
 *                 type: string
 *                 example: High-value artwork replica requiring strict climate control
 *               type:
 *                 type: string
 *                 example: artwork
 *               temperatureMin:
 *                 type: number
 *                 example: 18
 *               temperatureMax:
 *                 type: number
 *                 example: 22
 *               humidityMin:
 *                 type: number
 *                 example: 40
 *               humidityMax:
 *                 type: number
 *                 example: 55
 *     responses:
 *       201:
 *         description: Cargo created
 *       400:
 *         description: Validation error
 */
router.post('/', isOperator, validateBody(CreateCargoDto), async (req: Request, res: Response) => {
  try {
    const { name, description, type, temperatureMin, temperatureMax, humidityMin, humidityMax } = req.body;
    const cargo = await cargoService.create({
      name,
      description,
      type,
      temperatureMin,
      temperatureMax,
      humidityMin,
      humidityMax,
    });

    await eventLogService.log({
      action: 'create',
      entityType: 'cargo',
      entityId: cargo.id,
      userId: req.user?.userId,
      details: { name, type },
    });

    res.status(201).json({ success: true, data: cargo });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create cargo';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/cargo/{id}:
 *   put:
 *     tags: [Cargo]
 *     summary: Update cargo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               temperatureMin:
 *                 type: number
 *               temperatureMax:
 *                 type: number
 *               humidityMin:
 *                 type: number
 *               humidityMax:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cargo updated
 *       404:
 *         description: Cargo not found
 */
router.put('/:id', isOperator, validateBody(UpdateCargoDto), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description, type, temperatureMin, temperatureMax, humidityMin, humidityMax } = req.body;
    const cargo = await cargoService.update(id, {
      name,
      description,
      type,
      temperatureMin,
      temperatureMax,
      humidityMin,
      humidityMax,
    });

    await eventLogService.log({
      action: 'update',
      entityType: 'cargo',
      entityId: id,
      userId: req.user?.userId,
      details: { updatedFields: Object.keys(req.body) },
    });

    res.json({ success: true, data: cargo });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update cargo';
    const status = message === 'Cargo not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/cargo/{id}:
 *   delete:
 *     tags: [Cargo]
 *     summary: Delete cargo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cargo deleted
 *       404:
 *         description: Cargo not found
 */
router.delete('/:id', isOperator, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await cargoService.delete(id);

    await eventLogService.log({
      action: 'delete',
      entityType: 'cargo',
      entityId: id,
      userId: req.user?.userId,
    });

    res.json({ success: true, message: 'Cargo deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete cargo';
    const status = message === 'Cargo not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

export const cargoRouter = router;
