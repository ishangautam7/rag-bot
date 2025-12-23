'use client';

import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

interface CodeBlockProps {
    code: string;
    language?: string;
}

// Available themes
export const CODE_THEMES = {
    'vsDark': themes.vsDark,
    'dracula': themes.dracula,
    'nightOwl': themes.nightOwl,
    'oceanicNext': themes.oceanicNext,
    'oneDark': themes.oneDark,
    'github': themes.github,
} as const;

export type CodeThemeName = keyof typeof CODE_THEMES;

export default function CodeBlock({ code, language = 'text' }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    // Get theme from localStorage or default
    const getTheme = () => {
        if (typeof window === 'undefined') return themes.vsDark;
        const saved = localStorage.getItem('codeTheme') as CodeThemeName;
        return CODE_THEMES[saved] || themes.vsDark;
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Clean up language string
    const lang = language?.replace('language-', '') || 'text';

    return (
        <div className="relative group my-3 rounded-lg overflow-hidden bg-[#1e1e1e]">
            {/* Header with language and copy button */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
                <span className="text-xs text-neutral-400 font-mono uppercase">{lang}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                >
                    {copied ? (
                        <>
                            <CheckIcon />
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <CopyIcon />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>

            {/* Code with syntax highlighting */}
            <Highlight theme={getTheme()} code={code.trim()} language={lang as any}>
                {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                        className={`${className} overflow-x-auto p-4 text-sm leading-relaxed`}
                        style={{ ...style, margin: 0, background: 'transparent' }}
                    >
                        {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })}>
                                <span className="select-none text-neutral-600 mr-4 text-right inline-block w-6">
                                    {i + 1}
                                </span>
                                {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token })} />
                                ))}
                            </div>
                        ))}
                    </pre>
                )}
            </Highlight>
        </div>
    );
}

// Icons
const CopyIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);
