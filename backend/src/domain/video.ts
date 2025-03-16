/**
 * Video thumbnail information
 */
export interface VideoThumbnail {
  url: string;
  width?: number;
  height?: number;
}

/**
 * Video format information
 */
export interface VideoFormat {
  format_id: string;
  ext: string;
  format: string;
  format_note?: string;
  width?: number;
  height?: number;
  resolution?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  abr?: number;
  url?: string;
  filesize?: number;
}

/**
 * Full video information
 */
export interface VideoInfo {
  id: string;
  title: string;
  formats: VideoFormat[];
  thumbnails: VideoThumbnail[];
  description?: string;
  upload_date?: string;
  uploader?: string;
  uploader_id?: string;
  uploader_url?: string;
  channel_id?: string;
  channel_url?: string;
  duration?: number;
  view_count?: number;
  webpage_url: string;
  like_count?: number;
}

/**
 * Simplified response for video formats
 */
export interface VideoFormatResponse {
  id: string;
  title: string;
  webpage_url: string;
  formats: VideoFormat[];
  thumbnails: VideoThumbnail[];
}

/**
 * Request to download a video
 */
export interface DownloadRequest {
  videoUrl: string;
  formatId?: string;
  extractAudio?: boolean;
  audioFormat?: string;
  quality?: string;
}

/**
 * Response for a download request
 */
export interface DownloadResponse {
  id: string;
  title: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

/**
 * Progress information for a download
 */
export interface ProgressInfo {
  id: string;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  timestamp: number;
}
