import {
  VideoInfo,
  VideoFormatResponse,
  DownloadRequest,
  DownloadResponse,
  ProgressInfo,
} from '../domain/video';

/**
 * Interface for YouTube service
 */
export interface IYoutubeService {
  /**
   * Get information about a YouTube video
   */
  getVideoInfo(url: string): Promise<VideoInfo>;

  /**
   * Get available formats for a YouTube video
   */
  getVideoFormats(url: string): Promise<VideoFormatResponse>;

  /**
   * Get download URL for a specific format
   */
  getDownloadUrl(videoId: string, formatId: string): Promise<string>;

  /**
   * Download a YouTube video
   */
  downloadVideo(options: DownloadRequest): Promise<DownloadResponse>;

  /**
   * Get progress for a download
   */
  getProgress(downloadId: string): ProgressInfo;

  /**
   * Get a downloaded file
   */
  getDownloadedFile(downloadId: string): Promise<{
    filepath: string;
    filename: string;
    contentType: string;
    filesize: number;
  }>;
}
