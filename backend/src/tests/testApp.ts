import express from 'express';
import routes from '../routes/index.js';
import { errorHandler } from '../middleware/errorHandler.js';

export function createTestApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    }
  }));
  app.use('/api', routes);
  app.use(errorHandler);
  return app;
}
