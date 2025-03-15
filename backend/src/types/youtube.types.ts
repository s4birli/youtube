/**
 * YouTube download options with string literals for format types
 */
export type AudioFormatType = 'best' | 'mp3' | 'm4a' | 'opus' | 'vorbis' | 'wav';

/**
 * Download quality options
 */
export type QualityOption = string;

/**
 * Headers type for youtube-dl
 */
export type Headers = Record<string, string>;

/**
 * YouTube-dl additional options
 * Modified to match the actual youtube-dl-exec parameter structure
 */
export interface YoutubeDlOptions {
  format?: string;
  extractAudio?: boolean;
  audioFormat?: string;
  audioQuality?: number;
  output?: string;
  noCheckCertificates?: boolean;
  noWarnings?: boolean;
  preferFreeFormats?: boolean;
  addHeader?: string | string[];
  dumpSingleJson?: boolean;
  [key: string]: string | boolean | number | string[] | undefined;
}

/**
 * API error response structure
 */
export type ApiErrorResponse = {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
};
