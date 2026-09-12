import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { DashboardService } from '../services/dashboardService';

const router = Router();

router.get('/metrics', authenticate, async (req, res, next) => {
  try {
    const scope = (req.query.scope as 'global' | 'mine') || 'global';
    const metrics = await DashboardService.getMetrics(req.user!, scope);
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
});

export default router;
