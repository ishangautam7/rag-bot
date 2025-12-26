'use client';

import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
    glowColor?: 'primary' | 'accent' | 'none';
    padding?: 'sm' | 'md' | 'lg' | 'none';
}

export const Card = ({
    children,
    className = '',
    hoverEffect = false,
    glowColor = 'none',
    padding = 'md',
}: CardProps) => {
    const baseStyles = 'rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] backdrop-blur-xl transition-all duration-300';

    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const hoverStyles = hoverEffect
        ? 'hover:border-[var(--color-primary)] hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1 cursor-pointer'
        : '';

    const glowStyles = {
        none: '',
        primary: 'shadow-lg shadow-violet-500/10',
        accent: 'shadow-lg shadow-cyan-500/10',
    };

    return (
        <div className={`${baseStyles} ${paddingStyles[padding]} ${hoverStyles} ${glowStyles[glowColor]} ${className}`}>
            {children}
        </div>
    );
};
