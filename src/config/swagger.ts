import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CargoGuard API',
      version: '1.0.0',
      description: 'API for cargo monitoring system - automated monitoring of dangerous goods transportation (museum exhibits, artworks, pharmaceuticals) with IoT sensors for temperature and humidity tracking.',
      contact: {
        name: 'CargoGuard Support',
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'User', description: 'Current user profile' },
      { name: 'Users', description: 'User management (admin only)' },
      { name: 'Cargo', description: 'Cargo management' },
      { name: 'Containers', description: 'Container management' },
      { name: 'Shipments', description: 'Shipment management' },
      { name: 'Incidents', description: 'Incident management' },
      { name: 'Telemetry', description: 'IoT telemetry endpoints' },
      { name: 'Events', description: 'Event log (admin only)' },
      { name: 'Reports', description: 'Report generation' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for user authentication',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for IoT device authentication',
        },
      },
    },
  },
  apis: ['./src/routers/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
