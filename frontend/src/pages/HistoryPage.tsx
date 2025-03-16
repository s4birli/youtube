import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import useDownloadHistory, { DownloadHistoryItem } from '../hooks/useDownloadHistory';

const HistoryPage = () => {
    const { history, removeFromHistory, clearHistory } = useDownloadHistory();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter history based on search term
    const filteredHistory = searchTerm
        ? history.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.format.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.quality.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : history;

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear your download history?')) {
            clearHistory();
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-youtube-black dark:text-dark-text-primary mb-4 md:mb-0">
                    Download History
                </h1>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search downloads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 px-4 py-2 pr-8 border border-gray-300 dark:border-dark-bg-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-youtube-red dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>

                    <button
                        onClick={handleClearHistory}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        disabled={history.length === 0}
                    >
                        Clear History
                    </button>
                </div>
            </div>

            {filteredHistory.length === 0 ? (
                <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md p-8 text-center">
                    <div className="mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 dark:text-dark-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-youtube-black dark:text-dark-text-primary mb-2">
                        {searchTerm ? 'No matching downloads found' : 'No download history yet'}
                    </h2>
                    <p className="text-youtube-gray dark:text-dark-text-secondary mb-6">
                        {searchTerm
                            ? 'Try using different search terms or clear the search field'
                            : 'Your download history will appear here after you download videos'}
                    </p>
                    <Link
                        to="/"
                        className="px-4 py-2 bg-youtube-red hover:bg-youtube-darkred text-white rounded-lg transition-colors"
                    >
                        Download Videos
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHistory.map(item => (
                        <HistoryCard
                            key={item.id}
                            item={item}
                            onDelete={removeFromHistory}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

interface HistoryCardProps {
    item: DownloadHistoryItem;
    onDelete: (id: string) => void;
}

const HistoryCard = memo(({ item, onDelete }: HistoryCardProps) => {
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-lg">
            <div className="aspect-video relative bg-gray-200 dark:bg-dark-bg-tertiary">
                <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {item.quality}
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-youtube-black dark:text-dark-text-primary line-clamp-2 mb-2">
                    {item.title}
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-youtube-gray dark:text-dark-text-secondary mb-3">
                    <div>Format: {item.format}</div>
                    {item.fileSize && <div>Size: {item.fileSize}</div>}
                    <div>Downloaded: {formatDate(item.downloadDate)}</div>
                </div>
                <div className="flex justify-between mt-2">
                    {item.url ? (
                        <a
                            href={item.url}
                            className="text-youtube-red hover:text-youtube-darkred text-sm font-medium"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open Link
                        </a>
                    ) : (
                        <Link
                            to={`/?v=${item.videoId}`}
                            className="text-youtube-red hover:text-youtube-darkred text-sm font-medium"
                        >
                            Download Again
                        </Link>
                    )}
                    <button
                        onClick={() => onDelete(item.id)}
                        className="text-youtube-gray hover:text-red-500 text-sm"
                        aria-label="Remove from history"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
});

HistoryCard.displayName = 'HistoryCard';

export default memo(HistoryPage); 