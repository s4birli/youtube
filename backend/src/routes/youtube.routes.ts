import { FastifyInstance } from 'fastify';
import { youtubeController } from '../controllers/youtube.controller';
import {
  videoUrlJsonSchema,
  downloadOptionsJsonSchema,
  formatIdParamSchema,
} from '../schemas/video.schema';

/**
 * YouTube routes
 */
export async function youtubeRoutes(
  fastify: ReturnType<typeof import('fastify').default>,
): Promise<void> {
  // Type cast to ensure TypeScript knows this is a valid Fastify instance
  const typedFastify = fastify as unknown as FastifyInstance;

  // Get video info
  typedFastify.post(
    '/info',
    {
      schema: {
        description: 'Get information about a YouTube video',
        tags: ['YouTube'],
        summary: 'Get video information',
        body: videoUrlJsonSchema.body,
        response: {
          200: {
            description: 'Successful response',
            type: 'object',
          },
          400: {
            description: 'Bad request',
            type: 'object',
          },
        },
      },
    },
    youtubeController.getVideoInfo.bind(youtubeController),
  );

  // Get video formats
  typedFastify.post(
    '/formats',
    {
      schema: {
        description: 'Get available formats for a YouTube video',
        tags: ['YouTube'],
        summary: 'Get video formats',
        body: videoUrlJsonSchema.body,
        response: {
          200: {
            description: 'Successful response',
            type: 'object',
          },
          400: {
            description: 'Bad request',
            type: 'object',
          },
        },
      },
    },
    youtubeController.getVideoFormats.bind(youtubeController),
  );

  // Get direct download link for a format
  typedFastify.get(
    '/link/:videoId/:formatId',
    {
      schema: {
        description: 'Get a direct download link for a specific format',
        tags: ['YouTube'],
        summary: 'Get download link',
        params: formatIdParamSchema.params,
        response: {
          200: {
            description: 'Successful response',
            type: 'object',
            properties: {
              downloadUrl: { type: 'string' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
          },
          404: {
            description: 'Format not found',
            type: 'object',
          },
        },
      },
    },
    youtubeController.getDownloadLink.bind(youtubeController),
  );

  // Start download
  typedFastify.post(
    '/download',
    {
      schema: {
        description: 'Start downloading a YouTube video',
        tags: ['YouTube'],
        summary: 'Download video',
        body: downloadOptionsJsonSchema.body,
        response: {
          200: {
            description: 'Successful response',
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              downloadUrl: { type: 'string' },
              fileName: { type: 'string' },
              contentType: { type: 'string' },
              fileSize: { type: 'number' },
            },
          },
          400: {
            description: 'Bad request',
            type: 'object',
          },
          429: {
            description: 'Too many concurrent downloads',
            type: 'object',
          },
          500: {
            description: 'Server error',
            type: 'object',
          },
        },
      },
    },
    youtubeController.downloadVideo.bind(youtubeController),
  );

  // Get download progress
  typedFastify.get(
    '/progress/:downloadId',
    {
      schema: {
        description: 'Check the progress of a download',
        tags: ['YouTube'],
        summary: 'Check download progress',
        params: {
          type: 'object',
          required: ['downloadId'],
          properties: {
            downloadId: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Successful response',
            type: 'object',
            properties: {
              id: { type: 'string' },
              progress: { type: 'number' },
              status: {
                type: 'string',
                enum: ['queued', 'processing', 'completed', 'failed'],
              },
              error: { type: 'string' },
            },
          },
          404: {
            description: 'Download not found',
            type: 'object',
          },
        },
      },
    },
    youtubeController.getDownloadProgress.bind(youtubeController),
  );

  // Stream download
  typedFastify.get(
    '/download/:downloadId',
    {
      schema: {
        description: 'Stream a downloaded file',
        tags: ['YouTube'],
        summary: 'Stream download',
        params: {
          type: 'object',
          required: ['downloadId'],
          properties: {
            downloadId: { type: 'string' },
          },
        },
      },
    },
    youtubeController.streamDownload.bind(youtubeController),
  );
}
