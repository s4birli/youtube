import { Router } from 'express';
import { saveYouTubeCookies } from '../controllers/cookies.controller';

const router = Router();

// POST /api/cookies/youtube - Save YouTube cookies
router.post('/youtube', saveYouTubeCookies);

export default router; 