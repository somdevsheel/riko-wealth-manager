import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import { useAppStore } from '../store/useAppStore';
import type {
  AffordabilityRequest,
  AffordabilityResponse,
  AskRequest,
  AskResponse,
  DashboardResponse,
  GoalsResponse,
  Profile,
  RecommendationsResponse,
  ScoreResponse,
  SpendingResponse,
} from './types';

export const queryKeys = {
  profile: ['profile'] as const,
  dashboard: (lang: string) => ['dashboard', lang] as const,
  spending: ['spending'] as const,
  score: (lang: string) => ['score', lang] as const,
  recommendations: (lang: string) => ['recommendations', lang] as const,
  goals: ['goals'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => (await apiClient.get<Profile>('/api/profile')).data,
  });
}

export function useDashboard() {
  const language = useAppStore((s) => s.language);
  return useQuery({
    queryKey: queryKeys.dashboard(language),
    queryFn: async () =>
      (await apiClient.get<DashboardResponse>('/api/dashboard', { params: { lang: language } })).data,
  });
}

export function useSpending() {
  return useQuery({
    queryKey: queryKeys.spending,
    queryFn: async () => (await apiClient.get<SpendingResponse>('/api/spending')).data,
  });
}

export function useScore() {
  const language = useAppStore((s) => s.language);
  return useQuery({
    queryKey: queryKeys.score(language),
    queryFn: async () =>
      (await apiClient.get<ScoreResponse>('/api/score', { params: { lang: language } })).data,
  });
}

export function useRecommendations() {
  const language = useAppStore((s) => s.language);
  return useQuery({
    queryKey: queryKeys.recommendations(language),
    queryFn: async () =>
      (
        await apiClient.get<RecommendationsResponse>('/api/recommendations', {
          params: { lang: language },
        })
      ).data,
  });
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: async () => (await apiClient.get<GoalsResponse>('/api/goals')).data,
  });
}

export function useAsk() {
  const language = useAppStore((s) => s.language);
  return useMutation({
    // The real LLM+RAG path (LLM_ENABLED=1) can take 10-20s on a local model,
    // well past the default client timeout, so /api/ask gets a longer budget.
    mutationFn: async (req: AskRequest) =>
      (
        await apiClient.post<AskResponse>(
          '/api/ask',
          { ...req, lang: req.lang ?? language },
          { timeout: 45000 },
        )
      ).data,
  });
}

export function useAffordability() {
  const language = useAppStore((s) => s.language);
  return useMutation({
    mutationFn: async (req: AffordabilityRequest) =>
      (
        await apiClient.post<AffordabilityResponse>('/api/affordability', {
          ...req,
          lang: req.lang ?? language,
        })
      ).data,
  });
}
