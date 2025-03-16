import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { ZodError, z } from 'zod';
import { YoutubeService } from '../services/youtube.service';
import { videoUrlSchema, downloadOptionsSchema } from '../schemas/video.schema';
import { AppError } from '../middleware/error-handler';
import { logger } from '../config/logger';
import { DownloadRequest } from '../domain/video';

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
      res.json(videoInfo);
    } catch (error) {
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
        res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

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
        res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

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
}

// Export controller instance
export const youtubeController = new YoutubeController();
