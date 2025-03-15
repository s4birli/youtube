import { z } from 'zod';

// Schema for the URL input
export const videoUrlSchema = z.object({
  url: z
    .string()
    .url('Invalid YouTube URL')
    .refine((val) => val.includes('youtube.com') || val.includes('youtu.be'), {
      message: 'Must be a valid YouTube URL',
    }),
});

// Schema for download options
export const downloadOptionsSchema = z.object({
  videoUrl: z
    .string()
    .url('Invalid YouTube URL')
    .refine((val) => val.includes('youtube.com') || val.includes('youtu.be'), {
      message: 'Must be a valid YouTube URL',
    }),
  formatId: z.string().optional(),
  extractAudio: z.boolean().optional().default(false),
  audioFormat: z.enum(['best', 'mp3', 'm4a', 'opus', 'vorbis', 'wav']).optional().default('mp3'),
  quality: z.string().optional(),
});

// Schema for Format ID
export const formatIdSchema = z.object({
  formatId: z.string(),
  videoId: z.string(),
});

// Export Zod schemas as JSON Schema for Fastify validation
export const videoUrlJsonSchema = {
  body: {
    type: 'object',
    required: ['url'],
    properties: {
      url: { type: 'string', format: 'uri' },
    },
  },
};

export const downloadOptionsJsonSchema = {
  body: {
    type: 'object',
    required: ['videoUrl'],
    properties: {
      videoUrl: { type: 'string', format: 'uri' },
      formatId: { type: 'string' },
      extractAudio: { type: 'boolean' },
      audioFormat: {
        type: 'string',
        enum: ['best', 'mp3', 'm4a', 'opus', 'vorbis', 'wav'],
      },
      quality: { type: 'string' },
    },
  },
};

export const videoIdParamSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
};

export const formatIdParamSchema = {
  params: {
    type: 'object',
    required: ['formatId', 'videoId'],
    properties: {
      formatId: { type: 'string' },
      videoId: { type: 'string' },
    },
  },
};
