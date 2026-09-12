import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEngagementSchema, generateNextPeriodSchema } from '../validators';
import { EngagementService } from '../services/engagementService';
import { Role } from '@prisma/client';

const router = Router();

// List engagements
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filters = {
      clientId: req.query.clientId as string | undefined,
      status: req.query.status as any,
    };
    const engagements = await EngagementService.listEngagements(filters);
    res.json({ success: true, data: engagements });
  } catch (err) {
    next(err);
  }
});

// Get single engagement details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const engagement = await EngagementService.getEngagementById(req.params.id as string);
    res.json({ success: true, data: engagement });
  } catch (err) {
    next(err);
  }
});

// Create engagement with auto-generated tasks (Manager / Admin)
router.post(
  '/',
  authenticate,
  requireRoles(Role.MANAGER, Role.ADMIN),
  validate(createEngagementSchema),
  async (req, res, next) => {
    try {
      const engagement = await EngagementService.createEngagement(req.body, req.user!);
      res.status(201).json({
        success: true,
        message: 'Engagement and task templates created successfully',
        data: engagement,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Generate next period engagement & tasks (Manager / Admin)
router.post(
  '/:id/next-period',
  authenticate,
  requireRoles(Role.MANAGER, Role.ADMIN),
  async (req, res, next) => {
    try {
      const nextEngagement = await EngagementService.generateNextPeriod(req.params.id as string, req.user!);
      res.status(201).json({
        success: true,
        message: `Successfully generated next period engagement for ${nextEngagement.period}`,
        data: nextEngagement,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
