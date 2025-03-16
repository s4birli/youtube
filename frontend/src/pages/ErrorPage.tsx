import { memo } from 'react';
import { Link } from 'react-router-dom';

const ErrorPage = () => {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-xl mx-auto text-center">
                <div className="mb-8">
                    <div className="text-youtube-red text-9xl font-bold">404</div>
                    <h1 className="text-3xl font-bold mt-4 mb-2 text-youtube-black dark:text-dark-text-primary">
                        Page Not Found
                    </h1>
                    <p className="text-youtube-gray dark:text-dark-text-secondary">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-6">
                    <Link
                        to="/"
                        className="px-6 py-3 bg-youtube-red hover:bg-youtube-darkred text-white font-medium rounded-lg transition-colors"
                    >
                        Back to Home
                    </Link>

                    <div className="w-full max-w-md p-6 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-youtube-black dark:text-dark-text-primary">
                            Looking for something?
                        </h2>
                        <p className="text-youtube-gray dark:text-dark-text-secondary mb-4">
                            You might want to try one of these pages:
                        </p>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/"
                                    className="text-youtube-red hover:underline"
                                >
                                    • Download YouTube Videos
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/history"
                                    className="text-youtube-red hover:underline"
                                >
                                    • View Download History
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/about"
                                    className="text-youtube-red hover:underline"
                                >
                                    • About This Tool
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(ErrorPage); 