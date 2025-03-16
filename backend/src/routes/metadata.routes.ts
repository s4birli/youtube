import { Router } from 'express';
import { MetadataController } from '../controllers/metadata.controller';

const router = Router();
const metadataController = new MetadataController();

// GET /api/metadata/:downloadId - Get metadata for a download
router.get('/:downloadId', metadataController.getMetadata.bind(metadataController));

// PUT /api/metadata/:downloadId - Update metadata for a download
router.put('/:downloadId', metadataController.updateMetadata.bind(metadataController));

export default router;
