import { Router } from 'express';
import { CacheController } from '../controllers/cache.controller';

const router = Router();
const cacheController = new CacheController();

// GET /api/cache/stats - Get cache statistics
router.get('/stats', cacheController.getCacheStats);

// DELETE /api/cache - Clear entire cache
router.delete('/', cacheController.clearCache);

// DELETE /api/cache/video/:videoId - Clear cache for a specific video
router.delete('/video/:videoId', cacheController.clearVideoCache);

export default router;
