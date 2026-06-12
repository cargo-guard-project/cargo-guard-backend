import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { isOperator, isObserver } from '../../guards/role.guard';
import { shipmentsService } from '../../services/shipments/shipments.service';
import { eventLogService } from '../../services/event-log/event-log.service';
import { validateBody } from '../../middlewares/validate/validate.middleware';
import { CreateShipmentDto, UpdateShipmentDto } from '../../dto';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/shipments:
 *   get:
 *     tags: [Shipments]
 *     summary: Get all shipments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shipments
 */
router.get('/', isObserver, async (_req: Request, res: Response) => {
  try {
    const shipments = await shipmentsService.findAll();
    res.json({ success: true, data: shipments });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get shipments' });
  }
});

/**
 * @swagger
 * /api/shipments/{id}:
 *   get:
 *     tags: [Shipments]
 *     summary: Get shipment by ID
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
 *         description: Shipment data
 *       404:
 *         description: Shipment not found
 */
router.get('/:id', isObserver, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const shipment = await shipmentsService.findById(id);

    if (!shipment) {
      res.status(404).json({ success: false, error: 'Shipment not found' });
      return;
    }

    res.json({ success: true, data: shipment });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get shipment' });
  }
});

/**
 * @swagger
 * /api/shipments:
 *   post:
 *     tags: [Shipments]
 *     summary: Create new shipment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [origin, destination, cargoId, containerId]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [planned, in_progress, completed, cancelled]
 *                 example: planned
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               origin:
 *                 type: string
 *                 example: Kyiv, Ukraine
 *               destination:
 *                 type: string
 *                 example: Warsaw, Poland
 *               notes:
 *                 type: string
 *                 example: Fragile artwork - maintain climate conditions
 *               cargoId:
 *                 type: integer
 *                 example: 3
 *               containerId:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       201:
 *         description: Shipment created
 *       400:
 *         description: Validation error
 */
