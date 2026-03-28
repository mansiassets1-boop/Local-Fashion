import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi, DeliveryAssignment } from '@/lib/api';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const deliveryKeys = {
  all: ['delivery'] as const,
  status: () => [...deliveryKeys.all, 'status'] as const,
  active: () => [...deliveryKeys.all, 'active'] as const,
  dashboard: () => [...deliveryKeys.all, 'dashboard'] as const,
  recent: () => [...deliveryKeys.all, 'recent'] as const,
  earnings: (period: string) => [...deliveryKeys.all, 'earnings', period] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useDeliveryStatus() {
  return useQuery({
    queryKey: deliveryKeys.status(),
    queryFn: () => deliveryApi.getStatus().then((r) => r.data),
    refetchInterval: 15_000, // Poll every 15s to detect new assignments
  });
}

export function useActiveAssignment() {
  return useQuery({
    queryKey: deliveryKeys.active(),
    queryFn: () => deliveryApi.getActiveAssignment().then((r) => r.data),
    refetchInterval: 10_000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: deliveryKeys.dashboard(),
    queryFn: () => deliveryApi.getDashboardStats().then((r) => r.data),
    staleTime: 30_000,
  });
}

export function useRecentDeliveries() {
  return useQuery({
    queryKey: deliveryKeys.recent(),
    queryFn: () => deliveryApi.getRecentDeliveries().then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useEarnings(period: 'today' | 'week' | 'month') {
  return useQuery({
    queryKey: deliveryKeys.earnings(period),
    queryFn: () => deliveryApi.getEarnings(period).then((r) => r.data),
    staleTime: 30_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useSetOnline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (online: boolean) => deliveryApi.setOnline(online).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.status() });
    },
  });
}

export function useAcceptAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      deliveryApi.acceptAssignment(assignmentId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.active() });
      qc.invalidateQueries({ queryKey: deliveryKeys.status() });
    },
  });
}

export function useRejectAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: string; reason?: string }) =>
      deliveryApi.rejectAssignment(assignmentId, reason).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.status() });
    },
  });
}

export function useUpdateAssignmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      status,
      payload,
    }: {
      assignmentId: string;
      status: DeliveryAssignment['status'];
      payload?: Record<string, unknown>;
    }) => deliveryApi.updateAssignmentStatus(assignmentId, status, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.active() });
      qc.invalidateQueries({ queryKey: deliveryKeys.dashboard() });
    },
  });
}

export function useConfirmDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, otp }: { assignmentId: string; otp: string }) =>
      deliveryApi.confirmDelivery(assignmentId, otp).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.active() });
      qc.invalidateQueries({ queryKey: deliveryKeys.dashboard() });
      qc.invalidateQueries({ queryKey: deliveryKeys.recent() });
    },
  });
}

export function useReportIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      issue,
      notes,
    }: {
      assignmentId: string;
      issue: string;
      notes?: string;
    }) => deliveryApi.reportIssue(assignmentId, issue, notes).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deliveryKeys.active() });
    },
  });
}
