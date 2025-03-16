import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { VideoFormat } from '../../types/video.types';
import { YoutubeService } from '../../services/api';

interface DownloadButtonProps {
    videoId: string;
    selectedFormat: VideoFormat | null;
    isDownloading: boolean;
    progress: number;
    onDownloadStart: (id: string) => void;
    onProgress: (progress: number) => void;
    onComplete: () => void;
    disabled: boolean;
}

const DownloadButton = ({
    videoId,
    selectedFormat,
    isDownloading,
    progress,
    onDownloadStart,
    onProgress,
    onComplete,
    disabled
}: DownloadButtonProps) => {
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [downloadId, setDownloadId] = useState<string | null>(null);

    useEffect(() => {
        let progressInterval: number | null = null;

        // If download is in progress, poll for progress updates
        if (isDownloading && downloadId) {
            progressInterval = window.setInterval(async () => {
                try {
                    const progressInfo = await YoutubeService.getDownloadProgress(downloadId);
                    onProgress(progressInfo.progress);

                    // If download is complete, clear interval and get download URL
                    if (progressInfo.progress === 100) {
                        if (progressInterval) window.clearInterval(progressInterval);

                        const url = await YoutubeService.getDownloadUrl(downloadId);
                        setDownloadUrl(url);
                        onComplete();
                    }
                } catch (error) {
                    console.error('Error checking progress:', error);
                    if (progressInterval) window.clearInterval(progressInterval);
                }
            }, 1000);
        }

        return () => {
            if (progressInterval) window.clearInterval(progressInterval);
        };
    }, [isDownloading, downloadId, onProgress, onComplete]);

    const handleDownload = async () => {
        if (!selectedFormat || !videoId) return;

        try {
            const response = await YoutubeService.downloadVideo({
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                formatId: selectedFormat.format_id,
                quality: selectedFormat.resolution || 'highest'
            });

            setDownloadId(response.id);
            onDownloadStart(response.id);
        } catch (error) {
            console.error('Error starting download:', error);
        }
    };

    const handleDownloadFile = () => {
        if (!downloadUrl) return;

        // Create a temporary link element
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `video-${videoId}`);
        document.body.appendChild(link);

        // Trigger the download
        link.click();

        // Cleanup
        document.body.removeChild(link);
    };

    if (downloadUrl) {
        return (
            <Button
                onClick={handleDownloadFile}
                variant="success"
            >
                Save File
            </Button>
        );
    }

    if (isDownloading) {
        return (
            <div className="w-full">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="text-sm text-gray-600 text-center">
                    {progress === 100 ? 'Processing...' : `Downloading: ${progress}%`}
                </div>
            </div>
        );
    }

    return (
        <Button
            onClick={handleDownload}
            disabled={disabled}
            variant="primary"
        >
            Download
        </Button>
    );
};

export default DownloadButton; 