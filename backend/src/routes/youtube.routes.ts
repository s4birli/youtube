import { Router } from 'express';
import { youtubeController } from '../controllers/youtube.controller';

const router = Router();

/**
 * @route   POST /api/youtube/info
 * @desc    Get video information
 */
router.post('/info', youtubeController.getVideoInfo);

/**
 * @route   POST /api/youtube/formats
 * @desc    Get available video formats
 */
router.post('/formats', youtubeController.getVideoFormats);

/**
 * @route   POST /api/youtube/download
 * @desc    Download a video
 */
router.post('/download', youtubeController.downloadVideo);

/**
 * @route   GET /api/youtube/link/:videoId/:formatId
 * @desc    Get direct download link
 */
router.get('/link/:videoId/:formatId', youtubeController.getDownloadLink);

/**
 * @route   GET /api/youtube/download/:downloadId
 * @desc    Stream a downloaded file
 */
router.get('/download/:downloadId', youtubeController.streamDownload);

/**
 * @route   GET /api/youtube/progress/:downloadId
 * @desc    Get download progress
 */
router.get('/progress/:downloadId', youtubeController.getDownloadProgress);

export default router;
