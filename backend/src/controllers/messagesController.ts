import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { messageService } from '../services/messageService.js';

export const messagesController = {
  async getMessagesForLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const leadId = req.params.leadId;
      const messages = await messageService.getConversationByLead(leadId);
      res.json({ messages });
    } catch (error) {
      next(error);
    }
  },

  async sendMessageToLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { message, channel } = req.body;
      const leadId = req.params.leadId;

      const newMessage = await messageService.sendMessageToLead(leadId, req.user!.sub, message, channel);
      res.status(201).json(newMessage);
    } catch (error) {
      next(error);
    }
  },
};
