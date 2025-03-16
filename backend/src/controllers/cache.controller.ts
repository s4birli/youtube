import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { cache } from '../config/cache';

/**
 * Controller for cache management
 */
export class CacheController {
  /**
   * Clear the entire cache
   */
  public async clearCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Clearing cache');
      cache.clear();
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear cache for a specific video
   */
  public async clearVideoCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { videoId } = req.params;
      logger.info(`Clearing cache for video: ${videoId}`);

      // Clear possible cache keys for this video
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      cache.delete(`video_info:${url}`);
      cache.delete(`video_formats:${url}`);

      // Also try to clear any format URLs
      // Since format IDs can vary, we'll use the cleanup method to clear all expired items
      cache.cleanup();

      res.json({ message: `Cache cleared for video: ${videoId}` });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cache statistics
   */
  public async getCacheStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // This is a simple implementation. For a real app, you would expose more metrics.
      const stats = {
        enabled: true,
        ttl: process.env.CACHE_TTL || '1800',
        maxItems: process.env.CACHE_MAX_ITEMS || '100',
      };

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
