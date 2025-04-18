'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeSwitch() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <button
            aria-label="Toggle Dark Mode"
            type="button"
            className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
            {theme === 'dark' ? (
                <FaSun className="h-5 w-5 text-white-500" />
            ) : (
                <FaMoon className="h-5 w-5 text-gray-900" />
            )}
        </button>
    );
} 