import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../../src/app';

// Mock the YoutubeService
vi.mock('../../../src/services/youtube.service', () => {
  const mockVideoInfo = {
    id: 'test-video-id',
    title: 'Test Video',
    webpage_url: 'https://youtube.com/watch?v=test-video-id',
    formats: [
      {
        format_id: 'test-format-1',
        ext: 'mp4',
        format: 'test format 1',
      },
      {
        format_id: 'test-format-2',
        ext: 'mp3',
        format: 'test format 2',
      },
    ],
    thumbnails: [
      {
        url: 'https://test-thumbnail.jpg',
        width: 120,
        height: 90,
      },
    ],
  };

  const mockDownloadResponse = {
    id: 'test-download-id',
    title: 'Test Video',
    downloadUrl: '/api/download/test-download-id',
    fileName: 'Test_Video.mp4',
    contentType: 'video/mp4',
    fileSize: 1024,
  };

  return {
    YoutubeService: vi.fn().mockImplementation(() => ({
      getVideoInfo: vi.fn().mockResolvedValue(mockVideoInfo),
      getVideoFormats: vi.fn().mockResolvedValue(mockVideoInfo),
      getDownloadUrl: vi.fn().mockResolvedValue('https://example.com/download'),
      downloadVideo: vi.fn().mockResolvedValue(mockDownloadResponse),
      getProgress: vi.fn().mockReturnValue({
        id: 'test-download-id',
        status: 'completed',
        progress: 100,
      }),
      getDownloadedFile: vi.fn().mockResolvedValue({
        filepath: '/tmp/test.mp4',
        filename: 'Test_Video.mp4',
        contentType: 'video/mp4',
        filesize: 1024,
      }),
    })),
  };
});

describe('YouTube API Routes', () => {
  let app: FastifyInstance;

  // Setup and teardown
  beforeAll(async () => {
    app = await buildApp();
    await (app as any).ready();
  });

  afterAll(async () => {
    await (app as any).close();
    vi.clearAllMocks();
  });

  describe('POST /api/youtube/info', () => {
    it.skip('should return video info', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/youtube/info',
        payload: {
          url: 'https://youtube.com/watch?v=test-video-id',
        },
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.payload);
      expect(responseBody.id).toBe('test-video-id');
      expect(responseBody.title).toBe('Test Video');
    });

    it('should validate URL format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/youtube/info',
        payload: {
          url: 'invalid-url',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/youtube/formats', () => {
    it.skip('should return video formats', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/youtube/formats',
        payload: {
          url: 'https://youtube.com/watch?v=test-video-id',
        },
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.payload);
      expect(responseBody.formats).toBeDefined();
      expect(responseBody.formats.length).toBe(2);
    });
  });

  describe('GET /api/youtube/link/:videoId/:formatId', () => {
    it('should return a download link', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/youtube/link/test-video-id/test-format-1',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.payload);
      expect(responseBody.downloadUrl).toBe('https://example.com/download');
    });
  });

  describe('POST /api/youtube/download', () => {
    it('should start a download', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/youtube/download',
        payload: {
          videoUrl: 'https://youtube.com/watch?v=test-video-id',
          formatId: 'test-format-1',
        },
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.payload);
      expect(responseBody.id).toBe('test-download-id');
      expect(responseBody.downloadUrl).toBe('/api/download/test-download-id');
    });

    it('should handle audio extraction', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/youtube/download',
        payload: {
          videoUrl: 'https://youtube.com/watch?v=test-video-id',
          extractAudio: true,
          audioFormat: 'mp3',
        },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/youtube/progress/:downloadId', () => {
    it('should return download progress', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/youtube/progress/test-download-id',
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.payload);
      expect(responseBody.status).toBe('completed');
      expect(responseBody.progress).toBe(100);
    });
  });

  describe('GET /api/youtube/download/:downloadId', () => {
    it.skip('should stream downloaded file', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/youtube/download/test-download-id',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('video/mp4');
      expect(response.headers['content-disposition']).toContain('attachment; filename=');
    });
  });
});
