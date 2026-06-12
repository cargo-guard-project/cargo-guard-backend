import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { isOperator, isObserver } from '../../guards/role.guard';
import { containersService } from '../../services/containers/containers.service';
import { eventLogService } from '../../services/event-log/event-log.service';
import { validateBody } from '../../middlewares/validate/validate.middleware';
import { CreateContainerDto, UpdateContainerDto } from '../../dto';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/containers:
 *   get:
 *     tags: [Containers]
 *     summary: Get all containers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of containers
 */
router.get('/', isObserver, async (_req: Request, res: Response) => {
  try {
    const containers = await containersService.findAll();
    res.json({ success: true, data: containers });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get containers' });
  }
});

/**
 * @swagger
 * /api/containers/{id}:
 *   get:
 *     tags: [Containers]
 *     summary: Get container by ID
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
 *         description: Container data
 *       404:
 *         description: Container not found
 */
router.get('/:id', isObserver, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const container = await containersService.findById(id);

    if (!container) {
      res.status(404).json({ success: false, error: 'Container not found' });
      return;
    }

    res.json({ success: true, data: container });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get container' });
  }
});

/**
 * @swagger
 * /api/containers:
 *   post:
 *     tags: [Containers]
 *     summary: Create new container
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serialNumber, name]
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 example: CNT-2024-001
 *               name:
 *                 type: string
 *                 example: Climate Box Alpha
 *               status:
 *                 type: string
 *                 enum: [available, in_use, maintenance, retired]
 *                 example: available
 *     responses:
 *       201:
 *         description: Container created
 *       400:
 *         description: Validation error
 */
router.post('/', isOperator, validateBody(CreateContainerDto), async (req: Request, res: Response) => {
  try {
    const { serialNumber, name, status } = req.body;
    const container = await containersService.create({ serialNumber, name, status });

    await eventLogService.log({
      action: 'create',
      entityType: 'container',
      entityId: container.id,
      userId: req.user?.userId,
      details: { serialNumber, name },
    });

    res.status(201).json({ success: true, data: container });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create container';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/containers/{id}:
 *   put:
 *     tags: [Containers]
 *     summary: Update container
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
 *               serialNumber:
 *                 type: string
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, in_use, maintenance, retired]
 *     responses:
 *       200:
 *         description: Container updated
 *       404:
 *         description: Container not found
 */
router.put('/:id', isOperator, validateBody(UpdateContainerDto), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { serialNumber, name, status } = req.body;
    const oldContainer = await containersService.findById(id);
    const container = await containersService.update(id, { serialNumber, name, status });

    const action = status && oldContainer && status !== oldContainer.status ? 'status_change' : 'update';
    await eventLogService.log({
      action,
      entityType: 'container',
      entityId: id,
      userId: req.user?.userId,
      details: action === 'status_change'
        ? { oldStatus: oldContainer?.status, newStatus: status }
        : { updatedFields: Object.keys(req.body) },
    });

    res.json({ success: true, data: container });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update container';
    const status = message === 'Container not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/containers/{id}:
 *   delete:
 *     tags: [Containers]
 *     summary: Delete container
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
 *         description: Container deleted
 *       404:
 *         description: Container not found
 */
router.delete('/:id', isOperator, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await containersService.delete(id);

    await eventLogService.log({
      action: 'delete',
      entityType: 'container',
      entityId: id,
      userId: req.user?.userId,
    });

    res.json({ success: true, message: 'Container deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete container';
    const status = message === 'Container not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/containers/{id}/regenerate-api-key:
 *   post:
 *     tags: [Containers]
 *     summary: Regenerate container API key
 *     description: Generate a new API key for the container. Old key will be invalidated.
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
 *         description: New API key generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     apiKey:
 *                       type: string
 *       404:
 *         description: Container not found
 */
router.post('/:id/regenerate-api-key', isOperator, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const container = await containersService.regenerateApiKey(id);
    res.json({ success: true, data: { apiKey: container.apiKey } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate API key';
    const status = message === 'Container not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/containers/{id}/telemetry:
 *   get:
 *     tags: [Containers]
 *     summary: Get container telemetry history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: Telemetry records
 *       404:
 *         description: Container not found
 */
router.get('/:id/telemetry', isObserver, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const limit = parseInt(req.query.limit as string, 10) || 100;

    const telemetry = await containersService.getTelemetry(id, limit);
    res.json({ success: true, data: telemetry });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get telemetry';
    const status = message === 'Container not found' ? 404 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

export const containersRouter = router;
