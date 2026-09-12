import { Router } from 'express';
import { AuthService } from '../services/authService';
import { validate } from '../middleware/validate';
import { authenticate, requireRoles } from '../middleware/auth';
import { loginSchema, registerSchema } from '../validators';
import { Role } from '@prisma/client';

const router = Router();

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/switch-demo', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await AuthService.switchDemoUser(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: req.user });
});

router.get('/users', authenticate, async (req, res, next) => {
  try {
    const users = await AuthService.listAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

export default router;
