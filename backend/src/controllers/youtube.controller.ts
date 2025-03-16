import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { ZodError, z } from 'zod';
import { YoutubeService } from '../services/youtube.service';
import { videoUrlSchema, downloadOptionsSchema } from '../schemas/video.schema';
import { AppError } from '../middleware/error-handler';
import { logger } from '../config/logger';
import { DownloadRequest, VideoInfo } from '../domain/video';
import path from 'path';

// Initialize services
const youtubeService = new YoutubeService();

/**
 * Validate request body against a schema
 */
function validateBody<T>(schema: z.ZodSchema, body: unknown): T {
  try {
    return schema.parse(body) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.errors.map(err => `${err.path}: ${err.message}`).join(', ');
      throw new AppError(400, `Validation error: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Transform backend VideoInfo to frontend compatible format
 */
function transformVideoInfoToResponse(videoInfo: VideoInfo) {
  // Get the best thumbnail
  const bestThumbnail = videoInfo.thumbnails?.length ? videoInfo.thumbnails[0].url : '';

  return {
    id: videoInfo.id,
    formats: videoInfo.formats,
    videoDetails: {
      id: videoInfo.id,
      title: videoInfo.title,
      description: videoInfo.description || '',
      duration: videoInfo.duration || 0,
      thumbnail: bestThumbnail,
      uploadDate: videoInfo.upload_date || '',
      views: videoInfo.view_count || 0,
      author: videoInfo.uploader || ''
    }
  };
}

/**
 * Controller for YouTube video operations
 */
export class YoutubeController {
  /**
   * Get video information
   */
  public async getVideoInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = validateBody<{ url: string }>(videoUrlSchema, req.body);
      const { url } = result;
      logger.debug(`Getting video info for URL: ${url}`);

      const videoInfo = await youtubeService.getVideoInfo(url);
      logger.debug(`Video info retrieved successfully`);

      // Transform to frontend-compatible format
      const responseData = transformVideoInfoToResponse(videoInfo);
      logger.debug(`Transformed video info for frontend`);

      res.json(responseData);
    } catch (error) {
      logger.error(`Error in getVideoInfo: ${error}`);
      next(error);
    }
  }

  /**
   * Get available formats for a video
   */
  public async getVideoFormats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = validateBody<{ url: string }>(videoUrlSchema, req.body);
      const { url } = result;
      logger.debug(`Getting video formats for URL: ${url}`);

      const formats = await youtubeService.getVideoFormats(url);
      res.json(formats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download a video
   */
  public async downloadVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = validateBody<DownloadRequest>(downloadOptionsSchema, req.body);
      logger.debug(`Starting download for URL: ${options.videoUrl}`);

      const result = await youtubeService.downloadVideo(options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a direct download link for a specific format
   */
  public async getDownloadLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { videoId, formatId } = req.params;
      logger.debug(`Getting download link for video: ${videoId}, format: ${formatId}`);

      const downloadUrl = await youtubeService.getDownloadUrl(videoId, formatId);
      res.json({ downloadUrl });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stream a downloaded file
   */
  public async streamDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { downloadId } = req.params;
      logger.debug(`Streaming download: ${downloadId}`);

      const { filepath, filename, contentType } =
        await youtubeService.getDownloadedFile(downloadId);

      const stat = fs.statSync(filepath);
      const fileSize = stat.size;

      // Set a simplified filename to avoid browser issues
      const safeFilename = filename.replace(/[^\w.-]/g, '_');

      // Get file extension
      const fileExt = path.extname(safeFilename);
      // Create a clean filename (remove internal ID)
      const cleanFilename = safeFilename.replace(/-[0-9a-f-]+\.(mp4|mp3)$/i, fileExt);

      // Additional CORS headers for file download
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');

      // Parse Range header
      const range = req.headers.range;

      if (range) {
        // Range request
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        logger.debug(`Range request for ${downloadId}: ${start}-${end}/${fileSize}`);

        // Set headers for partial content
        res.status(206);
        res.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.header('Accept-Ranges', 'bytes');
        res.header('Content-Length', chunkSize.toString());
        res.header('Content-Type', contentType);

        // Improved content disposition - using both standard and UTF-8 encoded version for better browser compatibility
        res.header(
          'Content-Disposition',
          `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
        );

        // Create read stream with range
        const fileStream = fs.createReadStream(filepath, { start, end });
        fileStream.pipe(res);
      } else {
        // No range request, stream the whole file
        logger.debug(`Full file stream for ${downloadId}: ${fileSize} bytes`);

        // Set headers
        res.header('Accept-Ranges', 'bytes');
        res.header('Content-Length', fileSize.toString());
        res.header('Content-Type', contentType);

        // Improved content disposition - using both standard and UTF-8 encoded version for better browser compatibility
        res.header(
          'Content-Disposition',
          `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
        );

        // Stream the file
        const fileStream = fs.createReadStream(filepath);

        // Handle errors in stream
        fileStream.on('error', error => {
          logger.error(error, `Error streaming file ${filepath}`);
          if (!res.headersSent) {
            next(new AppError(500, 'Error streaming file'));
          }
        });

        fileStream.pipe(res);
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get download progress
   */
  public async getDownloadProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { downloadId } = req.params;
      logger.debug(`Getting progress for download: ${downloadId}`);

      const progress = youtubeService.getProgress(downloadId);
      res.json(progress);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download a video as MP3
   */
  public async downloadMP3(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = validateBody<{ url: string }>(videoUrlSchema, req.body);
      logger.debug(`Starting MP3 download for URL: ${url}`);

      // Create download options with audio extraction
      const options: DownloadRequest = {
        videoUrl: url,
        extractAudio: true,
        audioFormat: 'mp3',
        quality: '0'  // Best quality
      };

      const result = await youtubeService.downloadVideo(options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

// Export controller instance
export const youtubeController = new YoutubeController();
