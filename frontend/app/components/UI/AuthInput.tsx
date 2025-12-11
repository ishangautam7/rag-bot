interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
  }
  
export default function AuthInput({ label, error, ...props }: AuthInputProps) {
  return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-300 pl-1">{label}</label>
        <input
          className={`bg-gray-900/60 backdrop-blur-sm border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500/30'} text-white rounded-2xl px-4 py-3 outline-none transition-all placeholder:text-gray-500 shadow-inner focus:ring-2`}
          {...props}
        />
        {error && <span className="text-xs text-red-400 pl-1">{error}</span>}
      </div>
  );
}
