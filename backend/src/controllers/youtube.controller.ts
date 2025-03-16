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

      // Verify file exists and has content
      try {
        const stat = fs.statSync(filepath);

        if (!stat.isFile()) {
          logger.error(`Path is not a file: ${filepath}`);
          throw new AppError(500, 'Invalid file path');
        }

        if (stat.size === 0) {
          logger.error(`File is empty: ${filepath}`);
          throw new AppError(500, 'Download file is empty');
        }

        logger.info(`Found file: ${filepath}, Size: ${stat.size} bytes`);
      } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`File not accessible: ${filepath}`, error instanceof Error ? error.message : String(error));
        throw new AppError(404, 'Download file not accessible');
      }

      // Get file extension
      const fileExt = path.extname(filename);

      // Create a clean filename (remove internal ID)
      const cleanFilename = filename.replace(/-[0-9a-f-]+\.(mp4|mp3)$/i, fileExt);
      const safeFilename = cleanFilename.replace(/[^\w.-]/g, '_');

      // CORS headers for file download
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');

      // Set proper content type
      res.header('Content-Type', contentType);

      // Set correct content disposition for download
      res.header(
        'Content-Disposition',
        `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
      );

      // Try using download method first
      try {
        logger.debug(`Sending file using res.download: ${filepath}`);
        return res.download(filepath, safeFilename, (err) => {
          if (err) {
            logger.error(`Error sending file via res.download: ${err.message}`);
            // Don't call next() here as we'll try the fallback method
          }
        });
      } catch (downloadError) {
        logger.error(`Exception in res.download: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`);
        // Continue to fallback methods
      }

      // Fallback 1: Try sendFile method
      try {
        logger.debug(`Trying res.sendFile: ${filepath}`);
        return res.sendFile(filepath, {
          headers: {
            'Content-Disposition': `attachment; filename="${safeFilename}"`,
            'Content-Type': contentType
          }
        });
      } catch (sendFileError) {
        logger.error(`Exception in res.sendFile: ${sendFileError instanceof Error ? sendFileError.message : String(sendFileError)}`);
        // Continue to final fallback
      }

      // Fallback 2: Use pipe method as a last resort
      logger.debug(`Using createReadStream as final fallback`);
      const fileStream = fs.createReadStream(filepath);

      // Explicitly get file size for Content-Length header
      const stat = fs.statSync(filepath);
      res.header('Content-Length', stat.size.toString());

      // Handle stream errors
      fileStream.on('error', (error) => {
        logger.error(`Error in read stream: ${error.message}`);
        if (!res.headersSent) {
          next(new AppError(500, 'Error streaming file'));
        }
      });

      // Log when streaming completes
      fileStream.on('end', () => {
        logger.debug(`Successfully completed streaming file: ${filepath}`);
      });

      // Pipe the file to the response
      fileStream.pipe(res);
    } catch (error) {
      logger.error(`Error in streamDownload: ${error instanceof Error ? error.message : String(error)}`);
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
