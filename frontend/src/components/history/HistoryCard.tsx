import React, { memo } from 'react';
import { DownloadHistoryItem } from '../../hooks/useDownloadHistory';
import { FiExternalLink, FiTrash2 } from 'react-icons/fi';

interface HistoryCardProps {
    item: DownloadHistoryItem;
    onDelete: (id: string) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ item, onDelete }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="bg-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
            <div className="relative">
                <img
                    src={item.thumbnail || '/placeholder-thumbnail.svg'}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-thumbnail.svg';
                    }}
                />
                <div className="absolute bottom-0 right-0 bg-youtube-red text-white px-2 py-1 text-xs rounded-tl-md">
                    {item.format} - {item.quality}
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-medium text-lg mb-1 line-clamp-2 dark:text-dark-text-primary">{item.title}</h3>
                <p className="text-text-secondary dark:text-dark-text-secondary text-sm mb-3">
                    Downloaded on {formatDate(item.downloadDate)}
                </p>
                <div className="flex justify-between items-center">
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-youtube-red hover:text-youtube-red-dark transition-colors text-sm"
                    >
                        <FiExternalLink className="mr-1" /> Open Link
                    </a>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="flex items-center text-text-secondary dark:text-dark-text-secondary hover:text-youtube-red transition-colors text-sm"
                    >
                        <FiTrash2 className="mr-1" /> Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default memo(HistoryCard); 