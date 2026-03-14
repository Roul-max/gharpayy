import { describe, expect, it, vi } from 'vitest';
import { requireRole } from './requireRole.js';

describe('requireRole middleware', () => {
  it('allows access when role is allowed', () => {
    const req: any = { role: 'admin', roles: ['admin'] };
    const res: any = {};
    const next = vi.fn();

    requireRole(['admin'])(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks access when role is not allowed', () => {
    const req: any = { role: 'agent', roles: ['agent'] };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    requireRole(['admin'])(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
