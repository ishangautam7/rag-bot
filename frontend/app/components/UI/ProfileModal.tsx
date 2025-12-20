'use client';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        email: string;
        username: string | null;
        avatar: string | null;
        createdAt: string;
    } | null;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
    if (!isOpen || !user) return null;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-sm mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                    <h2 className="text-lg font-medium text-neutral-100">Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-3 overflow-hidden">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.username || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl font-semibold text-neutral-400">
                                    {(user.username || user.email)?.[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-medium text-neutral-100">
                            {user.username || 'User'}
                        </h3>
                        <p className="text-sm text-neutral-500">{user.email}</p>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                            <span className="text-sm text-neutral-500">Member since</span>
                            <span className="text-sm text-neutral-300">{formatDate(user.createdAt)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                            <span className="text-sm text-neutral-500">User ID</span>
                            <span className="text-xs text-neutral-500 font-mono truncate max-w-[150px]">{user.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
