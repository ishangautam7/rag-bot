export type Message = {
  id: string;
  content: string;
  timestamp: string;
  role: 'user' | 'assistant' | 'system';
};

