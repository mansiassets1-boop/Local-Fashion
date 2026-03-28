import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi, StoreOnboardPayload, VisitLog } from '@/lib/api';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const agentKeys = {
  all: ['agent'] as const,
  dashboard: () => [...agentKeys.all, 'dashboard'] as const,
  applications: () => [...agentKeys.all, 'applications'] as const,
  application: (id: string) => [...agentKeys.all, 'application', id] as const,
  visits: () => [...agentKeys.all, 'visits'] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useAgentDashboard() {
  return useQuery({
    queryKey: agentKeys.dashboard(),
    queryFn: () => agentApi.getDashboard().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useMyApplications() {
  return useQuery({
    queryKey: agentKeys.applications(),
    queryFn: () => agentApi.getMyApplications().then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useApplicationStatus(applicationId: string) {
  return useQuery({
    queryKey: agentKeys.application(applicationId),
    queryFn: () => agentApi.getApplicationStatus(applicationId).then((r) => r.data),
    refetchInterval: 60_000,
    enabled: !!applicationId,
  });
}

export function useVisits() {
  return useQuery({
    queryKey: agentKeys.visits(),
    queryFn: () => agentApi.getVisits().then((r) => r.data),
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useSendStoreOwnerOtp() {
  return useMutation({
    mutationFn: (phone: string) => agentApi.sendStoreOwnerOtp(phone).then((r) => r.data),
  });
}

export function useVerifyStoreOwnerOtp() {
  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      agentApi.verifyStoreOwnerOtp(phone, otp).then((r) => r.data),
  });
}

export function useOnboardStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => agentApi.onboardStore(formData).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.applications() });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard() });
    },
  });
}

export function useLogVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      storeName: string;
      outcome: VisitLog['outcome'];
      notes?: string;
      latitude: number;
      longitude: number;
    }) => agentApi.logVisit(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: agentKeys.visits() });
      qc.invalidateQueries({ queryKey: agentKeys.dashboard() });
    },
  });
}
