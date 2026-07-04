import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  source?: 'llm' | 'rule_based';
}

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
}

let nextId = 0;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: `${Date.now()}-${nextId++}` }],
    })),
}));
