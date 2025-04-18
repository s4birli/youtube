'use client';

import { useEffect } from 'react';
import { startCleanupService } from '../lib/cleanup-service';

export default function CleanupServiceInitializer() {
    useEffect(() => {
        startCleanupService();
    }, []);

    return null;
} 