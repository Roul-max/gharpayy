import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { matchBedsForLead } from '../services/matchingEngine.js';

export const matchingController = {
  async getMatchesForLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const matches = await matchBedsForLead(req.params.leadId);
      res.json({ matches });
    } catch (error) {
      next(error);
    }
  },
};
