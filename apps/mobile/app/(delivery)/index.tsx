import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import type { LocationSubscription } from 'expo-location';

import { useAuthStore } from '@/store/auth.store';
import { deliveryApi } from '@/lib/api';
import {
  useDeliveryStatus,
  useDashboardStats,
  useRecentDeliveries,
  useSetOnline,
} from '@/hooks/useDelivery';
import { watchLocation } from '@/lib/location';
import { formatCurrency, formatDistance, formatDateTime, getGreeting } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DeliveryHome() {
  const { user, logout } = useAuthStore();
  const { data: status, refetch: refetchStatus } = useDeliveryStatus();
  const { data: stats, refetch: refetchStats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentDeliveries, refetch: refetchRecent } = useRecentDeliveries();
  const { mutate: setOnline, isPending: togglingOnline } = useSetOnline();
  const [refreshing, setRefreshing] = useState(false);

  const locationSub = useRef<LocationSubscription | null>(null);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCoords = useRef<{ latitude: number; longitude: number } | null>(null);

  const isOnline = status?.online ?? false;

  // Handle incoming push notifications (assignment alerts)
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as any;
      if (data?.type === 'new_assignment') {
        router.push({
          pathname: '/(delivery)/assignment-modal',
          params: { assignmentId: data.assignmentId },
        });
      }
    });
    return () => sub.remove();
  }, []);

  // Stop tracking when going offline or unmounting
  const stopTracking = useCallback(() => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  }, []);

  const startTracking = useCallback(async () => {
    try {
      const sub = await watchLocation((coords) => {
        latestCoords.current = coords;
      });
      locationSub.current = sub;

      // Send location to server every 10 seconds
      locationInterval.current = setInterval(async () => {
        if (latestCoords.current) {
          try {
            await deliveryApi.updateLocation(
              latestCoords.current.latitude,
              latestCoords.current.longitude,
            );
          } catch {
            // Silently queue or ignore network error
          }
        }
      }, 10_000);
    } catch (err: any) {
      Alert.alert('Location Error', err.message);
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [isOnline]);

  const handleToggleOnline = (value: boolean) => {
    if (value) {
      // Going online — request location first
      Alert.alert(
        'Go Online',
        'You will start receiving delivery assignments. Your location will be shared.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go Online',
            onPress: () => setOnline(true),
          },
        ],
      );
    } else {
      Alert.alert('Go Offline', 'You will stop receiving new assignments.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go Offline', style: 'destructive', onPress: () => setOnline(false) },
      ]);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          stopTracking();
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStatus(), refetchStats(), refetchRecent()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{user?.name ?? 'Partner'}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.earningsBadge}>
            <Text style={styles.earningsLabel}>Today</Text>
            <Text style={styles.earningsValue}>
              {formatCurrency(stats?.earningsToday ?? 0)}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
      >
        {/* Online / Offline Toggle */}
        <Card style={styles.onlineCard}>
          <View style={styles.onlineRow}>
            <View style={styles.onlineInfo}>
              <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
              <View>
                <Text style={styles.onlineTitle}>{isOnline ? 'You are Online' : 'You are Offline'}</Text>
                <Text style={styles.onlineSubtitle}>
                  {isOnline
                    ? 'Accepting deliveries · GPS active'
                    : 'Toggle to start receiving orders'}
                </Text>
              </View>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              disabled={togglingOnline}
              trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
              thumbColor={isOnline ? '#10B981' : '#9CA3AF'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
        </Card>

        {/* Active Delivery Banner */}
        {status?.activeAssignment && (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={() => router.push('/(delivery)/active')}
            activeOpacity={0.9}
          >
            <Ionicons name="bicycle" size={22} color="#fff" />
            <View style={styles.activeBannerText}>
              <Text style={styles.activeBannerTitle}>Active Delivery in Progress</Text>
              <Text style={styles.activeBannerSub}>
                {status.activeAssignment.storeName} → {status.activeAssignment.customerArea}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Stats Row */}
        {statsLoading ? (
          <LoadingSpinner message="Loading stats…" />
        ) : (
          <View style={styles.statsRow}>
            <StatCard
              icon="bicycle-outline"
              label="Today's Trips"
              value={String(stats?.todayDeliveries ?? 0)}
              color="#4F46E5"
            />
            <StatCard
              icon="wallet-outline"
              label="Week Earnings"
              value={formatCurrency(stats?.weekEarnings ?? 0)}
              color="#10B981"
            />
            <StatCard
              icon="checkmark-circle-outline"
              label="Acceptance"
              value={`${stats?.acceptanceRate ?? 0}%`}
              color="#F59E0B"
            />
          </View>
        )}

        {/* Recent Deliveries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Deliveries</Text>
          {!recentDeliveries || recentDeliveries.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="bicycle-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No recent deliveries</Text>
              <Text style={styles.emptySubtext}>Go online to start earning!</Text>
            </Card>
          ) : (
            recentDeliveries.slice(0, 5).map((d) => (
              <Card key={d.id} style={styles.deliveryCard}>
                <View style={styles.deliveryRow}>
                  <View style={styles.deliveryLeft}>
                    <Ionicons name="storefront-outline" size={16} color="#6B7280" />
                    <View style={styles.deliveryInfo}>
                      <Text style={styles.deliveryStore}>{d.storeName}</Text>
                      <Text style={styles.deliveryCustomer}>{d.customerArea}</Text>
                      <Text style={styles.deliveryMeta}>
                        {formatDistance(d.distance)} · {formatDateTime(d.completedAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.deliveryRight}>
                    <Text style={styles.deliveryAmount}>{formatCurrency(d.amount)}</Text>
                    <StatusBadge status={d.status} />
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  greeting: { fontSize: 14, color: '#C7D2FE' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  earningsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  earningsLabel: { fontSize: 10, color: '#C7D2FE', fontWeight: '600' },
  earningsValue: { fontSize: 15, color: '#fff', fontWeight: '800' },
  logoutBtn: { padding: 4 },
  onlineCard: {
    margin: 16,
    marginTop: -10,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.15,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlineInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  dotOnline: { backgroundColor: '#10B981' },
  dotOffline: { backgroundColor: '#9CA3AF' },
  onlineTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  onlineSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  activeBannerText: { flex: 1 },
  activeBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  activeBannerSub: { fontSize: 12, color: '#C7D2FE', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, textAlign: 'center' },
  section: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyCard: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  deliveryCard: { marginBottom: 10, borderRadius: 14 },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  deliveryLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  deliveryInfo: { flex: 1 },
  deliveryStore: { fontSize: 14, fontWeight: '700', color: '#111827' },
  deliveryCustomer: { fontSize: 13, color: '#374151', marginTop: 2 },
  deliveryMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  deliveryRight: { alignItems: 'flex-end', gap: 6 },
  deliveryAmount: { fontSize: 15, fontWeight: '800', color: '#111827' },
});
