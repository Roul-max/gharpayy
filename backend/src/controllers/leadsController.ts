import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { leadService } from '../services/leadService.js';

export const leadsController = {
  async getAgents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await leadService.getAgents();
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async getActivities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await leadService.getActivities(req.params.id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async getAllLeads(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await leadService.getAllLeads();
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async getLeadById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await leadService.getLeadById(req.params.id);
      if (!data) return res.status(404).json({ error: 'Lead not found' });
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async createLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { force, ...leadData } = req.body;
      const result = await leadService.createLead(leadData, req.user!.sub, force);

      if (result.duplicate) {
        return res.status(409).json(result);
      }

      res.status(201).json(result.data);
    } catch (error) {
      next(error);
    }
  },

  async mergeLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, phone, email, source, city, area, budget, gender, sharing_type } = req.body;
      const updates: any = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (source) updates.source = source;
      if (city) updates.city = city;
      if (area) updates.area = area;
      if (budget) updates.budget = budget;
      if (gender) updates.gender = gender;
      if (sharing_type) updates.sharing_type = sharing_type;

      const data = await leadService.mergeLead(req.params.id, updates, req.user!.sub);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async updateLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, phone, email, source, status, lead_score, assigned_agent_id, property_id } = req.body;
      const updates = { name, phone, email, source, status, lead_score, assigned_agent_id, property_id };
      
      const data = await leadService.updateLead(req.params.id, updates, req.user!.sub);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async deleteLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await leadService.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async bulkImportLeads(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const leads = req.body.leads;
      if (!Array.isArray(leads)) {
        return res.status(400).json({ error: 'Expected an array of leads' });
      }

      const data = await leadService.bulkImportLeads(leads, req.user!.sub);
      res.status(201).json({ message: `Successfully imported ${data.length} leads`, data });
    } catch (error) {
      next(error);
    }
  },
};
