import { Router } from 'express';
import youtubeRoutes from './youtube.routes';
import cacheRoutes from './cache.routes';
import metadataRoutes from './metadata.routes';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Register routes
router.use('/youtube', youtubeRoutes);
router.use('/cache', cacheRoutes);
router.use('/metadata', metadataRoutes);

export default router;
