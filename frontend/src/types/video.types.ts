export interface VideoDetails {
    id: string;
    title: string;
    description: string;
    duration: number | string;
    thumbnail: string;
    uploadDate: string;
    views: number;
    author: string;
    lengthSeconds?: string;
    viewCount?: string;
    channelId?: string;
    thumbnails?: Array<{ url: string; height: number; width: number }>;
}

export interface VideoFormat {
    format_id: string;
    url: string;
    ext: string;
    resolution?: string;
    filesize?: number;
    fps?: number;
    vcodec?: string;
    acodec?: string;
    width?: number;
    height?: number;
    normalizedResolution?: string;
}

export type Format = VideoFormat;

export interface VideoResponse {
    id: string;
    formats: VideoFormat[];
    videoDetails: VideoDetails;
    title?: string;
    description?: string;
    duration?: number;
    uploadDate?: string;
    uploader?: string;
    channel?: string;
    thumbnail?: string;
    _frontend_processed?: boolean;
}

export interface DownloadRequest {
    videoUrl: string;
    formatId?: string;
    quality?: string;
    extractAudio?: boolean;
    audioFormat?: string;
}

export interface DownloadResponse {
    id: string;
    title: string;
    downloadUrl: string;
    fileName: string;
    contentType: string;
    fileSize: number;
}

export interface ProgressInfo {
    progress: number;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_found';
    error?: string;
} 