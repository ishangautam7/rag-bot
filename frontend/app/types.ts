export type Message = {
  id: string;
  content: string;
  timestamp: string;
  role: 'user' | 'assistant' | 'system';
  attachments?: { name: string; type: string; url?: string }[];
};

