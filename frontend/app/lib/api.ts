import axios from 'axios';
import type { AuthResponse, CreateSessionResponse, SendMessageResponse, Session, Message, UploadResponse } from './types';

const api = axios.create({
  baseURL: 'https://api.ishangautam7.com.np/api',
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

export const createSession = (message: string) =>
  api.post<CreateSessionResponse>('/chat/sessions', { message });

export const sendMessage = (sessionId: string, content: string, model?: string, apiKey?: string) =>
  api.post<SendMessageResponse>('/chat/message', { sessionId, content, model, apiKey });

export const getMessages = (sessionId: string) => api.get<Message[]>(`/chat/sessions/${sessionId}`);

export const uploadFile = (file: File, sessionId?: string) => {
  const form = new FormData();
  form.append('file', file);
  if (sessionId) form.append('sessionId', sessionId);
  return api.post<UploadResponse>('/chat/upload', form);
};

export default api;
