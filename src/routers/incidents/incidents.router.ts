import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { isOperator, isObserver } from '../../guards/role.guard';
import { incidentsService } from '../../services/incidents/incidents.service';
import { eventLogService } from '../../services/event-log/event-log.service';
import { validateBody } from '../../middlewares/validate/validate.middleware';
import { CreateIncidentDto } from '../../dto';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/incidents:
 *   get:
 *     tags: [Incidents]
 *     summary: Get all incidents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of incidents
 */
router.get('/', isObserver, async (_req: Request, res: Response) => {
  try {
    const incidents = await incidentsService.findAll();
    res.json({ success: true, data: incidents });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get incidents' });
  }
});

/**
 * @swagger
 * /api/incidents/{id}:
 *   get:
 *     tags: [Incidents]
 *     summary: Get incident by ID
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
 *         description: Incident data
 *       404:
 *         description: Incident not found
 */
router.get('/:id', isObserver, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const incident = await incidentsService.findById(id);

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }

    res.json({ success: true, data: incident });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get incident' });
  }
});

/**
 * @swagger
 * /api/incidents:
 *   post:
 *     tags: [Incidents]
 *     summary: Create new incident (for testing or IoT simulation)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, severity, description, shipmentId]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [temperature_violation, humidity_violation, container_opened]
 *                 example: temperature_violation
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 example: high
 *               description:
 *                 type: string
 *                 example: "Temperature exceeded 25°C (max: 22°C)"
 *               shipmentId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Incident created
 *       400:
 *         description: Validation error
 *       404:
 *         description: Shipment not found
 */
router.post('/', isOperator, validateBody(CreateIncidentDto), async (req: Request, res: Response) => {
  try {
    const { type, severity, description, shipmentId } = req.body;
    const incident = await incidentsService.create({ type, severity, description, shipmentId });

    await eventLogService.log({
      action: 'create',
      entityType: 'incident',
      entityId: incident.id,
      userId: req.user?.userId,
      details: { type, severity, shipmentId },
    });

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create incident';
    const status = message === 'Shipment not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/incidents/{id}/resolve:
 *   put:
 *     tags: [Incidents]
 *     summary: Resolve incident
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
 *         description: Incident resolved
 *       404:
 *         description: Incident not found
 *       400:
 *         description: Incident already resolved
 */
router.put('/:id/resolve', isOperator, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const incident = await incidentsService.resolve(id);

    await eventLogService.log({
      action: 'resolve',
      entityType: 'incident',
      entityId: id,
      userId: req.user?.userId,
    });

    res.json({ success: true, data: incident });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resolve incident';
    const status = message === 'Incident not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

export const incidentsRouter = router;
