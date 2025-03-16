export interface VideoMetadata {
    title?: string;
    artist?: string;
    album?: string;
    year?: string | number;
    genre?: string;
    comment?: string;
    language?: string;
    description?: string;
    encodedBy?: string;
    copyright?: string;
    trackNumber?: string | number;
    discNumber?: string | number;
    composer?: string;
    [key: string]: string | number | undefined;
}

export interface MetadataResponse {
    success: boolean;
    metadata: VideoMetadata;
    message?: string;
}

export interface MetadataUpdateRequest {
    path: string;
    metadata: VideoMetadata;
}

export interface MetadataUpdateResponse {
    success: boolean;
    message: string;
    updatedMetadata?: VideoMetadata;
} 