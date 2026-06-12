import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { isObserver } from '../../guards/role.guard';
import { reportsService } from '../../services/reports/reports.service';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/reports/shipment/{id}:
 *   get:
 *     tags: [Reports]
 *     summary: Get comprehensive shipment report
 *     description: Returns shipment data with all telemetry, incidents, and event history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shipment ID
 *     responses:
 *       200:
 *         description: Shipment report
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
 *                     shipment:
 *                       type: object
 *                     incidents:
 *                       type: array
 *                     telemetry:
 *                       type: array
 *                     eventLogs:
 *                       type: array
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalIncidents:
 *                           type: integer
 *                         resolvedIncidents:
 *                           type: integer
 *                         unresolvedIncidents:
 *                           type: integer
 *                         incidentsBySeverity:
 *                           type: object
 *                         telemetryRecords:
 *                           type: integer
 *                         temperatureRange:
 *                           type: object
 *                         humidityRange:
 *                           type: object
 *       404:
 *         description: Shipment not found
 */
router.get('/shipment/:id', isObserver, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const report = await reportsService.getShipmentReport(id);

    if (!report) {
      res.status(404).json({ success: false, error: 'Shipment not found' });
      return;
    }

    res.json({ success: true, data: report });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

export const reportsRouter = router;
