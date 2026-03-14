import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin, supabaseAuth } from '../config/supabase.js';
import { rateLimit } from '../middleware/rateLimit.js';
import rateLimitExpress from 'express-rate-limit';

const router = Router();

const authLimiter = rateLimitExpress({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

router.use(authLimiter);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const resetSchema = z.object({
  email: z.string().email()
});

async function getRolesForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .limit(10);

  if (error) {
    throw new Error('Unable to fetch user roles');
  }

  return (data ?? []).map((row: any) => row.role);
}

router.post('/login', rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'login' }), async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid login payload' });
    }

    const { email, password } = parsed.data;
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      return res.status(401).json({ error: error?.message || 'Invalid email or password' });
    }

    const roles = await getRolesForUser(data.user.id);

    return res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      },
      user: {
        id: data.user.id,
        email: data.user.email
      },
      role: roles[0] ?? null,
      roles
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Unable to sign in' });
  }
});

router.post('/reset-password', rateLimit({ windowMs: 60_000, max: 5, keyPrefix: 'reset-password' }), async (req, res) => {
  try {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid reset payload' });
    }

    const redirectTo = process.env.APP_URL ? `${process.env.APP_URL}/auth` : undefined;
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(parsed.data.email, redirectTo ? { redirectTo } : undefined);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ message: 'Password reset link sent.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Unable to reset password' });
  }
});

router.use(authenticateToken);

router.get('/me', (req: AuthRequest, res) => {
  res.json({
    user: {
      id: req.user?.sub ?? null,
      email: req.user?.email ?? null
    },
    role: req.role ?? null,
    roles: req.roles ?? (req.role ? [req.role] : [])
  });
});

router.post('/logout', async (_req, res) => {
  return res.status(204).send();
});

export default router;
