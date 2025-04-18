import { Router } from 'express';
import youtubeRoutes from './youtube.routes';
import metadataRoutes from './metadata.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/youtube', youtubeRoutes);
router.use('/metadata', metadataRoutes);

export default router;
