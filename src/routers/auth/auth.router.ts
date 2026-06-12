import { Router, Request, Response } from 'express';
import { userAuthService } from '../../services/user-auth/user-auth.service';
import { validateBody } from '../../middlewares/validate/validate.middleware';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../../dto';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
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
 *                 example: operator@test.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               name:
 *                 type: string
 *                 example: Test Operator
 *               role:
 *                 type: string
 *                 enum: [operator, observer]
 *                 example: operator
 *                 description: User role (admin role not allowed via public registration)
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 *       403:
 *         description: Cannot register as admin
 */
router.post('/register', validateBody(RegisterDto), async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const user = await userAuthService.register({ email, password, name, role });
    const tokens = userAuthService.generateTokens(user);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        ...tokens,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: operator@test.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful, returns tokens
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateBody(LoginDto), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await userAuthService.login({ email, password });

    res.json({ success: true, data: tokens });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens returned
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validateBody(RefreshTokenDto), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await userAuthService.refresh(refreshToken);

    res.json({ success: true, data: tokens });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({ success: false, error: message });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await userAuthService.logout(refreshToken);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch {
    res.json({ success: true, message: 'Logged out successfully' });
  }
});

export const authRouter = router;
