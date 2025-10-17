import { create } from 'zustand';
import type { User, DashboardData, FinancialAccount, ChatSession, FinancialAgent } from '../types';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Dashboard state
  dashboardData: DashboardData | null;
  setDashboardData: (data: DashboardData) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Accounts
  accounts: FinancialAccount[];
  setAccounts: (accounts: FinancialAccount[]) => void;
  
  // Chat state
  currentChatSession: ChatSession | null;
  setCurrentChatSession: (session: ChatSession | null) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  
  // Agents
  agents: FinancialAgent[];
  setAgents: (agents: FinancialAgent[]) => void;
  
  // Language
  language: 'en' | 'hi' | 'te' | 'ta' | 'ml';
  setLanguage: (lang: 'en' | 'hi' | 'te' | 'ta' | 'ml') => void;
  
  // Theme
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  dashboardData: null,
  loading: false,
  accounts: [],
  currentChatSession: null,
  chatOpen: false,
  agents: [],
  language: 'en',
  darkMode: false,
  
  // Actions
  setUser: (user) => set({ user }),
  setDashboardData: (data) => set({ dashboardData: data }),
  setLoading: (loading) => set({ loading }),
  setAccounts: (accounts) => set({ accounts }),
  setCurrentChatSession: (session) => set({ currentChatSession: session }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setAgents: (agents) => set({ agents }),
  setLanguage: (lang) => set({ language: lang }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
