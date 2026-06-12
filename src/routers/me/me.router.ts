import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { userAuthService } from '../../services/user-auth/user-auth.service';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/me:
 *   get:
 *     tags: [User]
 *     summary: Get current user info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Not authenticated
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const user = await userAuthService.getUserById(req.user.userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get user info' });
  }
});

export const meRouter = router;
