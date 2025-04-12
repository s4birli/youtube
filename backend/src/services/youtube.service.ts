import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import ytDlpExec from 'yt-dlp-exec';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { cache } from '../config/cache';
import { AppError } from '../middleware/error-handler';
import {
  VideoInfo,
  DownloadRequest,
  DownloadResponse,
  VideoFormatResponse,
  ProgressInfo,
} from '../domain/video';
import { IYoutubeService } from '../interfaces/youtube.interface';

// Type for download progress tracking
interface DownloadProgress {
  id: string;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  filepath?: string;
  filesize?: number;
  contentType?: string;
  filename?: string;
  timestamp: number;
}

// In-memory store for progress tracking
// In a production app, this should be replaced with Redis or another external store
export const downloadProgress = new Map<string, DownloadProgress>();

/**
 * YouTube downloader service
 */
export class YoutubeService implements IYoutubeService {
  private readonly downloadDir: string;
  private activeDownloads: number;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.downloadDir = env.DOWNLOAD_TEMP_DIR;
    this.activeDownloads = 0;
    this.cleanupInterval = null;

    // Ensure download directory exists
    void this.ensureDownloadDir();

    // Start cleanup job
    this.startCleanupJob();
  }

  /**
   * Cleanup resources when the service is no longer needed (for testing)
   */
  public cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get video information
   */
  public async getVideoInfo(url: string): Promise<VideoInfo> {
    // Generate a cache key based on the URL
    const cacheKey = `video_info:${url}`;

    // Check if we have a cached version
    const cachedInfo = cache.get<VideoInfo>(cacheKey);
    if (cachedInfo) {
      logger.debug(`Using cached video info for URL: ${url}`);
      return cachedInfo;
    }

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      logger.debug(`Getting video info for URL: ${url}`);

      // Check for invalid URL format
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        logger.warn(`Invalid URL format: ${url}`);
        throw new AppError(400, 'Invalid URL. Please provide a valid YouTube URL.');
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('YouTube API request timed out after 15 seconds'));
        }, 15000);
      });

      // Race between the actual request and the timeout
      const result = await Promise.race([
        ytDlpExec(url, {
          dumpSingleJson: true,
          noCheckCertificate: true,
          noWarnings: true,
          socketTimeout: 10000,
        }),
        timeoutPromise,
      ]);

      // Clear the timeout if we got a result
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      logger.debug(`Video info result type: ${typeof result}`);

      // If we got a valid result, cache it and return it
      if (result && typeof result === 'object' && Object.keys(result).length > 0) {
        const typedResult = result as Record<string, unknown>;
        logger.debug(`Successfully retrieved video info for: ${String(typedResult.title)}`);

        // Cache the result - videos don't change often, so we can cache for 1 hour
        const videoInfo = result as unknown as VideoInfo;
        cache.set(cacheKey, videoInfo, 60 * 60); // Cache for 1 hour

        return videoInfo;
      }

      // If we didn't get a valid result, log the issue and throw an error
      logger.error(`YouTube API returned invalid or empty result for URL: ${url}`);
      throw new AppError(500, 'Failed to get video information from YouTube.');
    } catch (error) {
      // Clear the timeout if an error occurred
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Check for timeout error
      if (error instanceof Error && error.message.includes('timed out')) {
        logger.error(error, `YouTube API request timed out for URL: ${url}`);
        throw new AppError(504, 'Request to YouTube timed out. Please try again later.');
      }

      // If it's already an AppError, just rethrow it
      if (error instanceof AppError) {
        throw error;
      }

      logger.error(error, `Failed to get video info for ${url}`);
      throw new AppError(500, 'Failed to get video information. Please try again later.');
    }
  }

  /**
   * Get simplified video info with formats
   */
  public async getVideoFormats(url: string): Promise<VideoFormatResponse> {
    // Generate a cache key based on the URL
    const cacheKey = `video_formats:${url}`;

    // Check if we have a cached version
    const cachedFormats = cache.get<VideoFormatResponse>(cacheKey);
    if (cachedFormats) {
      logger.debug(`Using cached video formats for URL: ${url}`);
      return cachedFormats;
    }

    // Get full video info (which is itself cached)
    const videoInfo = await this.getVideoInfo(url);

    // Create the formats response
    const formats = {
      id: videoInfo.id,
      title: videoInfo.title,
      webpage_url: videoInfo.webpage_url,
      formats: videoInfo.formats,
      thumbnails: videoInfo.thumbnails,
    };

    // Cache the formats (shorter time since these can change more often)
    cache.set(cacheKey, formats, 30 * 60); // Cache for 30 minutes

    return formats;
  }

  /**
   * Get download URL for a specific format
   */
  public async getDownloadUrl(videoId: string, formatId: string): Promise<string> {
    // Generate a cache key
    const cacheKey = `download_url:${videoId}:${formatId}`;

    // Check if we have a cached URL
    const cachedUrl = cache.get<string>(cacheKey);
    if (cachedUrl) {
      logger.debug(`Using cached download URL for video ${videoId}, format ${formatId}`);
      return cachedUrl;
    }

    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const videoInfo = await this.getVideoInfo(url);

      const format = videoInfo.formats.find(f => f.format_id === formatId);

      if (!format || !format.url) {
        throw new AppError(404, `Format ${formatId} not found for video ${videoId}`);
      }

      // Cache the URL (short time as these expire)
      cache.set(cacheKey, format.url, 5 * 60); // Cache for 5 minutes

      return format.url;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error(error, `Failed to get download URL for video ${videoId}, format ${formatId}`);
      throw new AppError(500, 'Failed to get download URL. Please try again.');
    }
  }

  /**
   * Download video
   */
  public async downloadVideo(options: DownloadRequest): Promise<DownloadResponse> {
    const { videoUrl, formatId, extractAudio, audioFormat, quality } = options;

    // Generate unique ID for this download
    const downloadId = randomUUID();

    // Initialize progress tracking with current timestamp
    downloadProgress.set(downloadId, {
      id: downloadId,
      progress: 0,
      status: 'queued',
      timestamp: Date.now(),
    });

    try {
      // Check if we're at max concurrent downloads
      if (this.activeDownloads >= env.MAX_CONCURRENT_DOWNLOADS) {
        throw new AppError(429, 'Maximum concurrent downloads reached. Please try again later.');
      }

      // Get video info first
      const videoInfo = await this.getVideoInfo(videoUrl);

      // Update filename based on title and format
      const sanitizedTitle = this.sanitizeFilename(videoInfo.title);
      let outputFilename = `${sanitizedTitle}-${downloadId}`;
      let contentType = 'video/mp4';

      // Path to downloads subdirectory
      const downloadsDir = path.join(this.downloadDir, 'downloads');

      // Create options object for yt-dlp
      const dlOptions: Record<string, string | boolean | number | string[]> = {
        output: path.join(downloadsDir, `${outputFilename}.%(ext)s`),
        noCheckCertificate: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
        verbose: true,
      };

      // Format selection
      if (formatId && !extractAudio) {
        // Video download with specific format
        dlOptions.format = `${formatId}+bestaudio/best[ext=mp4]`;
        dlOptions.mergeOutputFormat = 'mp4';
        outputFilename = `${outputFilename}.mp4`;
      } else if (extractAudio) {
        // Audio extraction
        dlOptions.extractAudio = true;
        dlOptions.audioFormat = audioFormat || 'mp3';
        dlOptions.audioQuality = quality ? parseInt(quality, 10) : 0;
        contentType = `audio/${audioFormat || 'mp3'}`;
        outputFilename = `${outputFilename}.${audioFormat || 'mp3'}`;
      } else {
        // Default: best video and audio
        dlOptions.format = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
        dlOptions.mergeOutputFormat = 'mp4';
        dlOptions.postprocessorArgs = ['FFmpeg:-vcodec h264 -acodec aac'];
        outputFilename = `${outputFilename}.mp4`;
      }

      logger.debug(`yt-dlp options: ${JSON.stringify(dlOptions)}`);

      // Set up progress tracking
      downloadProgress.set(downloadId, {
        id: downloadId,
        progress: 0,
        status: 'processing',
        filename: outputFilename,
        contentType,
        timestamp: Date.now(),
      });

      // Increment active downloads
      this.activeDownloads++;

      try {
        // Ensure directory exists
        await fs.mkdir(downloadsDir, { recursive: true });

        // Use yt-dlp directly
        const result = await ytDlpExec(videoUrl, dlOptions);
        logger.debug('yt-dlp download result:', result);

        // Update progress to 50% after yt-dlp finishes
        downloadProgress.set(downloadId, {
          ...downloadProgress.get(downloadId)!,
          progress: 50,
          timestamp: Date.now(),
        });

        // Search for the downloaded file
        const files = await fs.readdir(downloadsDir);
        const downloadedFile = files.find(file => file.includes(downloadId));

        if (!downloadedFile) {
          throw new Error(
            `Download completed but no file found with ID ${downloadId}. Files in directory: ${files.join(', ')}`
          );
        }

        const filePath = path.join(downloadsDir, downloadedFile);

        // Add a delay to ensure file is fully written
        logger.debug(`Waiting for file to be fully written: ${filePath}`);
        // Wait 5 seconds to ensure file is fully written
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Update progress to 75%
        downloadProgress.set(downloadId, {
          ...downloadProgress.get(downloadId)!,
          progress: 75,
          timestamp: Date.now(),
        });

        // Verify file exists and has content
        const fileStats = await fs.stat(filePath);

        if (fileStats.size === 0) {
          logger.error(`Downloaded file is empty: ${filePath}`);
          throw new Error('Downloaded file is empty');
        }

        // Verify file is readable
        try {
          // Try to read the first few bytes to verify file is accessible
          const fd = await fs.open(filePath, 'r');
          const buffer = Buffer.alloc(1024);
          const { bytesRead } = await fd.read(buffer, 0, 1024, 0);
          await fd.close();

          if (bytesRead === 0) {
            logger.error(`File exists but cannot be read: ${filePath}`);
            throw new Error('File exists but cannot be read');
          }

          logger.debug(`Successfully verified file readability: ${filePath}`);
        } catch (readError) {
          logger.error(
            `Error verifying file readability: ${filePath}`,
            readError instanceof Error ? readError.message : String(readError)
          );
          throw new Error(
            `File verification failed: ${readError instanceof Error ? readError.message : String(readError)}`
          );
        }

        logger.info(
          `Download completed successfully. File: ${filePath}, Size: ${fileStats.size} bytes`
        );

        // Update progress info to completed
        downloadProgress.set(downloadId, {
          id: downloadId,
          progress: 100,
          status: 'completed',
          filepath: filePath,
          filesize: fileStats.size,
          filename: downloadedFile,
          contentType,
          timestamp: Date.now(),
        });

        // Return download response
        return {
          id: downloadId,
          title: videoInfo.title,
          downloadUrl: `/api/youtube/download/${downloadId}`,
          fileName: downloadedFile,
          contentType,
          fileSize: fileStats.size,
        };
      } catch (directError) {
        logger.error(directError, 'yt-dlp download failed with details:');
        throw directError;
      } finally {
        // Decrement active downloads
        this.activeDownloads--;
      }
    } catch (error) {
      // Update progress with error
      const errorMessage =
        error instanceof Error
          ? `${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`
          : 'Unknown error occurred';

      logger.error(error, `Download failed for ${videoUrl} with error: ${errorMessage}`);

      downloadProgress.set(downloadId, {
        id: downloadId,
        progress: 0,
        status: 'failed',
        error: errorMessage,
        timestamp: Date.now(),
      });

      if (error instanceof AppError) {
        throw error;
      }

      // Include more details in the error message
      throw new AppError(500, `Download failed: ${errorMessage}. Please try again later.`);
    }
  }

  /**
   * Get a downloaded file
   */
  public async getDownloadedFile(downloadId: string): Promise<{
    filepath: string;
    filename: string;
    contentType: string;
    filesize: number;
  }> {
    const progress = downloadProgress.get(downloadId);

    if (!progress) {
      throw new AppError(404, 'Download not found');
    }

    if (progress.status !== 'completed') {
      throw new AppError(400, `Download is not ready. Status: ${progress.status}`);
    }

    if (!progress.filepath || !progress.filename || !progress.contentType) {
      throw new AppError(500, 'Download information is incomplete');
    }

    try {
      // Check if file exists
      await fs.access(progress.filepath);

      return {
        filepath: progress.filepath,
        filename: progress.filename,
        contentType: progress.contentType,
        filesize: progress.filesize || 0,
      };
    } catch (error) {
      // If file not found in the progress map, try to find it in the downloads directory
      try {
        const downloadsDir = path.join(this.downloadDir, 'downloads');
        const files = await fs.readdir(downloadsDir);
        const downloadedFile = files.find(file => file.includes(downloadId));

        if (downloadedFile) {
          const filePath = path.join(downloadsDir, downloadedFile);
          const fileStats = await fs.stat(filePath);

          return {
            filepath: filePath,
            filename: downloadedFile,
            contentType: progress.contentType || 'application/octet-stream',
            filesize: fileStats.size,
          };
        }
      } catch (searchError) {
        // If search also fails, log it but don't change the primary error
        logger.error(searchError, `Failed to find alternative file for download ${downloadId}`);
      }

      logger.error(error, `File not found for download ${downloadId}`);
      throw new AppError(404, 'Download file not found');
    }
  }

  /**
   * Get download progress
   */
  public getProgress(downloadId: string): ProgressInfo {
    const progress = downloadProgress.get(downloadId);

    if (!progress) {
      throw new AppError(404, 'Download not found');
    }

    return progress as ProgressInfo;
  }

  /**
   * Ensure download directory exists
   */
  private async ensureDownloadDir(): Promise<void> {
    try {
      // Skip directory creation in test environment
      if (process.env.NODE_ENV === 'test') {
        logger.debug('Skipping directory creation in test environment');
        return;
      }

      // Create main data directory
      await fs.mkdir(this.downloadDir, { recursive: true });

      // Create downloads subdirectory
      const downloadsDir = path.join(this.downloadDir, 'downloads');
      await fs.mkdir(downloadsDir, { recursive: true });

      logger.info(`Download directory ensured at: ${this.downloadDir}`);
    } catch (error) {
      logger.error(error, 'Failed to create download directory');
      // Don't throw in constructor to prevent unhandled rejections
    }
  }

  /**
   * Start cleanup job to remove old downloads
   */
  private startCleanupJob(): void {
    const ONE_HOUR = 60 * 60 * 1000;

    // Skip cleanup in test environment
    if (process.env.NODE_ENV === 'test') {
      logger.debug('Skipping cleanup job in test environment');
      return;
    }

    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      void this.cleanupOldFiles();
    }, ONE_HOUR);

    logger.info('Download cleanup job scheduled');
  }

  /**
   * Cleanup old files to save disk space
   */
  private async cleanupOldFiles(): Promise<void> {
    try {
      const downloadsDir = path.join(this.downloadDir, 'downloads');

      // Check if directory exists before trying to read it
      try {
        await fs.access(downloadsDir);
      } catch (err) {
        // Create the directory if it doesn't exist
        await fs.mkdir(downloadsDir, { recursive: true });
        logger.info(`Created missing downloads directory at: ${downloadsDir}`);
        return; // No files to clean if directory was just created
      }

      const files = await fs.readdir(downloadsDir);
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(downloadsDir, file);
        const stats = await fs.stat(filePath);

        // Remove files older than 1 day
        if (now - stats.mtime.getTime() > ONE_DAY_MS) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Removed ${cleanedCount} old files during cleanup`);
      }
    } catch (error) {
      logger.error(error, 'Error during cleanup job');
    }
  }

  /**
   * Sanitize filename to be safe for filesystems
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[\\/:*?"<>|]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
  }

  /**
   * Get the resolution for a given format ID
   */
  private getResolution(selected: string): string {
    const resolutions = {
      '137': '1080p',
      '136': '720p',
      '18': '360p',
    };
    return resolutions[selected as keyof typeof resolutions] || 'Unknown';
  }
}
