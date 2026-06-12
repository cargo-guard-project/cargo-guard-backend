import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth/auth.middleware';
import { isAdmin, isObserver } from '../../guards/role.guard';
import { usersService } from '../../services/users/users.service';
import { eventLogService } from '../../services/event-log/event-log.service';
import { validateBody } from '../../middlewares/validate/validate.middleware';
import { CreateUserDto, UpdateUserDto } from '../../dto';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied
 */
router.get('/', isAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await usersService.findAll();
    res.json({ success: true, data: users });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
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
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:id', isObserver, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await usersService.findById(id);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create new user (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               name:
 *                 type: string
 *                 example: New User
 *               role:
 *                 type: string
 *                 enum: [admin, operator, observer]
 *                 example: operator
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied
 */
router.post('/', isAdmin, validateBody(CreateUserDto), async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const user = await usersService.create({ email, password, name, role });

    await eventLogService.log({
      action: 'create',
      entityType: 'user',
      entityId: user.id,
      userId: req.user?.userId,
      details: { email, role },
    });

    res.status(201).json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
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
 *               email:
 *                 type: string
 *                 example: operator@test.com
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: Promoted Operator
 *               role:
 *                 type: string
 *                 enum: [admin, operator, observer]
 *                 example: admin
 *           example:
 *             role: admin
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Access denied - admin only
 *       404:
 *         description: User not found
 */
router.put('/:id', isAdmin, validateBody(UpdateUserDto), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { email, password, name, role } = req.body;
    const user = await usersService.update(id, { email, password, name, role });

    await eventLogService.log({
      action: 'update',
      entityType: 'user',
      entityId: id,
      userId: req.user?.userId,
      details: { updatedFields: Object.keys(req.body).filter(k => k !== 'password') },
    });

    res.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    const status = message === 'User not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (admin only)
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
 *         description: User deleted
 *       404:
 *         description: User not found
 */
router.delete('/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await usersService.delete(id);

    await eventLogService.log({
      action: 'delete',
      entityType: 'user',
      entityId: id,
      userId: req.user?.userId,
    });

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete user';
    const status = message === 'User not found' ? 404 : 400;
    res.status(status).json({ success: false, error: message });
  }
});

export const usersRouter = router;
