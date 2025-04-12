import { useState, memo } from "react";
import { FaYoutube } from "react-icons/fa";
import { Link } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <header className="bg-youtube-black dark:bg-dark-bg-primary text-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <FaYoutube className="text-youtube-red text-5xl" />
                        <span className="text-xl font-bold text-white">Downloader</span>
                    </Link>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={toggleMenu}
                            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-youtube-red"
                            aria-expanded={menuOpen}
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Desktop navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <nav>
                            <ul className="flex space-x-6">
                                <li><Link to="/" className="hover:text-youtube-red transition-colors">Home</Link></li>
                                <li><Link to="/about" className="hover:text-youtube-red transition-colors">About</Link></li>
                            </ul>
                        </nav>
                        <ThemeToggle />
                    </div>
                </div>

                {/* Mobile navigation */}
                {menuOpen && (
                    <nav className="md:hidden mt-4 pb-2 border-t border-dark-bg-tertiary">
                        <ul className="flex flex-col space-y-3 pt-3">
                            <li>
                                <Link
                                    to="/"
                                    className="block hover:text-youtube-red transition-colors"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/about"
                                    className="block hover:text-youtube-red transition-colors"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    About
                                </Link>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </header>
    );
};

// Use memo for performance optimization
export default memo(Header); 