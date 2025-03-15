import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { IDownloadRepository } from '../interfaces/download.repository.interface';
import { MemoryDownloadRepository } from '../repositories/memory.download.repository';

/**
 * Options for the download tracker plugin
 */
export interface DownloadTrackerOptions {
  cleanupIntervalMs?: number;
  maxAgeMs?: number;
  repository?: IDownloadRepository;
}

/**
 * Download tracker plugin for Fastify
 * Provides decorations to track and manage downloads
 * Using proper typing for the Fastify instance
 */
const downloadTrackerPlugin: FastifyPluginAsync<DownloadTrackerOptions> = async (
  fastify,
  options: DownloadTrackerOptions,
) => {
  // Default options
  const cleanupIntervalMs = options.cleanupIntervalMs || 60 * 60 * 1000; // 1 hour
  const maxAgeMs = options.maxAgeMs || 24 * 60 * 60 * 1000; // 1 day

  // Use provided repository or create a new in-memory one
  const downloadRepository = options.repository || new MemoryDownloadRepository();

  // Decorate fastify instance with downloadRepository
  fastify.decorate('downloadRepository', downloadRepository);

  // Set up cleanup interval
  const cleanup = async (): Promise<void> => {
    try {
      const count = await downloadRepository.cleanupOldDownloads(maxAgeMs);
      if (count > 0) {
        fastify.log.info(`Cleaned up ${count} old downloads`);
      }
    } catch (error) {
      fastify.log.error(error, 'Error cleaning up old downloads');
    }
  };

  // Start cleanup interval
  const intervalId = setInterval(cleanup, cleanupIntervalMs);

  // Clean up on shutdown
  fastify.addHook('onClose', async () => {
    clearInterval(intervalId);
  });
};

// Export the plugin with fastify-plugin to make it available across scopes
export default fp(downloadTrackerPlugin, {
  name: 'download-tracker',
  fastify: '4.x',
});
