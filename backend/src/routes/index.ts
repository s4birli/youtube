import { FastifyInstance } from 'fastify';
import { youtubeRoutes } from './youtube.routes';

/**
 * Register all routes with the Fastify instance
 */
export function registerRoutes(fastify: ReturnType<typeof import('fastify').default>): void {
  // Register routes under /api prefix
  // Use type assertion to ensure the compiler knows this is a valid Fastify instance
  const typedFastify = fastify as unknown as FastifyInstance;

  void typedFastify.register(
    async (instance: FastifyInstance) => {
      // YouTube routes
      await instance.register(youtubeRoutes, { prefix: '/youtube' });

      // Additional route groups can be added here
    },
    { prefix: '/api' },
  );
}
