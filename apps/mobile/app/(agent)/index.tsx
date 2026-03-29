import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '@/store/auth.store';
import { useAgentDashboard } from '@/hooks/useAgent';
import { formatCurrency, formatDateTime, getGreeting } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AgentHome() {
  const { user, logout } = useAuthStore();
  const { data, isLoading, refetch } = useAgentDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const targetProgress =
    data && data.targetToday > 0 ? Math.min(data.actualToday / data.targetToday, 1) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.name}>{user?.name ?? 'Agent'}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.commissionBadge}>
            <Text style={styles.commissionLabel}>Commission</Text>
            <Text style={styles.commissionValue}>
              {formatCurrency(data?.commissionEarned ?? 0)}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="Loading dashboard…" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
        >
          {/* Today's Target Progress */}
          <Card style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <Text style={styles.targetTitle}>Today's Target</Text>
              <Text style={styles.targetCount}>
                {data?.actualToday ?? 0} / {data?.targetToday ?? 0} stores
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${targetProgress * 100}%` }]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {targetProgress >= 1
                ? 'Target achieved!'
                : `${data?.targetToday ? data.targetToday - (data?.actualToday ?? 0) : 0} more to hit today's target`}
            </Text>
          </Card>

          {/* Monthly stats row */}
          <View style={styles.statsRow}>
            <StatBox
              icon="storefront-outline"
              label="This Month"
              value={String(data?.monthlyOnboarded ?? 0)}
              color="#4F46E5"
              sub="stores"
            />
            <StatBox
              icon="time-outline"
              label="Pending"
              value={String(data?.storeBreakdown?.pending ?? 0)}
              color="#F59E0B"
              sub="applications"
            />
            <StatBox
              icon="checkmark-circle-outline"
              label="Approved"
              value={String(data?.storeBreakdown?.approved ?? 0)}
              color="#10B981"
              sub="stores"
            />
          </View>

          {/* Quick action */}
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(agent)/onboard')}
            activeOpacity={0.9}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="add-circle" size={28} color="#fff" />
            </View>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>Start Store Visit</Text>
              <Text style={styles.quickActionSub}>Onboard a new partner store</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Status breakdown */}
          <Card style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>Monthly Store Status</Text>
            <View style={styles.breakdownRow}>
              {[
                { label: 'Pending', count: data?.storeBreakdown?.pending ?? 0, status: 'pending' },
                { label: 'Approved', count: data?.storeBreakdown?.approved ?? 0, status: 'approved' },
                { label: 'Rejected', count: data?.storeBreakdown?.rejected ?? 0, status: 'rejected' },
              ].map((item) => (
                <View key={item.label} style={styles.breakdownItem}>
                  <StatusBadge status={item.status} />
                  <Text style={styles.breakdownCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Recent activity feed */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/(agent)/visits')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {!data?.recentActivity || data.recentActivity.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="map-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No recent activity</Text>
                <Text style={styles.emptySubtext}>Start visiting stores to build your record</Text>
              </Card>
            ) : (
              data.recentActivity.slice(0, 5).map((visit) => (
                <Card key={visit.id} style={styles.activityCard}>
                  <View style={styles.activityRow}>
                    <View style={styles.activityLeft}>
                      <Ionicons name="storefront-outline" size={16} color="#9CA3AF" />
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityStore}>{visit.storeName}</Text>
                        <Text style={styles.activityTime}>
                          {formatDateTime(visit.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <StatusBadge status={visit.outcome} />
                  </View>
                  {visit.notes ? (
                    <Text style={styles.activityNotes} numberOfLines={2}>
                      {visit.notes}
                    </Text>
                  ) : null}
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  sub: string;
}) {
  return (
    <Card style={styles.statBox}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
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
  commissionBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  commissionLabel: { fontSize: 10, color: '#C7D2FE', fontWeight: '600' },
  commissionValue: { fontSize: 15, color: '#fff', fontWeight: '800' },
  logoutBtn: { padding: 4 },
  targetCard: {
    margin: 16,
    marginTop: 16,
    borderRadius: 16,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  targetCount: { fontSize: 20, fontWeight: '800', color: '#4F46E5' },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  progressLabel: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 6 },
  statLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  statSub: { fontSize: 10, color: '#9CA3AF' },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: { flex: 1 },
  quickActionTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  quickActionSub: { fontSize: 12, color: '#C7D2FE', marginTop: 2 },
  breakdownCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 14 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  breakdownItem: { alignItems: 'center', gap: 8 },
  breakdownCount: { fontSize: 22, fontWeight: '800', color: '#111827' },
  section: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  seeAll: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  activityCard: { marginBottom: 10, borderRadius: 12 },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  activityInfo: { flex: 1 },
  activityStore: { fontSize: 14, fontWeight: '700', color: '#111827' },
  activityTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  activityNotes: { fontSize: 12, color: '#6B7280', marginTop: 8, lineHeight: 16 },
});
