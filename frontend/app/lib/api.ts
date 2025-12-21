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

export const createSession = (message: string, model?: string, apiKey?: string) =>
  api.post<CreateSessionResponse>('/chat/sessions', { message, model, apiKey });

export const sendMessage = (sessionId: string, content: string, model?: string, apiKey?: string) =>
  api.post<SendMessageResponse>('/chat/message', { sessionId, content, model, apiKey });

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

export default api;


