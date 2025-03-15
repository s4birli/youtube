import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import { z } from 'zod';
import { YoutubeService } from '../services/youtube.service';
import { videoUrlSchema, downloadOptionsSchema } from '../schemas/video.schema';
import { AppError } from '../middlewares/error-handler';
import { logger } from '../config/logger';

// Initialize services
const youtubeService = new YoutubeService();

/**
 * Controller for YouTube video operations
 */
export class YoutubeController {
  /**
   * Get video information
   */
  public async getVideoInfo(
    request: FastifyRequest<{ Body: z.infer<typeof videoUrlSchema> }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { url } = request.body;
    const videoInfo = await youtubeService.getVideoInfo(url);

    await reply.send(videoInfo);
  }

  /**
   * Get available formats for a video
   */
  public async getVideoFormats(
    request: FastifyRequest<{ Body: z.infer<typeof videoUrlSchema> }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { url } = request.body;
    const formats = await youtubeService.getVideoFormats(url);

    await reply.send(formats);
  }

  /**
   * Download a video
   */
  public async downloadVideo(
    request: FastifyRequest<{ Body: z.infer<typeof downloadOptionsSchema> }>,
    reply: FastifyReply,
  ): Promise<void> {
    const options = request.body;
    const result = await youtubeService.downloadVideo(options);

    await reply.send(result);
  }

  /**
   * Get a direct download link for a specific format
   */
  public async getDownloadLink(
    request: FastifyRequest<{
      Params: { videoId: string; formatId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { videoId, formatId } = request.params;

    try {
      const downloadUrl = await youtubeService.getDownloadUrl(videoId, formatId);
      await reply.send({ downloadUrl });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error(error, `Failed to get download link for video ${videoId}, format ${formatId}`);
      throw new AppError(400, 'Failed to get download link. Please try again.');
    }
  }

  /**
   * Stream a downloaded file
   */
  public async streamDownload(
    request: FastifyRequest<{
      Params: { downloadId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { downloadId } = request.params;

    try {
      const { filepath, filename, contentType, filesize } =
        await youtubeService.getDownloadedFile(downloadId);

      // Set appropriate headers for download
      void reply.header('Content-Type', contentType);
      void reply.header(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`,
      );
      void reply.header('Content-Length', filesize.toString());

      // Stream the file
      const fileStream = fs.createReadStream(filepath);
      await reply.send(fileStream);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error(error, `Error streaming file for download ${downloadId}`);
      throw new AppError(500, 'Failed to stream download. Please try again.');
    }
  }

  /**
   * Get download progress
   */
  public async getDownloadProgress(
    request: FastifyRequest<{
      Params: { downloadId: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> {
    const { downloadId } = request.params;

    try {
      const progress = youtubeService.getProgress(downloadId);
      await reply.send(progress);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error(error, `Error getting progress for download ${downloadId}`);
      throw new AppError(500, 'Failed to get download progress');
    }
  }
}

// Export controller instance
export const youtubeController = new YoutubeController();
