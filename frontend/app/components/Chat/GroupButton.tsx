'use client';

import { useState } from 'react';
import {
    convertToGroup,
    generateInvite,
    getMembers,
    removeMember,
    checkOwner,
    GroupMember
} from '@/app/lib/api';

interface GroupButtonProps {
    sessionId: string;
    isGroupChat?: boolean;
}

export default function GroupButton({ sessionId, isGroupChat: initialIsGroup = false }: GroupButtonProps) {
    const [isGroup, setIsGroup] = useState(initialIsGroup);
    const [isOwner, setIsOwner] = useState(false);
    const [inviteToken, setInviteToken] = useState<string | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [showPanel, setShowPanel] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchGroupData = async () => {
        if (hasFetched) return;
        try {
            const ownerRes = await checkOwner(sessionId);
            setIsOwner(ownerRes.data.isOwner);

            // Try to get members
            try {
                const membersRes = await getMembers(sessionId);
                if (membersRes.data.length > 0) {
                    setIsGroup(true);
                    setMembers(membersRes.data);
                }
            } catch {
                // Not a group chat yet - that's fine
            }
            setHasFetched(true);
        } catch {
            // User may not have access - that's fine
        }
    };

    const handleConvertToGroup = async () => {
        setLoading(true);
        try {
            await convertToGroup(sessionId);
            setIsGroup(true);
            // Generate invite immediately
            const res = await generateInvite(sessionId);
            setInviteToken(res.data.inviteToken);
            // Refresh members
            const membersRes = await getMembers(sessionId);
            setMembers(membersRes.data);
        } catch (err) {
            console.error('Failed to convert to group:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateInvite = async () => {
        setLoading(true);
        try {
            const res = await generateInvite(sessionId);
            setInviteToken(res.data.inviteToken);
        } catch (err) {
            console.error('Failed to generate invite:', err);
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

    const copyInviteLink = () => {
        if (inviteToken) {
            const url = `${window.location.origin}/join/${inviteToken}`;
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const inviteUrl = inviteToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteToken}` : '';

    return (
        <div className="relative">
            {/* Main Button */}
            <button
                onClick={() => isGroup ? setShowPanel(!showPanel) : handleConvertToGroup()}
                disabled={loading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isGroup
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                    }`}
                title={isGroup ? 'Group settings' : 'Convert to group chat'}
            >
                {loading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                )}
                {isGroup ? `${members.length} Members` : 'Group'}
            </button>

            {/* Panel */}
            {showPanel && isGroup && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50">
                    <div className="p-4">
                        <h3 className="text-sm font-medium text-white mb-3">Group Chat</h3>

                        {/* Invite Section */}
                        {isOwner && (
                            <div className="mb-4 pb-4 border-b border-[#2a2a2a]">
                                <label className="text-xs text-neutral-400 mb-2 block">Invite Link</label>
                                {inviteToken ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inviteUrl}
                                            readOnly
                                            className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-neutral-400 truncate"
                                        />
                                        <button
                                            onClick={copyInviteLink}
                                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
                                        >
                                            {copied ? '✓' : 'Copy'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleGenerateInvite}
                                        disabled={loading}
                                        className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
                                    >
                                        Generate Invite Link
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Members List */}
                        <div>
                            <label className="text-xs text-neutral-400 mb-2 block">Members</label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-2 bg-[#0d0d0d] rounded">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
                                                {member.user.avatar ? (
                                                    <img src={member.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    (member.user.username || member.user.email)?.[0]?.toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm text-white">
                                                    {member.user.username || member.user.email.split('@')[0]}
                                                </p>
                                                {member.role === 'OWNER' && (
                                                    <span className="text-xs text-yellow-500">Owner</span>
                                                )}
                                            </div>
                                        </div>
                                        {isOwner && member.role !== 'OWNER' && (
                                            <button
                                                onClick={() => handleRemoveMember(member.user.id)}
                                                className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                                                title="Remove member"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {showPanel && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowPanel(false)}
                />
            )}
        </div>
    );
}
