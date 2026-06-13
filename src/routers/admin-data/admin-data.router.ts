import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { isAdmin } from '../../guards/role.guard';
import { adminDataService } from '../../services/admin-data/admin-data.service';
import { eventLogService } from '../../services/event-log/event-log.service';

const router = Router();

router.use(authMiddleware);
router.use(isAdmin);

router.get('/export', async (_req: Request, res: Response) => {
  try {
    const data = await adminDataService.exportData();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

router.get('/backup', async (req: Request, res: Response) => {
  try {
    const data = await adminDataService.exportData();
    const fileDate = new Date().toISOString().replace(/[:.]/g, '-');

    await eventLogService.log({
      action: 'export',
      entityType: 'backup',
      entityId: 0,
      userId: req.user?.userId,
      details: { exportedAt: data.exportedAt },
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="cargoguard-backup-${fileDate}.json"`);
    res.json(data);
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create backup' });
  }
});

router.post('/import', async (req: Request, res: Response) => {
  try {
    const result = await adminDataService.importData(req.body);

    await eventLogService.log({
      action: 'import',
      entityType: 'backup',
      entityId: 0,
      userId: req.user?.userId,
      details: result,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import data';
    res.status(400).json({ success: false, error: message });
  }
});

export const adminDataRouter = router;
