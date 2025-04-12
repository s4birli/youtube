import { z } from 'zod';

/**
 * Schema for validating video URL requests
 */
export const videoUrlSchema = z.object({
  url: z
    .string()
    .url()
    .refine(
      url => {
        // Check for both regular YouTube URLs and Shorts
        return (
          url.includes('youtube.com/watch?v=') ||
          url.includes('youtube.com/shorts/') ||
          url.includes('youtu.be/')
        );
      },
      {
        message: 'URL must be a valid YouTube URL (regular video or shorts)',
      }
    ),
});

/**
 * Schema for validating download options
 */
export const downloadOptionsSchema = z.object({
  videoUrl: z
    .string()
    .url()
    .refine(
      url => {
        // Check for both regular YouTube URLs and Shorts
        return (
          url.includes('youtube.com/watch?v=') ||
          url.includes('youtube.com/shorts/') ||
          url.includes('youtu.be/')
        );
      },
      {
        message: 'URL must be a valid YouTube URL (regular video or shorts)',
      }
    ),
  formatId: z.string().optional(),
  extractAudio: z.boolean().optional().default(false),
  audioFormat: z.enum(['mp3', 'wav', 'm4a', 'aac', 'opus']).optional().default('mp3'),
  quality: z.enum(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']).optional().default('0'),
});
