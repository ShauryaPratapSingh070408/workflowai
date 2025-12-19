import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import workflowRoutes from './routes/workflows.js';
import executionRoutes from './routes/executions.js';
import settingsRoutes from './routes/settings.js';
import { logger } from './lib/logger.js';

dotenv.config();

const fastify = Fastify({
  logger: true,
  trustProxy: true,
});

export const db = new PrismaClient();
export const app = fastify;

// Register plugins
fastify.register(fastifyCors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

// Register routes
fastify.register(workflowRoutes, { prefix: '/api' });
fastify.register(executionRoutes, { prefix: '/api' });
fastify.register(settingsRoutes, { prefix: '/api' });

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  logger.error(error);
  reply.status(error.statusCode || 500).send({
    statusCode: error.statusCode || 500,
    message: error.message,
    error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' });
    logger.info('✅ Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await fastify.close();
  await db.$disconnect();
  process.exit(0);
});
