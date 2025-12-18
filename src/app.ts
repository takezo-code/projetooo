import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './shared/middlewares/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { taskRoutes } from './routes/task.routes';
import { userRoutes } from './routes/user.routes';

/**
 * Configuração do Express App
 * Separado do server.ts para facilitar testes
 */
export function createApp(): Application {
  const app = express();

  // ==================== MIDDLEWARES GLOBAIS ====================
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ==================== HEALTH CHECK ====================
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==================== ROTAS DOS MÓDULOS ====================
  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/users', userRoutes);

  // ==================== ERROR HANDLER (SEMPRE POR ÚLTIMO) ====================
  app.use(errorHandler);

  return app;
}

