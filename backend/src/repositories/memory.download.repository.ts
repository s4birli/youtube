import { ProgressInfo } from '../domain/video';
import { IDownloadRepository } from '../interfaces/download.repository.interface';

/**
 * In-memory implementation of download repository
 * For production, this should be replaced with a persistent storage solution
 */
export class MemoryDownloadRepository implements IDownloadRepository {
  private downloads: Map<string, ProgressInfo>;

  constructor() {
    this.downloads = new Map<string, ProgressInfo>();
  }

  /**
   * Save download progress information
   */
  public async saveProgress(id: string, progress: ProgressInfo): Promise<void> {
    // Always add a timestamp to ensure it's present
    const updatedProgress = {
      ...progress,
      timestamp: progress.timestamp || Date.now(),
    };
    this.downloads.set(id, updatedProgress);
  }

  /**
   * Get download progress information
   */
  public async getProgress(id: string): Promise<ProgressInfo | null> {
    const progress = this.downloads.get(id);
    return progress ? { ...progress } : null;
  }

  /**
   * Delete download information
   */
  public async deleteDownload(id: string): Promise<boolean> {
    return this.downloads.delete(id);
  }

  /**
   * List all downloads with optional filter
   */
  public async listDownloads(filter?: { status?: string }): Promise<ProgressInfo[]> {
    const downloads = Array.from(this.downloads.values());

    if (filter?.status) {
      return downloads.filter((download) => download.status === filter.status);
    }

    return downloads;
  }

  /**
   * Clean up old downloads
   */
  public async cleanupOldDownloads(olderThanMs: number): Promise<number> {
    const now = Date.now();
    let count = 0;

    for (const [id, download] of this.downloads.entries()) {
      // Ensure we have a timestamp to compare against
      const timestamp = download.timestamp ?? now;

      if (now - timestamp > olderThanMs) {
        this.downloads.delete(id);
        count++;
      }
    }

    return count;
  }
}
