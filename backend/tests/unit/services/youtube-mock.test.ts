import { describe, it, expect, vi } from 'vitest';

// Mock the youtube-dl-exec module
const mockYoutubeDlFn = vi.fn();
vi.mock('youtube-dl-exec', () => {
  return {
    default: mockYoutubeDlFn,
  };
});

// Define a type for the function
type YoutubeDlFunction = (url: string, options: Record<string, unknown>) => Promise<unknown>;

describe('YouTube Mock Test', () => {
  it('should import and use the mock correctly', async () => {
    // Import the module after mocking and cast it to the function type
    const youtubeDl = (await import('youtube-dl-exec')).default as unknown as YoutubeDlFunction;

    // Set up the mock return value
    mockYoutubeDlFn.mockResolvedValueOnce({ test: 'data' });

    // Call the function
    const result = await youtubeDl('https://example.com', {});

    // Verify the result
    expect(result).toEqual({ test: 'data' });
    expect(mockYoutubeDlFn).toHaveBeenCalledWith('https://example.com', {});
  });
});