router.post('/', isOperator, validateBody(CreateShipmentDto), async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate, origin, destination, notes, cargoId, containerId } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const shipment = await shipmentsService.create({
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      origin,
      destination,
      notes,
      cargoId,
      containerId,
      userId: req.user.userId,
    });

    await eventLogService.log({
      action: 'create',
      entityType: 'shipment',
      entityId: shipment.id,
      userId: req.user.userId,
      details: { origin, destination, cargoId, containerId },
    });

    res.status(201).json({ success: true, data: shipment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create shipment';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/shipments/{id}:
 *   put:
 *     tags: [Shipments]
 *     summary: Update shipment
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
 *               status:
 *                 type: string
 *                 enum: [planned, in_progress, completed, cancelled]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               origin:
 *                 type: string
 *               destination:
 *                 type: string
 *               notes:
 *                 type: string
 *               cargoId:
 *                 type: integer
 *               containerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Shipment updated
 *       404:
 *         description: Shipment not found
 */
router.put('/:id', isOperator, validateBody(UpdateShipmentDto), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, startDate, endDate, origin, destination, notes, cargoId, containerId } = req.body;
    const oldShipment = await shipmentsService.findById(id);
    const shipment = await shipmentsService.update(id, {
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      origin,
      destination,
      notes,
      cargoId,
      containerId,
    });

    const action = status && oldShipment && status !== oldShipment.status ? 'status_change' : 'update';
    await eventLogService.log({
      action,
      entityType: 'shipment',
      entityId: id,
      userId: req.user?.userId,
      details: action === 'status_change'
        ? { oldStatus: oldShipment?.status, newStatus: status }
        : { updatedFields: Object.keys(req.body) },
    });

    res.json({ success: true, data: shipment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update shipment';
    const status = message === 'Shipment not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/shipments/{id}:
 *   delete:
 *     tags: [Shipments]
 *     summary: Delete shipment
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
 *         description: Shipment deleted
 *       404:
 *         description: Shipment not found
 */
router.delete('/:id', isOperator, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await shipmentsService.delete(id);

    await eventLogService.log({
      action: 'delete',
      entityType: 'shipment',
      entityId: id,
      userId: req.user?.userId,
    });

    res.json({ success: true, message: 'Shipment deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete shipment';
    const status = message === 'Shipment not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/shipments/{id}/start:
 *   put:
 *     tags: [Shipments]
 *     summary: Start shipment
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
 *         description: Shipment started
 *       404:
 *         description: Shipment not found
 *       400:
 *         description: Shipment cannot be started
 */
router.put('/:id/start', isOperator, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const oldShipment = await shipmentsService.findById(id);

    if (!oldShipment) {
      res.status(404).json({ success: false, error: 'Shipment not found' });
      return;
    }

    if (oldShipment.status === 'in_progress') {
      res.status(400).json({ success: false, error: 'Shipment already in progress' });
      return;
    }

    if (oldShipment.status === 'completed') {
      res.status(400).json({ success: false, error: 'Cannot start completed shipment' });
      return;
    }

    if (oldShipment.status === 'cancelled') {
      res.status(400).json({ success: false, error: 'Cannot start cancelled shipment' });
      return;
    }

    const shipment = await shipmentsService.update(id, {
      status: 'in_progress',
      startDate: new Date(),
    });

    await eventLogService.log({
      action: 'status_change',
      entityType: 'shipment',
      entityId: id,
      userId: req.user?.userId,
      details: { oldStatus: oldShipment.status, newStatus: 'in_progress' },
    });

    res.json({ success: true, data: shipment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start shipment';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/shipments/{id}/complete:
 *   put:
 *     tags: [Shipments]
 *     summary: Complete shipment
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
 *         description: Shipment completed
 *       404:
 *         description: Shipment not found
 *       400:
 *         description: Shipment already completed or cancelled
 */
router.put('/:id/complete', isOperator, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const oldShipment = await shipmentsService.findById(id);

    if (!oldShipment) {
      res.status(404).json({ success: false, error: 'Shipment not found' });
      return;
    }

    if (oldShipment.status === 'completed') {
      res.status(400).json({ success: false, error: 'Shipment already completed' });
      return;
    }

    if (oldShipment.status === 'cancelled') {
      res.status(400).json({ success: false, error: 'Cannot complete cancelled shipment' });
      return;
    }

    const shipment = await shipmentsService.update(id, {
      status: 'completed',
      endDate: new Date(),
    });

    await eventLogService.log({
      action: 'status_change',
      entityType: 'shipment',
      entityId: id,
      userId: req.user?.userId,
      details: { oldStatus: oldShipment.status, newStatus: 'completed' },
    });

    res.json({ success: true, data: shipment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to complete shipment';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/shipments/{id}/cancel:
 *   put:
 *     tags: [Shipments]
 *     summary: Cancel shipment
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
 *         description: Shipment cancelled
 *       404:
 *         description: Shipment not found
 *       400:
 *         description: Shipment already completed or cancelled
 */
router.put('/:id/cancel', isOperator, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const oldShipment = await shipmentsService.findById(id);

    if (!oldShipment) {
      res.status(404).json({ success: false, error: 'Shipment not found' });
      return;
    }

    if (oldShipment.status === 'cancelled') {
      res.status(400).json({ success: false, error: 'Shipment already cancelled' });
      return;
    }

    if (oldShipment.status === 'completed') {
      res.status(400).json({ success: false, error: 'Cannot cancel completed shipment' });
      return;
    }

    const shipment = await shipmentsService.update(id, {
      status: 'cancelled',
      endDate: new Date(),
    });

    await eventLogService.log({
      action: 'status_change',
      entityType: 'shipment',
      entityId: id,
      userId: req.user?.userId,
      details: { oldStatus: oldShipment.status, newStatus: 'cancelled' },
    });

    res.json({ success: true, data: shipment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel shipment';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/shipments/{id}/incidents:
 *   get:
 *     tags: [Shipments]
 *     summary: Get shipment incidents
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
 *         description: List of incidents
 *       404:
 *         description: Shipment not found
 */
router.get('/:id/incidents', isObserver, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const incidents = await shipmentsService.getIncidents(id);
    res.json({ success: true, data: incidents });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get incidents';
    const status = message === 'Shipment not found' ? 404 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/shipments/{id}/telemetry:
 *   get:
 *     tags: [Shipments]
 *     summary: Get shipment telemetry
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
 *     responses:
 *       200:
 *         description: Telemetry records
 *       404:
 *         description: Shipment not found
 */
router.get('/:id/telemetry', isObserver, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const limit = parseInt(req.query.limit as string, 10) || 100;

    const telemetry = await shipmentsService.getTelemetry(id, limit);
    res.json({ success: true, data: telemetry });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get telemetry';
    const status = message === 'Shipment not found' ? 404 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

export const shipmentsRouter = router;
