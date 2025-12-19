import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import workflowRoutes from './routes/workflows.js';
import executionRoutes from './routes/executions.js';
import apiKeyRoutes from './routes/api-keys.js';
import { logger } from './lib/logger.js';

dotenv.config();

const fastify = Fastify({
  logger: true,
  trustProxy: true,
});

export const db = new PrismaClient();

// Register plugins
fastify.register(fastifyCors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  sign: { expiresIn: '7d' },
});

fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '15 minutes',
});

// Register routes
fastify.register(workflowRoutes, { prefix: '/api' });
fastify.register(executionRoutes, { prefix: '/api' });
fastify.register(apiKeyRoutes, { prefix: '/api' });

// Health check
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  };
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  logger.error(error);
  reply.status(error.statusCode || 500).send({
    statusCode: error.statusCode || 500,
    message: error.message,
    error: process.env.NODE_ENV === 'development' ? error : undefined,
  });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    logger.info(`✅ WorkflowAI Backend running on http://localhost:${port}`);
    logger.info('📡 API Keys managed through UI - no .env needed!');
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
