import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export default async function workflowRoutes(fastify: FastifyInstance) {
  // Create workflow
  fastify.post<{ Body: any }>('/workflows', async (request, reply) => {
    try {
      const { name, description, nodes, connections } = request.body;

      const workflow = await db.workflow.create({
        data: {
          name,
          description,
          createdBy: 'default-user', // TODO: Get from JWT
          nodes: {
            create: nodes.map((node: any) => ({
              type: node.type,
              kind: node.kind,
              name: node.name,
              positionX: node.position.x,
              positionY: node.position.y,
              config: node.config,
            })),
          },
          connections: {
            create: connections.map((conn: any) => ({
              sourceNodeId: conn.sourceNodeId,
              sourceOutput: conn.sourceOutput,
              targetNodeId: conn.targetNodeId,
              targetInput: conn.targetInput,
            })),
          },
        },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return { success: true, workflow };
    } catch (error) {
      fastify.log.error(error);
      reply.status(400).send({ error: 'Failed to create workflow' });
    }
  });

  // Get workflow
  fastify.get<{ Params: { id: string } }>(
    '/workflows/:id',
    async (request, reply) => {
      const { id } = request.params;

      const workflow = await db.workflow.findUnique({
        where: { id },
        include: {
          nodes: true,
          connections: true,
        },
      });

      if (!workflow) {
        return reply.status(404).send({ error: 'Workflow not found' });
      }

      return workflow;
    }
  );

  // List workflows
  fastify.get('/workflows', async (request, reply) => {
    const workflows = await db.workflow.findMany({
      include: {
        nodes: true,
        connections: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return workflows;
  });

  // Update workflow
  fastify.put<{ Params: { id: string }; Body: any }>(
    '/workflows/:id',
    async (request, reply) => {
      const { id } = request.params;
      const { name, description, nodes, connections } = request.body;

      try {
        // Delete old nodes and connections
        await db.workflowNode.deleteMany({ where: { workflowId: id } });
        await db.workflowConnection.deleteMany({ where: { workflowId: id } });

        // Update workflow
        const workflow = await db.workflow.update({
          where: { id },
          data: {
            name,
            description,
            version: { increment: 1 },
            nodes: {
              create: nodes.map((node: any) => ({
                type: node.type,
                kind: node.kind,
                name: node.name,
                positionX: node.position.x,
                positionY: node.position.y,
                config: node.config,
              })),
            },
            connections: {
              create: connections.map((conn: any) => ({
                sourceNodeId: conn.sourceNodeId,
                sourceOutput: conn.sourceOutput,
                targetNodeId: conn.targetNodeId,
                targetInput: conn.targetInput,
              })),
            },
          },
          include: {
            nodes: true,
            connections: true,
          },
        });

        return { success: true, workflow };
      } catch (error) {
        fastify.log.error(error);
        reply.status(400).send({ error: 'Failed to update workflow' });
      }
    }
  );

  // Delete workflow
  fastify.delete<{ Params: { id: string } }>(
    '/workflows/:id',
    async (request, reply) => {
      const { id } = request.params;

      await db.workflow.delete({ where: { id } });

      return { success: true };
    }
  );

  // Execute workflow
  fastify.post<{ Params: { id: string }; Body: any }>(
    '/workflows/:id/execute',
    async (request, reply) => {
      const { id } = request.params;
      const { input } = request.body;

      try {
        const workflow = await db.workflow.findUnique({
          where: { id },
          include: { nodes: true, connections: true },
        });

        if (!workflow) {
          return reply.status(404).send({ error: 'Workflow not found' });
        }

        // Create execution record
        const execution = await db.execution.create({
          data: {
            workflowId: id,
            status: 'running',
            trigger: 'manual',
          },
        });

        // TODO: Queue execution
        // executeWorkflow(id, execution.id, input);

        return {
          success: true,
          execution: { id: execution.id, status: execution.status },
        };
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: 'Failed to execute workflow' });
      }
    }
  );
}
