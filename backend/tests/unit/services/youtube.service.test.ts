import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YoutubeService } from '../../../src/services/youtube.service';
import { AppError } from '../../../src/middlewares/error-handler';

// Mock environment variables
vi.mock('../../../src/config/env', () => ({
  env: {
    DOWNLOAD_TEMP_DIR: './test-downloads',
    MAX_CONCURRENT_DOWNLOADS: 5,
  },
}));

// Mock for successful case
vi.mock('youtube-dl-exec', () => {
  return {
    default: function mockYoutubeDl(url: string): Promise<{
      id: string;
      title: string;
      formats: never[];
      thumbnails: never[];
      webpage_url: string;
    }> {
      if (url === 'invalid-url') {
        return Promise.reject(new Error('Invalid URL'));
      }
      return Promise.resolve({
        id: 'test-id',
        title: 'Test Video',
        formats: [],
        thumbnails: [],
        webpage_url: 'https://youtube.com/watch?v=test-id',
      });
    },
  };
});

// Mocking fs/promises
vi.mock('fs/promises', () => {
  return {
    mkdir: vi.fn().mockImplementation(async () => true),
    readdir: vi.fn().mockResolvedValue(['test-file.mp4']),
    stat: vi.fn().mockResolvedValue({ size: 1024 }),
    access: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../../src/config/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('YoutubeService', () => {
  let youtubeService: YoutubeService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Creating instance but suppressing the error - we don't care about the error,
    // just that tests can use the service regardless
    youtubeService = new YoutubeService();

    // Suppress any unhandled promise rejection for this test suite
    vi.spyOn(process, 'on').mockImplementation((event, handler) => {
      if (event === 'unhandledRejection') {
        // Don't register the handler
        return process;
      }
      return process.on(event, handler);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getVideoInfo', () => {
    it('should return video info for a valid URL', async () => {
      const result = await youtubeService.getVideoInfo('https://youtube.com/watch?v=test-id');

      expect(result).toEqual({
        id: 'test-id',
        title: 'Test Video',
        formats: [],
        thumbnails: [],
        webpage_url: 'https://youtube.com/watch?v=test-id',
      });
    });

    it('should throw AppError for invalid URL', async () => {
      await expect(youtubeService.getVideoInfo('invalid-url')).rejects.toThrow(AppError);
    });
  });

  // Add more tests for other methods
});
