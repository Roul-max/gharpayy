import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

export interface AuthRequest extends Request {
  user?: any;
  role?: string;
  roles?: string[];
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token is missing or invalid' });
  }

  try {
    let decoded: any | null = null;

    // First try Supabase auth token verification.
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (!userError && userData?.user) {
      decoded = { sub: userData.user.id, email: userData.user.email };
    } else {
      // Fallback to JWT verification for self-hosted tokens.
      const jwtSecret = process.env.SUPABASE_JWT_SECRET;
      if (!jwtSecret) throw new Error('Missing SUPABASE_JWT_SECRET for JWT fallback');
      decoded = jwt.verify(token, jwtSecret) as any;
    }

    req.user = decoded;

    const { data: roleRows, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', decoded.sub)
      .limit(10);

    if (error) {
      return res.status(403).json({ error: 'Unable to fetch user roles' });
    }

    const roles = (roleRows ?? []).map((row: any) => row.role);
    req.roles = roles;
    req.role = roles[0];

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const assignedRoles = req.roles ?? (req.role ? [req.role] : []);
    const allowed = assignedRoles.some((role) => roles.includes(role));
    if (!allowed) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
