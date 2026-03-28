import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const TOKEN_KEY = 'auth_token';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT from SecureStore
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      // Caller should handle navigation to login
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  sendOtp: (phone: string) =>
    apiClient.post<{ message: string }>('/auth/send-otp', { phone }),

  verifyOtp: (phone: string, otp: string) =>
    apiClient.post<{
      token: string;
      user: {
        id: string;
        name: string;
        phone: string;
        role: 'delivery' | 'agent';
        avatar?: string;
      };
    }>('/auth/verify-otp', { phone, otp }),

  updateFcmToken: (fcmToken: string) =>
    apiClient.post('/auth/update-fcm', { fcmToken }),

  logout: () => apiClient.post('/auth/logout'),
};

// ─── Delivery ────────────────────────────────────────────────────────────────

export interface DeliveryAssignment {
  id: string;
  storeName: string;
  storeAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  customerArea: string;
  customerFloor?: string;
  customerLandmark?: string;
  customerLatitude?: number;
  customerLongitude?: number;
  estimatedEarnings: number;
  estimatedDistance: number;
  estimatedDuration: number;
  status: 'assigned' | 'arrived_store' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'failed';
  orderItems: Array<{ name: string; quantity: number }>;
  otp?: string;
  createdAt: string;
}

export interface EarningsEntry {
  id: string;
  storeName: string;
  customerArea: string;
  distance: number;
  amount: number;
  completedAt: string;
  status: 'paid' | 'pending';
}

export interface EarningsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  pendingPayout: number;
  nextPayoutDate: string;
  onTimeRate: number;
  acceptanceRate: number;
  avgRating: number;
  deliveries: EarningsEntry[];
}

export const deliveryApi = {
  getStatus: () =>
    apiClient.get<{ online: boolean; activeAssignment: DeliveryAssignment | null }>('/delivery/status'),

  setOnline: (online: boolean) =>
    apiClient.post<{ online: boolean }>('/delivery/online', { online }),

  updateLocation: (latitude: number, longitude: number) =>
    apiClient.post('/delivery/location', { latitude, longitude }),

  getActiveAssignment: () =>
    apiClient.get<DeliveryAssignment | null>('/delivery/active'),

  acceptAssignment: (assignmentId: string) =>
    apiClient.post(`/delivery/assignments/${assignmentId}/accept`),

  rejectAssignment: (assignmentId: string, reason?: string) =>
    apiClient.post(`/delivery/assignments/${assignmentId}/reject`, { reason }),

  updateAssignmentStatus: (
    assignmentId: string,
    status: DeliveryAssignment['status'],
    payload?: Record<string, unknown>,
  ) =>
    apiClient.patch(`/delivery/assignments/${assignmentId}/status`, { status, ...payload }),

  confirmDelivery: (assignmentId: string, otp: string) =>
    apiClient.post(`/delivery/assignments/${assignmentId}/confirm`, { otp }),

  reportIssue: (assignmentId: string, issue: string, notes?: string) =>
    apiClient.post(`/delivery/assignments/${assignmentId}/issue`, { issue, notes }),

  getEarnings: (period: 'today' | 'week' | 'month') =>
    apiClient.get<EarningsSummary>(`/delivery/earnings?period=${period}`),

  getRecentDeliveries: () =>
    apiClient.get<EarningsEntry[]>('/delivery/recent'),

  getDashboardStats: () =>
    apiClient.get<{
      todayDeliveries: number;
      weekEarnings: number;
      acceptanceRate: number;
      earningsToday: number;
    }>('/delivery/dashboard'),
};

// ─── Agent ───────────────────────────────────────────────────────────────────

export interface StoreOnboardPayload {
  ownerName: string;
  storeName: string;
  phone: string;
  city: string;
  category: string;
  address: string;
  latitude?: number;
  longitude?: number;
  gstNumber?: string;
  prepTime: number;
  returnPolicyDays: number;
  bankAccount: string;
  ifscCode: string;
  exteriorPhotoUri: string;
  idProofUri: string;
  productPhotoUris?: string[];
  ownerConsentOtp: string;
}

export interface StoreApplication {
  id: string;
  storeName: string;
  ownerName: string;
  phone: string;
  city: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  trackingRef: string;
}

export interface VisitLog {
  id: string;
  storeName: string;
  outcome: 'onboarded' | 'interested' | 'not_interested' | 'already_listed';
  notes?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export const agentApi = {
  getDashboard: () =>
    apiClient.get<{
      agentName: string;
      targetToday: number;
      actualToday: number;
      monthlyOnboarded: number;
      commissionEarned: number;
      storeBreakdown: { pending: number; approved: number; rejected: number };
      recentActivity: VisitLog[];
    }>('/agent/dashboard'),

  sendStoreOwnerOtp: (phone: string) =>
    apiClient.post('/agent/store-owner-otp', { phone }),

  verifyStoreOwnerOtp: (phone: string, otp: string) =>
    apiClient.post<{ verified: boolean }>('/agent/verify-store-owner-otp', { phone, otp }),

  onboardStore: (formData: FormData) =>
    apiClient.post<{ trackingRef: string; applicationId: string }>('/seller/onboard', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getApplicationStatus: (applicationId: string) =>
    apiClient.get<StoreApplication>(`/agent/applications/${applicationId}`),

  getMyApplications: () =>
    apiClient.get<StoreApplication[]>('/agent/applications'),

  logVisit: (data: {
    storeName: string;
    outcome: VisitLog['outcome'];
    notes?: string;
    latitude: number;
    longitude: number;
  }) => apiClient.post<VisitLog>('/agent/visits', data),

  getVisits: () => apiClient.get<VisitLog[]>('/agent/visits'),
};
