import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createClientSchema, updateClientSchema } from '../validators';
import { AdminService } from '../services/adminService';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const clients = await AdminService.listClients();
    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireRoles(Role.ADMIN, Role.MANAGER),
  validate(createClientSchema),
  async (req, res, next) => {
    try {
      const client = await AdminService.createClient(req.body);
      res.status(201).json({ success: true, data: client });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id',
  authenticate,
  requireRoles(Role.ADMIN, Role.MANAGER),
  validate(updateClientSchema),
  async (req, res, next) => {
    try {
      const client = await AdminService.updateClient(req.params.id as string, req.body);
      res.json({ success: true, data: client });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
