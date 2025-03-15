import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import youtubeDl from 'youtube-dl-exec';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../middlewares/error-handler';
import {
  VideoInfo,
  VideoFormat,
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
const downloadProgress = new Map<string, DownloadProgress>();

/**
 * YouTube downloader service
 */
export class YoutubeService implements IYoutubeService {
  private readonly downloadDir: string;
  private activeDownloads: number;

  constructor() {
    this.downloadDir = env.DOWNLOAD_TEMP_DIR;
    this.activeDownloads = 0;

    // Ensure download directory exists
    void this.ensureDownloadDir();

    // Start cleanup job
    this.startCleanupJob();
  }

  /**
   * Get video information
   */
  public async getVideoInfo(url: string): Promise<VideoInfo> {
    try {
      // Use options directly compatible with youtube-dl-exec
      const result = await youtubeDl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
      });

      return result as unknown as VideoInfo;
    } catch (error) {
      logger.error(error, `Failed to get video info for ${url}`);
      throw new AppError(
        400,
        'Failed to get video information. Please check the URL and try again.',
      );
    }
  }

  /**
   * Get simplified video info with formats
   */
  public async getVideoFormats(url: string): Promise<VideoFormatResponse> {
    const videoInfo = await this.getVideoInfo(url);

    return {
      id: videoInfo.id,
      title: videoInfo.title,
      webpage_url: videoInfo.webpage_url,
      formats: videoInfo.formats,
      thumbnails: videoInfo.thumbnails,
    };
  }

  /**
   * Get download URL for a specific format
   */
  public async getDownloadUrl(videoId: string, formatId: string): Promise<string> {
    try {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      const videoInfo = await this.getVideoInfo(url);

      const format = videoInfo.formats.find((f) => f.format_id === formatId);

      if (!format || !format.url) {
        throw new AppError(404, `Format ${formatId} not found for video ${videoId}`);
      }

      return format.url;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error(error, `Failed to get download URL for video ${videoId}, format ${formatId}`);
      throw new AppError(400, 'Failed to get download URL. Please try again.');
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
      let selectedFormat: VideoFormat | undefined;

      // Find the format if formatId is specified
      if (formatId) {
        selectedFormat = videoInfo.formats.find((f) => f.format_id === formatId);
        if (!selectedFormat) {
          throw new AppError(404, `Format ${formatId} not found`);
        }
      }

      // Update filename based on title and format
      const sanitizedTitle = this.sanitizeFilename(videoInfo.title);
      let outputFilename = `${sanitizedTitle}-${downloadId}`;
      let contentType = 'video/mp4';

      // Create options object
      const dlOptions: Record<string, string | boolean | number | string[]> = {
        output: path.join(this.downloadDir, `${outputFilename}.%(ext)s`),
        noCheckCertificates: true,
        noWarnings: true,
        addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0'],
      };

      // Handle format selection
      if (formatId && !extractAudio) {
        dlOptions.format = formatId;
      } else if (extractAudio) {
        dlOptions.extractAudio = true;
        dlOptions.audioFormat = audioFormat || 'mp3';
        // Convert quality to number (0 is best)
        dlOptions.audioQuality = quality ? parseInt(quality, 10) : 0;
        contentType = `audio/${audioFormat || 'mp3'}`;
        outputFilename = `${outputFilename}.${audioFormat || 'mp3'}`;
      } else {
        // Default: best video with audio
        dlOptions.format = 'best';
        outputFilename = `${outputFilename}.mp4`;
      }

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
        // Start download process
        await youtubeDl(videoUrl, dlOptions);

        // Find the downloaded file
        const files = await fs.readdir(this.downloadDir);
        const downloadedFile = files.find((file) => file.includes(downloadId));

        if (!downloadedFile) {
          throw new Error('Downloaded file not found');
        }

        const filePath = path.join(this.downloadDir, downloadedFile);
        const fileStats = await fs.stat(filePath);

        // Update progress info
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
          downloadUrl: `/api/download/${downloadId}`,
          fileName: downloadedFile,
          contentType,
          fileSize: fileStats.size,
        };
      } finally {
        // Decrement active downloads
        this.activeDownloads--;
      }
    } catch (error) {
      // Update progress with error
      downloadProgress.set(downloadId, {
        id: downloadId,
        progress: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now(),
      });

      logger.error(error, `Download failed for ${videoUrl}`);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(500, 'Download failed. Please try again later.');
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
      await fs.mkdir(this.downloadDir, { recursive: true });
    } catch (error) {
      logger.error(error, 'Failed to create download directory');
      throw new Error('Failed to create download directory');
    }
  }

  /**
   * Start cleanup job to remove old downloads
   */
  private startCleanupJob(): void {
    const ONE_HOUR = 60 * 60 * 1000;

    // Run cleanup every hour
    setInterval(() => {
      void this.cleanupOldFiles();
    }, ONE_HOUR);
  }

  /**
   * Cleanup old files to save disk space
   */
  private async cleanupOldFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.downloadDir);
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.downloadDir, file);
        const stats = await fs.stat(filePath);

        // Remove files older than 1 day
        if (now - stats.mtime.getTime() > ONE_DAY_MS) {
          await fs.unlink(filePath);
          logger.info(`Removed old file: ${file}`);
        }
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
}
