'use client';

import { useState, useEffect } from 'react';
import {
    enableShare,
    disableShare,
    getShareStatus,
    convertToGroup,
    generateInvite,
    getMembers,
    removeMember,
    checkOwner,
    GroupMember
} from '@/app/lib/api';

interface ShareButtonProps {
    sessionId: string;
}

type ViewMode = 'menu' | 'read-only' | 'collaborate';

export default function ShareButton({ sessionId }: ShareButtonProps) {
    const [isOwner, setIsOwner] = useState(true); // Default to true until we check
    const [isShared, setIsShared] = useState(false);
    const [isCollaborative, setIsCollaborative] = useState(false);
    const [shareToken, setShareToken] = useState<string | null>(null);
    const [inviteToken, setInviteToken] = useState<string | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('menu');

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Check ownership
                const ownerRes = await checkOwner(sessionId);
                setIsOwner(ownerRes.data.isOwner);

                // Check share status
                const res = await getShareStatus(sessionId);
                if (res.data.isPublic && res.data.shareToken) {
                    setIsShared(true);
                    setShareToken(res.data.shareToken);
                }
                // Check if collaborative
                try {
                    const membersRes = await getMembers(sessionId);
                    if (membersRes.data.length > 0) {
                        setIsCollaborative(true);
                        setMembers(membersRes.data);
                        setInviteToken(res.data.shareToken);
                    }
                } catch {
                    // Not collaborative
                }
            } catch {
                // Not shared or no access
            }
        };
        if (sessionId) fetchStatus();
    }, [sessionId]);

    const handleEnableReadOnly = async () => {
        setLoading(true);
        try {
            const res = await enableShare(sessionId);
            setIsShared(true);
            setShareToken(res.data.shareToken);
        } catch (err) {
            console.error('Failed to enable sharing:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDisableReadOnly = async () => {
        setLoading(true);
        try {
            await disableShare(sessionId);
            setIsShared(false);
            setShareToken(null);
        } catch (err) {
            console.error('Failed to disable sharing:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEnableCollaborate = async () => {
        setLoading(true);
        try {
            await convertToGroup(sessionId);
            const res = await generateInvite(sessionId);
            setIsCollaborative(true);
            setInviteToken(res.data.inviteToken);
            const membersRes = await getMembers(sessionId);
            setMembers(membersRes.data);
        } catch (err) {
            console.error('Failed to enable collaboration:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        try {
            await removeMember(sessionId, userId);
            setMembers(prev => prev.filter(m => m.user.id !== userId));
        } catch (err) {
            console.error('Failed to remove member:', err);
        }
    };

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const readOnlyUrl = shareToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${shareToken}` : '';
    const collaborateUrl = inviteToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteToken}` : '';

    const hasAnySharing = isShared || isCollaborative;

    return (
        <div className="relative">
            <button
                onClick={() => { setShowDropdown(!showDropdown); setViewMode('menu'); }}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${hasAnySharing
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                    }`}
                title="Share options"
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                )}
                Share
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50">
                    <div className="p-4">
                        {/* Header with back button */}
                        <div className="flex items-center gap-2 mb-3">
                            {viewMode !== 'menu' && (
                                <button
                                    onClick={() => setViewMode('menu')}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                >
                                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                            <h3 className="text-sm font-medium text-white">
                                {viewMode === 'menu' && 'Share Options'}
                                {viewMode === 'read-only' && 'View Only Access'}
                                {viewMode === 'collaborate' && 'Collaborate Access'}
                            </h3>
                        </div>

                        {/* Menu View */}
                        {viewMode === 'menu' && (
                            <div className="space-y-2">
                                {/* Member View - Just show they're a collaborator */}
                                {!isOwner && isCollaborative && (
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <p className="text-sm font-medium text-white">You're a Collaborator</p>
                                        </div>
                                        <p className="text-xs text-neutral-400">You can view and send messages in this chat. Only the owner can manage sharing settings.</p>
                                        {members.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-blue-500/30">
                                                <p className="text-xs text-neutral-400 mb-2">{members.length} collaborators</p>
                                                <div className="flex -space-x-2">
                                                    {members.slice(0, 5).map((member) => (
                                                        <div key={member.id} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] border-2 border-[#1a1a1a]" title={member.user.username || member.user.email}>
                                                            {member.user.avatar ? (
                                                                <img src={member.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                                            ) : (
                                                                (member.user.username || member.user.email)?.[0]?.toUpperCase()
                                                            )}
                                                        </div>
                                                    ))}
                                                    {members.length > 5 && (
                                                        <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-white text-[10px] border-2 border-[#1a1a1a]">
                                                            +{members.length - 5}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Owner View - Full controls */}
                                {isOwner && (
                                    <>
                                        {/* Read-Only Option */}
                                        <div
                                            onClick={() => setViewMode('read-only')}
                                            className="p-3 bg-[#0d0d0d] hover:bg-[#161616] border border-[#2a2a2a] rounded-lg cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">View Only</p>
                                                        <p className="text-xs text-neutral-500">Anyone can read this chat</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isShared && (
                                                        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                                                    )}
                                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collaborate Option */}
                                        <div
                                            onClick={() => setViewMode('collaborate')}
                                            className="p-3 bg-[#0d0d0d] hover:bg-[#161616] border border-[#2a2a2a] rounded-lg cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">Collaborate</p>
                                                        <p className="text-xs text-neutral-500">Invite others to chat together</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isCollaborative && (
                                                        <span className="w-2 h-2 bg-blue-400 rounded-full" />
                                                    )}
                                                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Not owner and not collaborative - show message */}
                                {!isOwner && !isCollaborative && (
                                    <div className="p-3 bg-neutral-800/50 rounded-lg">
                                        <p className="text-sm text-neutral-400">You do not have permission to manage sharing for this chat.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Read-Only View */}
                        {viewMode === 'read-only' && (
                            <div>
                                {!isShared ? (
                                    <button
                                        onClick={handleEnableReadOnly}
                                        disabled={loading}
                                        className="w-full p-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        Enable View-Only Link
                                    </button>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded">
                                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-xs text-emerald-400">View-only link is active</span>
                                        </div>

                                        <label className="text-xs text-neutral-400 mb-1 block">Share Link</label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={readOnlyUrl}
                                                readOnly
                                                className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-neutral-400 truncate"
                                            />
                                            <button
                                                onClick={() => copyLink(readOnlyUrl)}
                                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded transition-colors"
                                            >
                                                {copied ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleDisableReadOnly}
                                            disabled={loading}
                                            className="w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                            Disable Link
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Collaborate View */}
                        {viewMode === 'collaborate' && (
                            <div>
                                {!isCollaborative ? (
                                    <button
                                        onClick={handleEnableCollaborate}
                                        disabled={loading}
                                        className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Enable Collaboration
                                    </button>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2 mb-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-xs text-blue-400">Collaboration is active</span>
                                        </div>

                                        <label className="text-xs text-neutral-400 mb-1 block">Invite Link</label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={collaborateUrl}
                                                readOnly
                                                className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-neutral-400 truncate"
                                            />
                                            <button
                                                onClick={() => copyLink(collaborateUrl)}
                                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
                                            >
                                                {copied ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>

                                        {/* Members */}
                                        {members.length > 0 && (
                                            <div className="mb-3">
                                                <label className="text-xs text-neutral-400 mb-1 block">Collaborators ({members.length})</label>
                                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                                    {members.map((member) => (
                                                        <div key={member.id} className="flex items-center justify-between p-1.5 bg-[#0d0d0d] rounded text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px]">
                                                                    {member.user.avatar ? (
                                                                        <img src={member.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                                                    ) : (
                                                                        (member.user.username || member.user.email)?.[0]?.toUpperCase()
                                                                    )}
                                                                </div>
                                                                <span className="text-white">
                                                                    {member.user.username || member.user.email.split('@')[0]}
                                                                    {member.role === 'OWNER' && <span className="text-yellow-500 ml-1">(Owner)</span>}
                                                                </span>
                                                            </div>
                                                            {member.role !== 'OWNER' && (
                                                                <button
                                                                    onClick={() => handleRemoveMember(member.user.id)}
                                                                    className="p-0.5 text-neutral-500 hover:text-red-400 transition-colors"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
}
