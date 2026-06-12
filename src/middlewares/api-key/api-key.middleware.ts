import { Request, Response, NextFunction } from 'express';
import { containersService } from '../../services/containers/containers.service';
import { Container } from '../../entities/container/container.entity';

declare global {
  namespace Express {
    interface Request {
      container?: Container;
    }
  }
}

export const apiKeyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({ success: false, error: 'API key is required' });
    return;
  }

  try {
    const container = await containersService.findByApiKey(apiKey);

    if (!container) {
      res.status(401).json({ success: false, error: 'Invalid API key' });
      return;
    }

    req.container = container;
    next();
  } catch {
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};
