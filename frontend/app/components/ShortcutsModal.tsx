'use client';

import { useEffect } from 'react';
import { SHORTCUTS } from '@/app/hooks/useKeyboardShortcuts';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 max-w-sm w-full m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h3>

                <div className="space-y-3">
                    {SHORTCUTS.map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-neutral-300">{shortcut.description}</span>
                            <div className="flex gap-1">
                                {shortcut.keys.map((key, j) => (
                                    <kbd key={j} className="px-2 py-1 bg-neutral-800 text-neutral-400 text-xs rounded font-mono">
                                        {key.replace('Ctrl', navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-[#333]">
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
