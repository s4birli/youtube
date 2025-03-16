import { YoutubeService } from '../../src/services/youtube.service';
import { AppError } from '../../src/middleware/error-handler';

// Mock the youtube-dl-exec module
jest.mock('youtube-dl-exec', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((url: string) => {
      if (url.includes('invalid')) {
        throw new Error('Video not found');
      }

      return Promise.resolve({
        id: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up',
        formats: [
          {
            format_id: '18',
            ext: 'mp4',
            format: '360p',
          },
          {
            format_id: '22',
            ext: 'mp4',
            format: '720p',
          },
        ],
        thumbnails: [
          {
            url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
            width: 120,
            height: 90,
          },
        ],
        webpage_url: url,
      });
    }),
  };
});

// Mock the fs/promises module
jest.mock('fs/promises', () => {
  return {
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue(['test-download-123.mp4']),
    stat: jest.fn().mockResolvedValue({ size: 1024 * 1024 * 10, mtime: new Date() }),
    access: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
  };
});

describe('YoutubeService', () => {
  let service: YoutubeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new YoutubeService();
  });

  afterEach(() => {
    // Clean up resources to prevent memory leaks and hanging timers
    service.cleanup();
  });

  describe('getVideoInfo', () => {
    it('should return video info for a valid URL', async () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = await service.getVideoInfo(url);

      expect(result).toBeDefined();
      expect(result.id).toBe('dQw4w9WgXcQ');
      expect(result.title).toBe('Rick Astley - Never Gonna Give You Up');
      expect(result.formats.length).toBe(2);
    });

    it('should throw an AppError for an invalid URL', async () => {
      const url = 'https://example.com';

      await expect(service.getVideoInfo(url)).rejects.toThrow(AppError);
      await expect(service.getVideoInfo(url)).rejects.toThrow('Invalid URL');
    });

    it('should throw an AppError when youtube-dl-exec fails', async () => {
      const url = 'https://www.youtube.com/watch?v=invalid';

      await expect(service.getVideoInfo(url)).rejects.toThrow(AppError);
    });
  });

  describe('getVideoFormats', () => {
    it('should return formats for a valid URL', async () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = await service.getVideoFormats(url);

      expect(result).toBeDefined();
      expect(result.id).toBe('dQw4w9WgXcQ');
      expect(result.formats.length).toBe(2);
    });
  });
});
