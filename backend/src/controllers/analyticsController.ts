import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { getAgentPerformance } from '../services/agentAnalytics.js';
import { queryCache } from '../cache/queryCache.js';

export const analyticsController = {
  async getAgentPerformance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, cache } = await queryCache(
        'agent-performance',
        { ttlSeconds: 90, namespace: 'analytics' },
        () => getAgentPerformance()
      );
      res.setHeader('x-cache', cache);
      res.json({ agents: data });
    } catch (error) {
      next(error);
    }
  },
};
