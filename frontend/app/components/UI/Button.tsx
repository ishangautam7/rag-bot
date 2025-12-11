import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: ReactNode;
}

export default function Button({ 
  children, variant = 'primary', isLoading, icon, className, ...props 
}: ButtonProps) {
  const baseStyles = "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white"
  };

  return (
    <button 
      className={clsx(baseStyles, variants[variant], className)}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" size={18} /> : icon}
      {children}
    </button>
  );
}