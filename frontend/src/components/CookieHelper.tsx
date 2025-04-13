import React, { useState } from 'react';
import axios from 'axios';

interface CookieHelperProps {
    onSuccess?: () => void;
}

const CookieHelper: React.FC<CookieHelperProps> = ({ onSuccess }) => {
    const [cookieText, setCookieText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showInstructions, setShowInstructions] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            await axios.post(`${apiUrl}/cookies/youtube`, { cookieText });
            setMessage('✅ YouTube cookies successfully added! Try your request again.');
            setCookieText('');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error sending cookies:', error);
            setMessage('❌ Failed to save cookies. Please ensure they are in the correct format.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 max-w-lg mx-auto my-4">
            <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">
                YouTube Authentication Required
            </h2>

            <p className="mb-4 text-gray-600 dark:text-gray-300">
                YouTube is requesting authentication. Please provide your YouTube cookies to continue.
            </p>

            <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-blue-500 hover:underline mb-4 inline-flex items-center"
            >
                {showInstructions ? 'Hide instructions' : 'Show instructions'}
                <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d={showInstructions
                            ? "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                            : "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"}
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {showInstructions && (
                <div className="border-l-4 border-blue-500 pl-4 mb-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">How to get your YouTube cookies:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li>Install the <a href="https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbgbg" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">EditThisCookie</a> extension for Chrome</li>
                        <li>Go to <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">YouTube.com</a> and make sure you're logged in</li>
                        <li>Click on the EditThisCookie icon in your browser</li>
                        <li>Click the "Export" button (this copies cookies to your clipboard)</li>
                        <li>Paste the cookies below</li>
                    </ol>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <textarea
                    value={cookieText}
                    onChange={(e) => setCookieText(e.target.value)}
                    placeholder='Paste your YouTube cookies here (JSON format from EditThisCookie)'
                    className="w-full h-40 p-3 border rounded mb-3 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                    required
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`
            w-full bg-youtube-red hover:bg-red-700 text-white font-semibold py-2 px-4 rounded
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    {isLoading ? 'Saving...' : 'Save Cookies'}
                </button>
            </form>

            {message && (
                <div className={`mt-3 p-2 rounded text-center ${message.startsWith('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default CookieHelper; 