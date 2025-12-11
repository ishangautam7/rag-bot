// components/UI/AuthInput.tsx
import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function AuthInput({ label, error, ...props }: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-slate-400 pl-0.5">
        {label}
      </label>
      <input
        className={`
          w-full bg-slate-950/50 text-slate-200 
          border transition-all duration-200 ease-in-out
          rounded-lg px-4 py-3 text-sm outline-none 
          placeholder:text-slate-600
          ${error 
            ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20' 
            : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 hover:border-slate-700'
          }
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-400 font-medium animate-pulse">{error}</span>}
    </div>
  );
}