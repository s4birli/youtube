import fs from 'fs/promises';
import { logger } from '../config/logger';
import { WorkerPool } from './worker-pool.service';

/**
 * Metadata fields that can be edited
 */
export interface MetadataFields {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  comment?: string;
  track?: string;
  description?: string;
  copyright?: string;
  language?: string;
}

/**
 * Response from metadata operations
 */
export interface MetadataResponse {
  success: boolean;
  filepath: string;
  message: string;
  metadata?: MetadataFields;
}

// Create a worker pool instance
const workerPool = new WorkerPool();

/**
 * Service for reading and modifying file metadata
 */
export class MetadataService {
  /**
   * Read metadata from a file
   * @param filepath Path to the file
   * @returns Promise with metadata information
   */
  public async readMetadata(filepath: string): Promise<MetadataResponse> {
    try {
      // Check if file exists
      await fs.access(filepath);

      // Use worker thread for metadata reading
      logger.debug(`Starting metadata read worker for ${filepath}`);

      const result = await workerPool.runTask({
        taskType: 'metadata',
        taskData: {
          taskType: 'read',
          filepath,
        },
      });

      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : 'Failed to read metadata in worker thread'
        );
      }

      return {
        success: true,
        filepath,
        message: 'Metadata retrieved successfully',
        metadata: result.metadata as MetadataFields,
      };
    } catch (error) {
      logger.error(error, `Failed to read metadata for ${filepath}`);
      return {
        success: false,
        filepath,
        message: error instanceof Error ? error.message : 'Unknown error reading metadata',
      };
    }
  }

  /**
   * Edit metadata of a file
   * @param filepath Path to the file
   * @param metadata Metadata fields to update
   * @returns Promise with operation result
   */
  public async editMetadata(filepath: string, metadata: MetadataFields): Promise<MetadataResponse> {
    try {
      // Check if file exists
      await fs.access(filepath);

      // Use worker thread for metadata editing
      logger.debug(`Starting metadata edit worker for ${filepath}`);

      const result = await workerPool.runTask({
        taskType: 'metadata',
        taskData: {
          taskType: 'edit',
          filepath,
          metadata,
        },
      });

      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : 'Failed to edit metadata in worker thread'
        );
      }

      return {
        success: true,
        filepath,
        message: 'Metadata updated successfully',
        metadata: result.metadata as MetadataFields,
      };
    } catch (error) {
      logger.error(error, `Failed to edit metadata for ${filepath}`);
      return {
        success: false,
        filepath,
        message: error instanceof Error ? error.message : 'Unknown error editing metadata',
      };
    }
  }
}
