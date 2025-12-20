export type User = {
  id: string;
  email: string;
  username: string;
  avatar?: string | null;
  googleId?: string | null;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type Message = {
  id?: string;
  sessionId?: string;
  content: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  createdAt?: string;
};

export type Session = {
  id: string;
  userId: string;
  title?: string | null;
  updatedAt?: string;
  messages?: Message[];
};

export type CreateSessionResponse = Session;

export type SendMessageResponse = {
  userMessage: Message;
  botMessage: Message;
};

export type UploadResponse = {
  sessionId: string | null;
  file: {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  };
};

