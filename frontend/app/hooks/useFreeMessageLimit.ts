'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUsage } from '@/app/lib/api';

const FREE_MODEL_ID = 'openrouter/auto';
const DAILY_LIMIT = 15;

export function useFreeMessageLimit() {
    const [remaining, setRemaining] = useState(DAILY_LIMIT);
    const [loading, setLoading] = useState(true);

    // Fetch usage from server
    const fetchUsage = useCallback(async () => {
        try {
            const res = await getUsage();
            setRemaining(res.data.remaining);
        } catch (error) {
            console.error('Failed to fetch usage:', error);
            // Fall back to full limit on error
            setRemaining(DAILY_LIMIT);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load usage on mount
    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    // Check if user can send a free message
    const canSendFreeMessage = useCallback(() => {
        return remaining > 0;
    }, [remaining]);

    // Refresh usage (call after sending a message)
    const refreshUsage = useCallback(() => {
        // Optimistically decrement, then fetch actual value
        setRemaining(prev => Math.max(0, prev - 1));
        // Fetch actual value after a short delay
        setTimeout(fetchUsage, 500);
    }, [fetchUsage]);

    // Check if a model is the free model
    const isFreeModel = useCallback((modelId: string) => {
        return modelId === FREE_MODEL_ID;
    }, []);

    return {
        remaining,
        loading,
        canSendFreeMessage,
        refreshUsage,
        isFreeModel,
        limit: DAILY_LIMIT,
    };
}
