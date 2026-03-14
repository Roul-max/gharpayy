import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth.js';

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const assignedRoles = req.roles ?? (req.role ? [req.role] : []);
    const allowed = assignedRoles.some((role) => roles.includes(role));
    if (!allowed) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

