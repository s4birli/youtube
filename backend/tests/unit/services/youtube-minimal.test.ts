import { describe, it, expect } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const youtubeDl = require('youtube-dl-exec');

describe('YouTube Minimal Test', () => {
  it('should import youtube-dl-exec', () => {
    // Just test that we can import the module
    expect(youtubeDl).toBeDefined();
  });
});
