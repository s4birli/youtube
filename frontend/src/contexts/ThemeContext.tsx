import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    autoTheme: boolean;
    toggleAutoTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // Check if it's daytime based on current hour
    const isDaytime = (): boolean => {
        const currentHour = new Date().getHours();
        return currentHour >= 6 && currentHour < 18; // Day is from 6 AM to 6 PM
    };

    // Check for user's preference in localStorage or system preference
    const getUserPreference = (): Theme => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) {
            return savedTheme;
        }

        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const [theme, setTheme] = useState<Theme>(getUserPreference);
    const [autoTheme, setAutoTheme] = useState<boolean>(
        localStorage.getItem('autoTheme') === 'true'
    );

    // Apply theme to document element
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (!localStorage.getItem('theme') || autoTheme) {
                setTheme(mediaQuery.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [autoTheme]);

    // Set up time-based theme
    useEffect(() => {
        // Function to update theme based on time
        const updateTimeBasedTheme = () => {
            if (autoTheme) {
                setTheme(isDaytime() ? 'light' : 'dark');
            }
        };

        // Update theme once when enabled
        if (autoTheme) {
            updateTimeBasedTheme();
        }

        // Set up interval to check time every minute
        const interval = setInterval(updateTimeBasedTheme, 60000);

        return () => clearInterval(interval);
    }, [autoTheme]);

    // Save autoTheme setting to localStorage
    useEffect(() => {
        localStorage.setItem('autoTheme', autoTheme.toString());
    }, [autoTheme]);

    const toggleTheme = () => {
        if (autoTheme) {
            setAutoTheme(false);
        }
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const toggleAutoTheme = () => {
        setAutoTheme(prev => !prev);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, autoTheme, toggleAutoTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider; 