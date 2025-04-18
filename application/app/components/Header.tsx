'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeSwitch from './ThemeSwitch';

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="bg-white dark:bg-dark-bg-primary border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link
                    href="/"
                    className="text-xl font-bold flex items-center gap-2"
                >
                    <span className="text-youtube-red">YouTube</span>
                    <span className="text-youtube-black dark:text-dark-text-primary">Downloader</span>
                </Link>

                <div className="flex items-center gap-6">
                    <nav className="flex items-center gap-6">
                        <Link
                            href="/"
                            className={`${pathname === '/' ? 'text-youtube-red dark:text-youtube-red' : 'text-youtube-gray dark:text-dark-text-secondary'} hover:text-youtube-red transition-colors`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/about"
                            className={`${pathname === '/about' ? 'text-youtube-red dark:text-youtube-red' : 'text-youtube-gray dark:text-dark-text-secondary'} hover:text-youtube-red transition-colors`}
                        >
                            About
                        </Link>
                    </nav>

                    <ThemeSwitch />
                </div>
            </div>
        </header>
    );
} 