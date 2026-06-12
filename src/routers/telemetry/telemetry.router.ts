import { Router, Request, Response } from 'express';
import { telemetryService } from '../../services/telemetry/telemetry.service';
import { apiKeyMiddleware } from '../../middlewares/api-key/api-key.middleware';
import { validateBody } from '../../middlewares/validate/validate.middleware';
import { TelemetryDto, DoorEventDto } from '../../dto';

const router = Router();

router.use(apiKeyMiddleware);

/**
 * @swagger
 * /api/telemetry:
 *   post:
 *     tags: [Telemetry]
 *     summary: Receive telemetry data from IoT device
 *     description: Endpoint for ESP32/IoT devices to send temperature and humidity data. Requires X-API-Key header.
 *     parameters:
 *       - in: header
 *         name: X-API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Container API key for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [temperature, humidity]
 *             properties:
 *               temperature:
 *                 type: number
 *                 description: Temperature in Celsius
 *                 example: 21.5
 *               humidity:
 *                 type: number
 *                 description: Humidity percentage
 *                 example: 45.0
 *     responses:
 *       200:
 *         description: Telemetry received and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 incidentsCreated:
 *                   type: integer
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Invalid or missing API key
 */
router.post('/', validateBody(TelemetryDto), async (req: Request, res: Response) => {
  try {
    const { temperature, humidity } = req.body;
    const container = req.container!;
    const result = await telemetryService.processTelemetryForContainer({
      container,
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
    });

    res.json({
      success: true,
      message: 'Telemetry received',
      incidentsCreated: result.incidents.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process telemetry';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/telemetry/door:
 *   post:
 *     tags: [Telemetry]
 *     summary: Receive door sensor event from IoT device
 *     description: Endpoint for ESP32/IoT devices to send container door open/close events. Requires X-API-Key header.
 *     parameters:
 *       - in: header
 *         name: X-API-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Container API key for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doorOpen]
 *             properties:
 *               doorOpen:
 *                 type: boolean
 *                 description: Door state (true = opened, false = closed)
 *                 example: true
 *     responses:
 *       200:
 *         description: Door event received and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 incidentCreated:
 *                   type: boolean
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Invalid or missing API key
 */
router.post('/door', validateBody(DoorEventDto), async (req: Request, res: Response) => {
  try {
    const { doorOpen } = req.body;
    const container = req.container!;
    const result = await telemetryService.processDoorEventForContainer({
      container,
      doorOpen: Boolean(doorOpen),
    });

    res.json({
      success: true,
      message: doorOpen ? 'Door opened event received' : 'Door closed event received',
      incidentCreated: !!result.incident,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process door event';
    res.status(400).json({ success: false, error: message });
  }
});

export const telemetryRouter = router;
