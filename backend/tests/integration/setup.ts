import dotenv from 'dotenv';
import { resolve } from 'path';
import { beforeAll, afterAll, vi } from 'vitest';

/**
 * Setup for integration tests
 */

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '../../.env.test') });

// Mock environment variables if needed
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.HOST = 'localhost';
process.env.DOWNLOAD_TEMP_DIR = './data/test-downloads';

// Mock external services
vi.mock('youtube-dl-exec', () => {
  return {
    default: (_url: string): (() => Promise<Record<string, never>>) => {
      return vi.fn().mockResolvedValue({});
    },
  };
});

// Mock fs modules for testing - ensure mkdir always succeeds
vi.mock('fs/promises', async () => {
  const actual: Record<string, unknown> = await vi.importActual('fs/promises');
  return {
    ...actual,
    mkdir: vi.fn().mockImplementation(async () => true),
    access: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({ size: 1024 }),
    readdir: vi.fn().mockResolvedValue(['test-file.mp4']),
  };
});

// Mock the ensureDownloadDir function to prevent unhandled rejections
vi.mock('../../src/services/youtube.service', async () => {
  // Use a cleaner approach to avoid type issues
  const actual = (await vi.importActual('../../src/services/youtube.service')) as any;

  // Return the actual module
  return {
    ...actual,
  };
});

// Global setup
beforeAll(async () => {
  // Set up test database or other resources if needed
  console.log('Integration tests starting...');
});

// Global teardown
afterAll(async () => {
  // Clean up test resources
  console.log('Integration tests finished.');
});
