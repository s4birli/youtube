import { useState, useEffect, useCallback } from 'react';
import { VideoDetails } from '../types/video.types';

export interface DownloadHistoryItem {
    id: string;
    videoId: string;
    title: string;
    thumbnail: string;
    format: string;
    quality: string;
    downloadDate: string;
    fileSize?: string;
    url?: string;
}

const STORAGE_KEY = 'youtube_downloader_history';

export const useDownloadHistory = () => {
    const [history, setHistory] = useState<DownloadHistoryItem[]>([]);

    // Load history from localStorage on initial render
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem(STORAGE_KEY);
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error('Failed to load download history:', error);
            // If parsing fails, reset the storage
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    // Save to localStorage whenever history changes
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }, [history]);

    // Add a new download to history
    const addToHistory = useCallback((
        videoDetails: VideoDetails,
        formatName: string,
        quality: string,
        fileSize?: string,
        url?: string
    ) => {
        const newItem: DownloadHistoryItem = {
            id: `${videoDetails.id}_${Date.now()}`,
            videoId: videoDetails.id,
            title: videoDetails.title,
            thumbnail: videoDetails.thumbnail,
            format: formatName,
            quality,
            downloadDate: new Date().toISOString(),
            fileSize,
            url
        };

        setHistory(prevHistory => {
            // Add new item at the beginning of the array
            const updatedHistory = [newItem, ...prevHistory];

            // Limit history to last 50 items
            if (updatedHistory.length > 50) {
                return updatedHistory.slice(0, 50);
            }

            return updatedHistory;
        });

        return newItem.id;
    }, []);

    // Remove an item from history
    const removeFromHistory = useCallback((itemId: string) => {
        setHistory(prevHistory =>
            prevHistory.filter(item => item.id !== itemId)
        );
    }, []);

    // Clear all history
    const clearHistory = useCallback(() => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        history,
        addToHistory,
        removeFromHistory,
        clearHistory
    };
};

export default useDownloadHistory; 