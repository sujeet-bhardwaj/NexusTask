import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createServiceTypeSchema, createTaskTemplateSchema } from '../validators';
import { AdminService } from '../services/adminService';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const services = await AdminService.listServiceTypes();
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireRoles(Role.ADMIN),
  validate(createServiceTypeSchema),
  async (req, res, next) => {
    try {
      const service = await AdminService.createServiceType(req.body);
      res.status(201).json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/templates',
  authenticate,
  requireRoles(Role.ADMIN),
  validate(createTaskTemplateSchema),
  async (req, res, next) => {
    try {
      const template = await AdminService.createTaskTemplate(req.body);
      res.status(201).json({ success: true, data: template });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/templates/:id',
  authenticate,
  requireRoles(Role.ADMIN),
  async (req, res, next) => {
    try {
      await AdminService.deleteTaskTemplate(req.params.id as string);
      res.json({ success: true, message: 'Template removed successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
