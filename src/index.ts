import 'reflect-metadata';
import { config } from 'dotenv';
config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './config/data-source';
import { swaggerSpec } from './config/swagger';
import { authRouter } from './routers/auth/auth.router';
import { meRouter } from './routers/me/me.router';
import { usersRouter } from './routers/users/users.router';
import { cargoRouter } from './routers/cargo/cargo.router';
import { containersRouter } from './routers/containers/containers.router';
import { shipmentsRouter } from './routers/shipments/shipments.router';
import { incidentsRouter } from './routers/incidents/incidents.router';
import { telemetryRouter } from './routers/telemetry/telemetry.router';
import { eventsRouter } from './routers/events/events.router';
import { reportsRouter } from './routers/reports/reports.router';
import { adminDataRouter } from './routers/admin-data/admin-data.router';
import { errorHandler, notFoundHandler } from './middlewares/error/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || 'local';

app.use(cors());
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    instanceId: INSTANCE_ID,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/me', meRouter);
app.use('/api/users', usersRouter);
app.use('/api/cargo', cargoRouter);
app.use('/api/containers', containersRouter);
app.use('/api/shipments', shipmentsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/events', eventsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin/data', adminDataRouter);

app.use(notFoundHandler);
app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} as ${INSTANCE_ID}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;
