import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../declarations';

export const roleGuard = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    next();
  };
};

export const isAdmin = roleGuard('admin');
export const isOperator = roleGuard('admin', 'operator');
export const isObserver = roleGuard('admin', 'operator', 'observer');
