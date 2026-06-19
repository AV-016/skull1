import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export class EventController {
  // Public Endpoint: Fetch active events with their products
  async getActiveEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const events = await prisma.event.findMany({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now }
        },
        include: {
          products: {
            include: {
              images: true,
              category: true
            }
          }
        },
        orderBy: {
          endDate: 'asc'
        }
      });

      res.status(200).json({
        success: true,
        message: 'Active events retrieved successfully',
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin Endpoints
  async getAllEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await prisma.event.findMany({
        include: {
          products: {
            select: {
              id: true,
              name: true,
              price: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(200).json({
        success: true,
        message: 'All events retrieved successfully',
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: req.params.id },
        include: {
          products: {
            include: {
              images: true,
              category: true
            }
          }
        }
      });

      if (!event) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Event retrieved successfully',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, bannerUrl, startDate, endDate, isActive, productIds } = req.body;

      const event = await prisma.event.create({
        data: {
          title,
          description,
          bannerUrl: bannerUrl || null,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          isActive: isActive !== undefined ? isActive : true,
          products: productIds && productIds.length > 0 
            ? { connect: productIds.map((id: string) => ({ id })) }
            : undefined
        },
        include: {
          products: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, bannerUrl, startDate, endDate, isActive, productIds } = req.body;
      const eventId = req.params.id;

      // First disconnect all existing products to perform a clean update
      await prisma.event.update({
        where: { id: eventId },
        data: {
          products: {
            set: [] // Clear existing connections
          }
        }
      });

      const event = await prisma.event.update({
        where: { id: eventId },
        data: {
          title,
          description,
          bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          products: productIds 
            ? { connect: productIds.map((id: string) => ({ id })) }
            : undefined
        },
        include: {
          products: true
        }
      });

      res.status(200).json({
        success: true,
        message: 'Event updated successfully',
        data: event
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.event.delete({
        where: { id: req.params.id }
      });

      res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default EventController;
