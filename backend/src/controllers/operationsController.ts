import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { operationsService } from '../services/operationsService.js';
import { aiAssistantService } from '../services/aiAssistantService.js';
import { queryCache } from '../cache/queryCache.js';

function getPagination(req: AuthRequest) {
  return {
    page: req.query.page ? Number(req.query.page) : 1,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : 25
  };
}

export const operationsController = {
  async listPublicProperties(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const params = {
        city: req.query.city as string | undefined,
        area: req.query.area as string | undefined,
        gender: req.query.gender as string | undefined,
        budget: req.query.budget as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        cursor: req.query.cursor as string | undefined,
        minLat: req.query.minLat ? Number(req.query.minLat) : undefined,
        maxLat: req.query.maxLat ? Number(req.query.maxLat) : undefined,
        minLng: req.query.minLng ? Number(req.query.minLng) : undefined,
        maxLng: req.query.maxLng ? Number(req.query.maxLng) : undefined
      };
      const { data, cache } = await queryCache(
        `properties:${JSON.stringify(params)}`,
        { ttlSeconds: 45, namespace: 'public' },
        () => operationsService.listPublicProperties(params)
      );
      res.setHeader('x-cache', cache);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async getPublicPropertyById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, cache } = await queryCache(
        `property:${req.params.id}`,
        { ttlSeconds: 180, namespace: 'public' },
        () => operationsService.getPublicPropertyById(req.params.id)
      );
      res.setHeader('x-cache', cache);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  },

  async getPublicStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { data, cache } = await queryCache(
        'stats',
        { ttlSeconds: 120, namespace: 'public' },
        () => operationsService.getPublicStats()
      );
      res.setHeader('x-cache', cache);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  },

  async listVisits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await operationsService.listVisits({
        ...getPagination(req),
        status: req.query.status as string | undefined,
        leadId: req.query.leadId as string | undefined
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async createVisit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const visit = await operationsService.createVisit(req.body);
      res.status(201).json(visit);
    } catch (error) {
      next(error);
    }
  },

  async updateVisitOutcome(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const visit = await operationsService.updateVisitOutcome(req.params.id, req.body);
      res.json(visit);
    } catch (error) {
      next(error);
    }
  },

  async listBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await operationsService.listBookings({
        ...getPagination(req),
        status: req.query.status as string | undefined,
        userId: req.user?.sub,
        roles: req.roles ?? (req.role ? [req.role] : [])
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async listProperties(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await operationsService.listProperties({
        ...getPagination(req),
        city: req.query.city as string | undefined,
        area: req.query.area as string | undefined,
        ownerId: req.query.ownerId as string | undefined,
        userId: req.user?.sub,
        roles: req.roles ?? (req.role ? [req.role] : [])
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async createProperty(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const property = await operationsService.createProperty(req.body, {
        userId: req.user?.sub,
        roles: req.roles ?? (req.role ? [req.role] : [])
      });
      res.status(201).json(property);
    } catch (error) {
      next(error);
    }
  },

  async updatePropertyPhotos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const property = await operationsService.updatePropertyPhotos(
        req.params.id,
        req.body.photos,
        {
          userId: req.user?.sub,
          roles: req.roles ?? (req.role ? [req.role] : [])
        }
      );
      res.json(property);
    } catch (error) {
      next(error);
    }
  },

  async createRoom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const room = await operationsService.createRoom(req.body, {
        userId: req.user?.sub,
        roles: req.roles ?? (req.role ? [req.role] : [])
      });
      res.status(201).json(room);
    } catch (error) {
      next(error);
    }
  },

  async addBedsToRoom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await operationsService.addBedsToRoom({
        room_id: req.params.id,
        count: req.body.count
      }, {
        userId: req.user?.sub,
        roles: req.roles ?? (req.role ? [req.role] : [])
      });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const params = {
        propertyId: req.query.propertyId as string | undefined,
        userId: req.user?.sub,
        roles: req.roles ?? (req.role ? [req.role] : [])
      };
      const key = `inventory:${params.propertyId ?? 'all'}:${params.userId ?? 'anon'}:${(params.roles ?? []).join(',')}`;
      const { data, cache } = await queryCache(
        key,
        { ttlSeconds: 30, namespace: 'inventory' },
        () => operationsService.listInventory(params)
      );
      res.setHeader('x-cache', cache);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async confirmRoomStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.confirmRoomStatus(req.body, {
        userId: req.user?.sub,
        roles: req.roles ?? (req.role ? [req.role] : [])
      });
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async listOwners(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await operationsService.listOwners(getPagination(req));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async createOwner(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const owner = await operationsService.createOwner(req.body);
      res.status(201).json(owner);
    } catch (error) {
      next(error);
    }
  },

  async getEffortDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.getEffortDashboard(
        req.query.propertyId as string | undefined,
        {
          userId: req.user?.sub,
          roles: req.roles ?? (req.role ? [req.role] : [])
        }
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async listZones(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.listZones();
      res.json({ data });
    } catch (error) {
      next(error);
    }
  },

  async createZone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const zone = await operationsService.createZone(req.body);
      res.status(201).json(zone);
    } catch (error) {
      next(error);
    }
  },

  async updateZone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const zone = await operationsService.updateZone(req.params.id, req.body);
      res.json(zone);
    } catch (error) {
      next(error);
    }
  },

  async listFollowUps(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.listFollowUps({
        ...getPagination(req),
        userId: req.user?.sub,
        status: req.query.status as string | undefined,
        assignedAgentId: req.query.assignedAgentId as string | undefined
      });
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async createFollowUp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.createFollowUp({
        ...req.body,
        created_by: req.user?.sub
      });
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },

  async updateFollowUp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.updateFollowUp(req.params.id, req.body);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async listNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.listNotifications(req.user?.sub);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.markNotificationRead(req.params.id, req.user?.sub);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async runAutomation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.runAutomation(req.body?.job ?? 'all');
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async getOwnerAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await operationsService.getOwnerAlerts({
        userId: req.user?.sub,
        roles: req.roles ?? (req.role ? [req.role] : [])
      });
      res.json(data);
    } catch (error) {
      next(error);
    }
  },

  async publicCaptureLead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lead = await operationsService.publicCaptureLead(req.body);
      res.status(201).json(lead);
    } catch (error) {
      next(error);
    }
  },

  async publicVisitRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await operationsService.publicVisitRequest(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async publicChatMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await operationsService.publicChatMessage(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async publicCreateReservation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await operationsService.publicCreateReservation(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async publicAiAssistant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await aiAssistantService.reply(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
