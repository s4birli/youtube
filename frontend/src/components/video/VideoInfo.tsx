import { useState, useEffect } from 'react';
import { VideoResponse, VideoFormat } from '../../types/video.types';
import { YoutubeService } from '../../services/api';

interface VideoInfoProps {
    videoData: VideoResponse;
}

type MediaType = 'video' | 'audio';

const VideoInfo = ({ videoData }: VideoInfoProps) => {
    const [mediaType, setMediaType] = useState<MediaType>('video');
    const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadId, setDownloadId] = useState<string | null>(null);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [showDownloadButton, setShowDownloadButton] = useState(false);
    const [downloadFilename, setDownloadFilename] = useState<string | null>(null);

    if (!videoData || !videoData.videoDetails) return null;

    const { videoDetails, formats } = videoData;
    const { title, thumbnail, duration } = videoDetails;

    // Use the highest quality thumbnail (maxresdefault.jpg)
    const videoId = videoDetails.id;
    const highQualityThumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    // Log all available formats for debugging
    console.log('All available formats:', formats);

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

    // Get all video formats (with video codec)
    console.log('Formats:', formats.filter(format => format.vcodec && format.vcodec !== 'none'));
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

    console.log('Filtered video formats:', allVideoFormats);

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
    let videoFormats = standardResolutions
        .filter(res => videoFormatsByResolution[res])
        .map(res => videoFormatsByResolution[res])
        .sort((a, b) => {
            const resA = a.normalizedResolution ? parseInt(a.normalizedResolution.replace('p', '')) : 0;
            const resB = b.normalizedResolution ? parseInt(b.normalizedResolution.replace('p', '')) : 0;
            return resB - resA;
        });

    console.log('Final standard video formats to display:', videoFormats);

    // Get the best audio format (we'll only show one)
    const audioFormats = formats
        .filter(format =>
            format.acodec !== 'none' &&
            format.vcodec === 'none'
        )
        .sort((a, b) => (b.filesize || 0) - (a.filesize || 0));

    const bestAudioFormat = audioFormats.length > 0 ? audioFormats[0] : null;

    // Format the duration to mm:ss
    const formatDuration = (seconds: number | string): string => {
        if (typeof seconds === 'string') {
            return seconds;
        }

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

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

    // State for selected resolution
    const [selectedResolution, setSelectedResolution] = useState<string | null>(null);

    // Initialize selected resolution with highest quality
    useEffect(() => {
        if (videoFormats.length > 0 && !selectedResolution) {
            setSelectedResolution(getResolutionDisplayText(videoFormats[0]));
            setSelectedFormat(videoFormats[0]);
        }
    }, [videoFormats]);

    // Handle resolution selection
    const handleResolutionSelect = (resolution: string) => {
        setSelectedResolution(resolution);
        const format = videoFormats.find(f => getResolutionDisplayText(f) === resolution);
        if (format) {
            setSelectedFormat(format);
        }
    };

    // Handle download for the selected format
    const handleDownload = async () => {
        if (!selectedFormat) return;

        try {
            setIsDownloading(true);
            setDownloadProgress(0);
            setShowDownloadButton(false);
            setDownloadFilename(null);

            const response = await YoutubeService.downloadVideo({
                videoUrl: `https://www.youtube.com/watch?v=${videoDetails.id}`,
                formatId: selectedFormat.format_id,
                quality: '0'
            });

            setDownloadId(response.id);

            // Start checking progress
            const progressInterval = setInterval(async () => {
                try {
                    const progressInfo = await YoutubeService.getDownloadProgress(response.id);
                    setDownloadProgress(progressInfo.progress);

                    if (progressInfo.progress === 100) {
                        clearInterval(progressInterval);
                        // Use the download endpoint directly
                        const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/youtube/download/${response.id}`;
                        setDownloadUrl(downloadUrl);
                        setIsDownloading(false);
                        setDownloadFilename(response.fileName || `${videoDetails.title}.mp4`);
                        setShowDownloadButton(true);

                        // Create a hidden iframe for the download instead of window.open
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        document.body.appendChild(iframe);
                        iframe.src = downloadUrl;

                        // Clean up iframe after download starts
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                        }, 5000);
                    }
                } catch (error) {
                    console.error('Error checking progress:', error);
                    clearInterval(progressInterval);
                    setIsDownloading(false);
                }
            }, 1000);
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
            setDownloadFilename(null);

            const response = await YoutubeService.downloadMP3(`https://www.youtube.com/watch?v=${videoDetails.id}`);
            setDownloadId(response.id);

            // Start checking progress
            const progressInterval = setInterval(async () => {
                try {
                    const progressInfo = await YoutubeService.getDownloadProgress(response.id);
                    setDownloadProgress(progressInfo.progress);

                    if (progressInfo.progress === 100) {
                        clearInterval(progressInterval);
                        // Use the download endpoint directly
                        const downloadUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/api/youtube/download/${response.id}`;
                        setDownloadUrl(downloadUrl);
                        setIsDownloading(false);
                        setDownloadFilename(response.fileName || `${videoDetails.title}.mp3`);
                        setShowDownloadButton(true);

                        // Create a hidden iframe for the download instead of window.open
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        document.body.appendChild(iframe);
                        iframe.src = downloadUrl;

                        // Clean up iframe after download starts
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                        }, 5000);
                    }
                } catch (error) {
                    console.error('Error checking progress:', error);
                    clearInterval(progressInterval);
                    setIsDownloading(false);
                }
            }, 1000);
        } catch (error) {
            console.error('Error starting MP3 download:', error);
            setIsDownloading(false);
        }
    };

    // Manual download helper for the backup button
    const triggerManualDownload = () => {
        if (!downloadUrl) return;

        // Create and click an actual anchor element
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = downloadFilename || 'download';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            <div className="flex p-4 border-radius: 0.5rem;">
                <div className="w-2/3">
                    <img
                        src={highQualityThumbnail}
                        alt={title}
                        className="w-full h-full object-cover border-top-left-radius: 0.5rem; border-bottom-left-radius: 0.5rem;"
                    />
                </div>
                <div className="p-4 w-1/3 bg-gray-800 text-white border-top-right-radius: 0.5rem; border-bottom-right-radius: 0.5rem;">
                    <h2 className="text-lg font-semibold mb-1 line-clamp-2 h-14 overflow-hidden">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-300 mb-3">
                        Duration: {formatDuration(duration)}
                    </p>

                    {/* Format type selector buttons */}
                    <div className="flex mb-3 space-x-2">
                        <button
                            className={`px-4 py-2 rounded-md ${mediaType === 'video'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-600 text-gray-300'
                                }`}
                            onClick={() => setMediaType('video')}
                        >
                            📹 Video
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md ${mediaType === 'audio'
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
                                <div className="flex space-x-2 mb-4">
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
                                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center mt-2"
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
                        <div className="mt-2 text-center">
                            <p className="text-sm text-gray-400 mb-2">
                                Download this video as MP3 audio
                            </p>

                            <button
                                onClick={handleMP3Download}
                                disabled={isDownloading}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download MP3
                            </button>
                        </div>
                    )}

                    {/* Download progress bar */}
                    {isDownloading && (
                        <div className="mt-4">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${downloadProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-center mt-1 text-gray-400">
                                {downloadProgress === 100 ? 'Processing...' : `Downloading: ${downloadProgress}%`}
                            </p>
                        </div>
                    )}

                    {/* Manual download button (shows after processing is complete) */}
                    {showDownloadButton && downloadUrl && (
                        <div className="mt-4">
                            <button
                                onClick={triggerManualDownload}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Click to Download
                            </button>
                            <p className="text-xs text-center mt-1 text-gray-400">
                                If download didn't start automatically, click the button above
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoInfo; 