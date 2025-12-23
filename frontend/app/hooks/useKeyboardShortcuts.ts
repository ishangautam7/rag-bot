'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutHandlers {
    onSearch?: () => void;
    onNewChat?: () => void;
    onToggleSidebar?: () => void;
    onShowHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
    const router = useRouter();

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const modifier = isMac ? e.metaKey : e.ctrlKey;

        // Ignore if in input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            // Only allow Escape in inputs
            if (e.key === 'Escape') {
                target.blur();
            }
            return;
        }

        // Ctrl/Cmd + K - Search
        if (modifier && e.key === 'k') {
            e.preventDefault();
            handlers.onSearch?.();
        }

        // Ctrl/Cmd + N - New chat
        if (modifier && e.key === 'n') {
            e.preventDefault();
            handlers.onNewChat?.();
        }

        // Ctrl/Cmd + B - Toggle sidebar
        if (modifier && e.key === 'b') {
            e.preventDefault();
            handlers.onToggleSidebar?.();
        }

        // Ctrl/Cmd + / - Show help
        if (modifier && e.key === '/') {
            e.preventDefault();
            handlers.onShowHelp?.();
        }

        // Escape - Close modals (handled by modal components)
    }, [handlers]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

// Shortcut descriptions for help modal
export const SHORTCUTS = [
    { keys: ['Ctrl', 'K'], description: 'Open search' },
    { keys: ['Ctrl', 'N'], description: 'New chat' },
    { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
    { keys: ['Ctrl', '/'], description: 'Show shortcuts' },
    { keys: ['Esc'], description: 'Close modals' },
];
