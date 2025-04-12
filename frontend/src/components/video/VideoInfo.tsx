import { useState, useEffect } from 'react';
import { VideoResponse, VideoFormat } from '../../types/video.types';
import { YoutubeService } from '../../services/api';
import { createPortal } from 'react-dom';

interface VideoInfoProps {
    videoData: VideoResponse;
}

type MediaType = 'video' | 'audio';

const VideoInfo = ({ videoData }: VideoInfoProps) => {
    const [mediaType, setMediaType] = useState<MediaType>('video');
    const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [showDownloadButton, setShowDownloadButton] = useState(false);
    const [selectedResolution, setSelectedResolution] = useState<string | null>(null);

    // Early return if no data - AFTER all hooks are declared
    if (!videoData || !videoData.videoDetails) return null;

    const { videoDetails } = videoData;
    const { title, duration } = videoDetails;

    // Use the highest quality thumbnail (maxresdefault.jpg)
    const videoId = videoDetails.id;
    const highQualityThumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    // Helper function to normalize resolution string
    const normalizeResolution = (resolution: string | undefined): string => {
        if (!resolution) return '';

        // Handle formats like '1080p', '720p', 'hd720', etc.
        const match = resolution.match(/(\d+)/);
        return match ? `${match[1]}p` : resolution;
    };

    // Map standard itag values to resolutions
    const itagResolutionMap: Record<string, string> = {
        '18': '360p',
        '136': '720p',
        '137': '1080p',
        '313': '2160p'
    };

    // Standard YouTube resolutions we want to display
    const standardResolutions = ['1080p', '720p', '360p'];

    // Get display text for resolution (simplified for buttons)
    const getResolutionDisplayText = (format: VideoFormat): string => {
        if (format.normalizedResolution) {
            return format.normalizedResolution;
        }
        if (format.height) {
            return `${format.height}p`;
        }
        return 'Unknown';
    };

    // Process video formats outside of the conditional rendering
    const processVideoFormats = () => {
        if (!videoData || !videoData.videoDetails) return [];

        const { formats } = videoData;

        // Get all video formats (with video codec)
        const allVideoFormats = formats
            .filter(format => format.vcodec && format.vcodec !== 'none')
            .map(format => ({
                ...format,
                normalizedResolution: format.format_id && itagResolutionMap[format.format_id]
                    ? itagResolutionMap[format.format_id]
                    : normalizeResolution(format.resolution)
            }))
            // Filter out resolutions higher than 1080p
            .filter(format => {
                const resolution = format.normalizedResolution ? parseInt(format.normalizedResolution.replace('p', '')) : 0;
                return resolution <= 1080;
            })
            // Sort from highest to lowest quality
            .sort((a, b) => {
                const resA = a.normalizedResolution ? parseInt(a.normalizedResolution.replace('p', '')) : 0;
                const resB = b.normalizedResolution ? parseInt(b.normalizedResolution.replace('p', '')) : 0;
                return resB - resA;
            });

        // Find the closest standard resolution for each format
        allVideoFormats.forEach(format => {
            if (!format.normalizedResolution) return;

            const resValue = parseInt(format.normalizedResolution.replace('p', ''));

            // Map non-standard resolutions to the closest standard resolution
            if (!standardResolutions.includes(format.normalizedResolution)) {
                if (resValue >= 1080) format.normalizedResolution = '1080p';
                else if (resValue >= 720) format.normalizedResolution = '720p';
                else format.normalizedResolution = '360p';
            }
        });

        // Group formats by standard resolutions only
        const videoFormatsByResolution: { [key: string]: VideoFormat } = {};

        // First, attempt to find the standard itag formats (137, 136, 18)
        const standardItags = ['137', '136', '18']; // 1080p, 720p, 360p
        standardItags.forEach(itag => {
            const format = allVideoFormats.find(f => f.format_id === itag);
            if (format) {
                const resolution = itagResolutionMap[itag];
                videoFormatsByResolution[resolution] = format;
            }
        });

        // Then look for formats with standard resolutions if we don't have them yet
        standardResolutions.forEach(resolution => {
            if (!videoFormatsByResolution[resolution]) {
                const format = allVideoFormats.find(f => f.normalizedResolution === resolution);
                if (format) {
                    videoFormatsByResolution[resolution] = format;
                }
            }
        });

        // Get only the standard resolution formats
        return standardResolutions
            .filter(res => videoFormatsByResolution[res])
            .map(res => videoFormatsByResolution[res])
            .sort((a, b) => {
                const resA = a.normalizedResolution ? parseInt(a.normalizedResolution.replace('p', '')) : 0;
                const resB = b.normalizedResolution ? parseInt(b.normalizedResolution.replace('p', '')) : 0;
                return resB - resA;
            });
    };

    const videoFormats = processVideoFormats();

    // Initialize selected resolution with highest quality - now this is always called
    useEffect(() => {
        if (videoFormats.length > 0 && !selectedResolution) {
            setSelectedResolution(getResolutionDisplayText(videoFormats[0]));
            setSelectedFormat(videoFormats[0]);
        }
    }, [videoFormats, selectedResolution]);

    // Format the duration to mm:ss
    const formatDuration = (seconds: number | string): string => {
        if (typeof seconds === 'string') {
            return seconds;
        }

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle resolution selection
    const handleResolutionSelect = (resolution: string) => {
        setSelectedResolution(resolution);
        const format = videoFormats.find(f => getResolutionDisplayText(f) === resolution);
        if (format) {
            setSelectedFormat(format);
        }
    };

    // Direct download function
    const initiateDirectDownload = (downloadUrl: string, filename: string) => {
        const fullUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${downloadUrl}`;

        try {
            const newWindow = window.open(fullUrl, '_blank');

            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                throw new Error("Popup blocked");
            }

            return;
        } catch (error) {
            console.error("Error opening new window:", error);
        }

        try {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            iframe.src = fullUrl;

            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 5000);

            return;
        } catch (error) {
            console.error("Error using iframe method:", error);
        }

        // Method 3: Show manual download link to user
        try {
            const downloadButton = document.createElement('div');
            downloadButton.style.position = 'fixed';
            downloadButton.style.bottom = '20px';
            downloadButton.style.right = '20px';
            downloadButton.style.backgroundColor = '#4CAF50';
            downloadButton.style.color = 'white';
            downloadButton.style.padding = '15px 20px';
            downloadButton.style.borderRadius = '5px';
            downloadButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            downloadButton.style.zIndex = '9999';
            downloadButton.style.cursor = 'pointer';
            downloadButton.style.fontWeight = 'bold';
            downloadButton.style.textAlign = 'center';
            downloadButton.innerHTML = `
                <div>Large file (1GB+)</div>
                <div style="margin-top: 8px;">Click here to download</div>
                <div style="font-size: 12px; margin-top: 5px;">${filename}</div>
            `;

            downloadButton.onclick = () => {
                window.open(fullUrl, '_blank');

                const infoDiv = document.createElement('div');
                infoDiv.style.position = 'fixed';
                infoDiv.style.top = '20px';
                infoDiv.style.left = '50%';
                infoDiv.style.transform = 'translateX(-50%)';
                infoDiv.style.backgroundColor = '#333';
                infoDiv.style.color = 'white';
                infoDiv.style.padding = '10px 15px';
                infoDiv.style.borderRadius = '5px';
                infoDiv.style.zIndex = '10000';
                infoDiv.textContent = 'Download started. Check your browser\'s download manager.';

                document.body.appendChild(infoDiv);

                setTimeout(() => {
                    if (document.body.contains(infoDiv)) {
                        document.body.removeChild(infoDiv);
                    }
                }, 5000);
            };

            document.body.appendChild(downloadButton);

            alert("File is very large (1GB+). Click the green button in the bottom right corner to start the download.");

            // Remove the button after 60 seconds
            setTimeout(() => {
                if (document.body.contains(downloadButton)) {
                    document.body.removeChild(downloadButton);
                }
            }, 60000);

            return;
        } catch (error) {
            console.error("Error showing manual download button:", error);

            alert(`Download could not be started. Please copy and paste this URL in your browser:\n\n${fullUrl}`);
        }
    };

    // Handle download for the selected format
    const handleDownload = async () => {
        if (!selectedFormat) return;

        try {
            setIsDownloading(true);
            setDownloadProgress(0);
            setShowDownloadButton(false);
            setDownloadUrl(null);

            const response = await YoutubeService.downloadVideo({
                videoUrl: `https://www.youtube.com/watch?v=${videoDetails.id}`,
                formatId: selectedFormat.format_id,
                quality: '0'
            });

            // Use the download endpoint directly
            const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/youtube/download/${response.id}`;
            const filename = response.fileName || `${videoDetails.title}.mp4`;

            setDownloadUrl(downloadUrl);
            setIsDownloading(false);
            setShowDownloadButton(true);

            // Initiate download directly
            initiateDirectDownload(downloadUrl, filename);

        } catch (error) {
            console.error('Error starting download:', error);
            setIsDownloading(false);
        }
    };

    const handleMP3Download = async () => {
        try {
            setIsDownloading(true);
            setDownloadProgress(0);
            setShowDownloadButton(false);
            setDownloadUrl(null);

            const response = await YoutubeService.downloadMP3(`https://www.youtube.com/watch?v=${videoDetails.id}`);

            // Use the download endpoint directly
            const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/youtube/download/${response.id}`;
            const filename = response.fileName || `${videoDetails.title}.mp3`;

            setDownloadUrl(downloadUrl);
            setIsDownloading(false);
            setShowDownloadButton(true);

            // Initiate download directly
            initiateDirectDownload(downloadUrl, filename);

        } catch (error) {
            console.error('Error starting MP3 download:', error);
            setIsDownloading(false);
        }
    };

    // Create portal for loading overlay
    const LoadingOverlay = () => {
        if (!isDownloading) return null;

        return createPortal(
            <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
                    <p className="text-white text-lg">Preparing download...</p>
                    {downloadProgress > 0 && (
                        <p className="text-white text-sm mt-2">{downloadProgress}%</p>
                    )}
                </div>
            </div>,
            document.body
        );
    };

    return (
        <>
            <LoadingOverlay />
            <div className="w-full max-w-4xl mx-auto bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row p-4">
                    <div className="w-full md:w-2/3">
                        <img
                            src={highQualityThumbnail}
                            alt={title}
                            className="w-full h-auto object-cover rounded-lg md:rounded-none"
                        />
                    </div>
                    <div className="p-4 w-full md:w-1/3 bg-gray-800 text-white rounded-lg mt-4 md:mt-0 md:rounded-none">
                        <h2 className="text-lg font-semibold mb-2 line-clamp-2 overflow-hidden">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-300 mb-4">
                            Duration: {formatDuration(duration)}
                        </p>

                        {/* Format type selector buttons */}
                        <div className="flex mb-4 space-x-2">
                            <button
                                className={`flex-1 px-4 py-3 rounded-md ${mediaType === 'video'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-600 text-gray-300'
                                    }`}
                                onClick={() => setMediaType('video')}
                            >
                                📹 Video
                            </button>
                            <button
                                className={`flex-1 px-4 py-3 rounded-md ${mediaType === 'audio'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-600 text-gray-300'
                                    }`}
                                onClick={() => setMediaType('audio')}
                            >
                                🎵 Audio
                            </button>
                        </div>

                        {/* Video section - horizontal resolution buttons and download button */}
                        {mediaType === 'video' && (
                            <>
                                {/* Resolution selector buttons */}
                                {videoFormats.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {videoFormats.map(format => (
                                            <button
                                                key={format.format_id}
                                                onClick={() => handleResolutionSelect(getResolutionDisplayText(format))}
                                                className={`px-4 py-2 rounded-md ${selectedResolution === getResolutionDisplayText(format)
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-gray-700 text-gray-300'
                                                    }`}
                                            >
                                                {getResolutionDisplayText(format)}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm">No video formats available</p>
                                )}

                                {/* Download button */}
                                {selectedFormat && (
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloading}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center mt-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                        Download {selectedResolution}
                                    </button>
                                )}
                            </>
                        )}

                        {/* Audio section - direct MP3 download button only */}
                        {mediaType === 'audio' && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-400 mb-3">
                                    Download this video as MP3 audio
                                </p>

                                <button
                                    onClick={handleMP3Download}
                                    disabled={isDownloading}
                                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Download MP3
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default VideoInfo; 