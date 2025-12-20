import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'outlined';
    hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hoverEffect = false, children, ...props }, ref) => {

        const baseStyles = "rounded-xl p-5 transition-all duration-200";

        const variants = {
            default: "bg-neutral-900 border border-neutral-800",
            glass: "glass",
            outlined: "bg-transparent border border-neutral-700"
        };

        const hoverStyles = hoverEffect ? "hover:border-neutral-700 hover:bg-neutral-800/50" : "";

        return (
            <div
                ref={ref}
                className={twMerge(baseStyles, variants[variant], hoverStyles, className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
