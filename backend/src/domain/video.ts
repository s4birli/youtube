/**
 * YouTube Video Format
 */
export interface VideoFormat {
  format_id: string;
  format_note?: string;
  ext: string;
  format: string;
  resolution?: string;
  filesize?: number;
  filesize_approx?: number;
  fps?: number;
  height?: number;
  width?: number;
  quality?: number;
  vcodec?: string;
  acodec?: string;
  abr?: number;
  asr?: number;
  tbr?: number;
  vbr?: number;
  url?: string;
}

/**
 * YouTube Video Thumbnail
 */
export interface VideoThumbnail {
  url: string;
  height?: number;
  width?: number;
  id?: string;
  resolution?: string;
}

/**
 * YouTube Video Information
 */
export interface VideoInfo {
  id: string;
  title: string;
  description?: string;
  uploader?: string;
  uploader_id?: string;
  uploader_url?: string;
  channel?: string;
  channel_id?: string;
  channel_url?: string;
  duration?: number;
  duration_string?: string;
  view_count?: number;
  like_count?: number;
  dislike_count?: number;
  upload_date?: string;
  webpage_url: string;
  formats: VideoFormat[];
  thumbnails: VideoThumbnail[];
  categories?: string[];
  tags?: string[];
  extractor?: string;
  extractor_key?: string;
}

/**
 * Video Format Selection Response
 */
export interface VideoFormatResponse {
  id: string;
  title: string;
  webpage_url: string;
  formats: VideoFormat[];
  thumbnails: VideoThumbnail[];
}

/**
 * Download Request
 */
export interface DownloadRequest {
  videoUrl: string;
  formatId?: string;
  extractAudio?: boolean;
  audioFormat?: 'best' | 'mp3' | 'm4a' | 'opus' | 'vorbis' | 'wav';
  quality?: string;
}

/**
 * Download Response
 */
export interface DownloadResponse {
  id: string;
  title: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  fileSize?: number;
}

/**
 * Progress Information
 */
export interface ProgressInfo {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  eta?: number;
  speed?: string;
  size?: string;
  error?: string;
  timestamp?: number;
}
