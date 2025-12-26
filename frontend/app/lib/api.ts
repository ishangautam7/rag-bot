import axios from 'axios';
import type { AuthResponse, CreateSessionResponse, SendMessageResponse, Session, Message, UploadResponse } from './types';

const api = axios.create({
  // baseURL: 'https://api.ishangautam7.com.np/api',
  baseURL: 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const login = (payload: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', payload);

export const signup = (payload: { username: string; email: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', payload);

export const googleAuth = (token: string) =>
  api.post<AuthResponse>('/auth/google', { token });

export const getProfile = () =>
  api.get<{ id: string; email: string; username: string; avatar: string | null; createdAt: string }>('/auth/me');

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>('/auth/forgot-password', { email });

export const resetPassword = (email: string, token: string, password: string) =>
  api.post<{ message: string }>('/auth/reset-password', { email, token, password });

// Chat
export const getSessions = () => api.get<Session[]>('/chat/sessions');

export const createSession = (message: string, model?: string, apiKey?: string, apiEndpoint?: string) =>
  api.post<CreateSessionResponse>('/chat/sessions', { message, model, apiKey, apiEndpoint });

export const sendMessage = (sessionId: string, content: string, model?: string, apiKey?: string, apiEndpoint?: string) =>
  api.post<SendMessageResponse>('/chat/message', { sessionId, content, model, apiKey, apiEndpoint });

export const getMessages = (sessionId: string) => api.get<Message[]>(`/chat/sessions/${sessionId}`);

export const uploadFile = (file: File, sessionId?: string) => {
  const form = new FormData();
  form.append('file', file);
  if (sessionId) form.append('sessionId', sessionId);
  return api.post<UploadResponse>('/chat/upload', form);
};

// Share
export interface ShareStatus {
  isPublic: boolean;
  shareToken: string | null;
  sharedAt: string | null;
}

export interface SharedChat {
  id: string;
  title: string;
  sharedAt: string;
  user: { username: string; avatar: string | null };
  messages: Message[];
}

export const enableShare = (sessionId: string) =>
  api.post<{ shareToken: string; isPublic: boolean }>(`/chat/sessions/${sessionId}/share`);

export const disableShare = (sessionId: string) =>
  api.delete<{ isPublic: boolean }>(`/chat/sessions/${sessionId}/share`);

export const getShareStatus = (sessionId: string) =>
  api.get<ShareStatus>(`/chat/sessions/${sessionId}/share`);

export const getSharedChat = (token: string) =>
  api.get<SharedChat>(`/shared/${token}`);

// Group Chat
export interface GroupMember {
  id: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    username: string | null;
    email: string;
    avatar: string | null;
  };
}

export const createGroupChat = (title: string) =>
  api.post<Session>('/chat/group', { title });

export const convertToGroup = (sessionId: string) =>
  api.post<{ success: boolean }>(`/chat/sessions/${sessionId}/convert-to-group`);

export const generateInvite = (sessionId: string) =>
  api.post<{ inviteToken: string }>(`/chat/sessions/${sessionId}/invite`);

export const joinGroup = (token: string) =>
  api.post<{ sessionId: string; alreadyMember: boolean }>(`/chat/join/${token}`);

export const leaveGroup = (sessionId: string) =>
  api.post<{ success: boolean }>(`/chat/sessions/${sessionId}/leave`);

export const getMembers = (sessionId: string) =>
  api.get<GroupMember[]>(`/chat/sessions/${sessionId}/members`);

export const removeMember = (sessionId: string, userId: string) =>
  api.delete<{ success: boolean }>(`/chat/sessions/${sessionId}/members/${userId}`);

export const checkOwner = (sessionId: string) =>
  api.get<{ isOwner: boolean }>(`/chat/sessions/${sessionId}/is-owner`);

// Usage tracking
export const getUsage = () =>
  api.get<{ remaining: number; limit: number; used: number }>('/usage');

// Session management
export const renameSession = (sessionId: string, title: string) =>
  api.patch<Session>(`/chat/sessions/${sessionId}`, { title });

// Admin APIs
export interface AdminUser {
  id: string;
  email: string;
  username: string | null;
  avatar: string | null;
  isAdmin: boolean;
  allowedModels: string[];
  createdAt: string;
  todayUsage: number;
  _count: { sessions: number; sentMessages: number };
}

export interface GrantableModel {
  id: string;
  name: string;
  description: string;
}

export const adminGetUsers = () =>
  api.get<AdminUser[]>('/admin/users');

export const adminGetUser = (userId: string) =>
  api.get<AdminUser>(`/admin/users/${userId}`);

export const adminResetUsage = (userId: string) =>
  api.post<{ message: string }>(`/admin/users/${userId}/reset-usage`);

export const adminUpdateAllowedModels = (userId: string, models: string[]) =>
  api.post<{ message: string; user: AdminUser }>(`/admin/users/${userId}/allowed-models`, { models });

export const adminBroadcast = (subject: string, content: string, userIds?: string[]) =>
  api.post<{ message: string; sent: number; recipients?: string[] }>('/admin/broadcast', { subject, content, userIds });

export const adminGetModels = () =>
  api.get<GrantableModel[]>('/admin/models');

// Folders
export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  _count?: { sessions: number };
}

export const getFolders = () =>
  api.get<Folder[]>('/folders');

export const createFolder = (name: string, color?: string) =>
  api.post<Folder>('/folders', { name, color });

export const updateFolder = (folderId: string, data: { name?: string; color?: string }) =>
  api.patch<Folder>(`/folders/${folderId}`, data);

export const deleteFolder = (folderId: string) =>
  api.delete(`/folders/${folderId}`);

export const moveToFolder = (sessionId: string, folderId: string | null) =>
  api.post<{ folderId: string | null }>(`/chat/sessions/${sessionId}/folder`, { folderId });

// Pin
export const togglePin = (sessionId: string) =>
  api.post<{ isPinned: boolean }>(`/chat/sessions/${sessionId}/pin`);

// Search
export interface SearchResult {
  sessions: Session[];
  messages: Array<{
    id: string;
    content: string;
    role: string;
    createdAt: string;
    session: { id: string; title: string };
  }>;
}

export const searchChats = (query: string) =>
  api.get<SearchResult>(`/chat/search?q=${encodeURIComponent(query)}`);

// Export
export const exportChat = (sessionId: string, format: 'json' | 'md' | 'txt') =>
  api.get<Blob>(`/chat/sessions/${sessionId}/export?format=${format}`, { responseType: 'blob' });

// Templates
export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  category: string;
  description?: string;
  userId?: string;
}

export const getTemplates = () =>
  api.get<PromptTemplate[]>('/templates');

export const createTemplate = (data: { name: string; prompt: string; category?: string; description?: string }) =>
  api.post<PromptTemplate>('/templates', data);

export const deleteTemplate = (templateId: string) =>
  api.delete(`/templates/${templateId}`);

// Delete session (using existing route - just alias for clarity)
export const deleteSession = (sessionId: string) =>
  api.delete(`/chat/sessions/${sessionId}`);

// Activity & Metrics (Admin)
export interface ActivityLog {
  id: string;
  action: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
  user: { id: string; email: string; username: string | null };
}

export interface ResponseMetrics {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  count: number;
  history: Array<{ date: string; avg: number; count: number }>;
}

export const adminGetActivity = (params?: { userId?: string; action?: string; limit?: number }) =>
  api.get<{ logs: ActivityLog[]; total: number }>('/admin/activity', { params });

export const adminGetMetrics = (days?: number) =>
  api.get<ResponseMetrics>('/admin/metrics', { params: { days } });

export default api;
