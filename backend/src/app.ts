import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import engagementRoutes from './routes/engagementRoutes';
import taskRoutes from './routes/taskRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import clientRoutes from './routes/clientRoutes';
import serviceRoutes from './routes/serviceRoutes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Task & Engagement Management API',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/engagements', engagementRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/services', serviceRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
