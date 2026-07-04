import { create } from 'zustand';

export type Language = 'en' | 'hi';

interface AppState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
  language: 'en',
  setLanguage: (language) => set({ language }),
}));
