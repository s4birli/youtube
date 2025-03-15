import { ProgressInfo } from '../domain/video';

/**
 * Interface for download repository
 * Abstracts storage mechanism for download progress and files
 */
export interface IDownloadRepository {
  /**
   * Save download progress information
   */
  saveProgress(id: string, progress: ProgressInfo): Promise<void>;

  /**
   * Get download progress information
   */
  getProgress(id: string): Promise<ProgressInfo | null>;

  /**
   * Delete download information
   */
  deleteDownload(id: string): Promise<boolean>;

  /**
   * List all downloads with optional filter
   */
  listDownloads(filter?: { status?: string }): Promise<ProgressInfo[]>;

  /**
   * Clean up old downloads
   */
  cleanupOldDownloads(olderThanMs: number): Promise<number>;
}
