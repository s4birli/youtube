import {
  VideoInfo,
  DownloadRequest,
  DownloadResponse,
  VideoFormatResponse,
  ProgressInfo,
} from '../domain/video';

/**
 * Interface for YouTube service
 * This enables dependency injection and makes testing easier
 */
export interface IYoutubeService {
  /**
   * Get video information from YouTube
   */
  getVideoInfo(url: string): Promise<VideoInfo>;

  /**
   * Get available video formats
   */
  getVideoFormats(url: string): Promise<VideoFormatResponse>;

  /**
   * Get direct download URL for a specific format
   */
  getDownloadUrl(videoId: string, formatId: string): Promise<string>;

  /**
   * Download a video with specified options
   */
  downloadVideo(options: DownloadRequest): Promise<DownloadResponse>;

  /**
   * Get a downloaded file details
   */
  getDownloadedFile(downloadId: string): Promise<{
    filepath: string;
    filename: string;
    contentType: string;
    filesize: number;
  }>;

  /**
   * Get download progress
   */
  getProgress(downloadId: string): ProgressInfo;
}
