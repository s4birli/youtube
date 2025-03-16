import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../config/logger';
import { MetadataFields, MetadataService } from '../services/metadata.service';
import { downloadProgress } from '../services/youtube.service';
import { AppError } from '../middleware/error-handler';

// Create an instance of the metadata service
const metadataService = new MetadataService();

/**
 * Validate request body
 */
function validateBody<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(400, `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw new AppError(400, 'Invalid request body');
  }
}

/**
 * Controller for handling metadata operations
 */
export class MetadataController {
  /**
   * Get metadata for a downloaded file
   */
  public async getMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { downloadId } = req.params;
      logger.debug(`Getting metadata for download: ${downloadId}`);

      // Find the download by ID
      const download = this.getDownloadById(downloadId);

      // Read metadata
      const result = await metadataService.readMetadata(download.filepath);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update metadata for a downloaded file
   */
  public async updateMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { downloadId } = req.params;
      logger.debug(`Updating metadata for download: ${downloadId}`);

      // Validate request body
      const metadataSchema = z.object({
        title: z.string().optional(),
        artist: z.string().optional(),
        album: z.string().optional(),
        year: z.string().optional(),
        genre: z.string().optional(),
        comment: z.string().optional(),
        track: z.string().optional(),
        description: z.string().optional(),
        copyright: z.string().optional(),
        language: z.string().optional(),
      });

      const metadata = validateBody<MetadataFields>(metadataSchema, req.body);

      // Find the download by ID
      const download = this.getDownloadById(downloadId);

      // Update metadata
      const result = await metadataService.editMetadata(download.filepath, metadata);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper function to get download info by ID
   */
  private getDownloadById(downloadId: string): { filepath: string; filename: string } {
    // Get download info from progress map
    const progress = downloadProgress.get(downloadId);

    if (!progress) {
      throw new AppError(404, 'Download not found');
    }

    if (progress.status !== 'completed') {
      throw new AppError(400, `Download is not ready. Status: ${progress.status}`);
    }

    if (!progress.filepath || !progress.filename) {
      throw new AppError(500, 'Download information is incomplete');
    }

    return {
      filepath: progress.filepath,
      filename: progress.filename,
    };
  }
}
