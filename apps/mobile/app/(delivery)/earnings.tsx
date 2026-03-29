import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useEarnings } from '@/hooks/useDelivery';
import {
  formatCurrency,
  formatDistance,
  formatDateTime,
} from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type Period = 'today' | 'week' | 'month';

const TABS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export default function EarningsScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const { data, isLoading, refetch } = useEarnings(period);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      {/* Period Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, period === t.key && styles.tabActive]}
            onPress={() => setPeriod(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, period === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="Loading earnings…" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
        >
          {/* Total amount hero */}
          <View style={styles.earningsHero}>
            <Text style={styles.heroLabel}>Total Earnings</Text>
            <Text style={styles.heroAmount}>
              {formatCurrency(
                period === 'today'
                  ? (data?.today ?? 0)
                  : period === 'week'
                  ? (data?.thisWeek ?? 0)
                  : (data?.thisMonth ?? 0),
              )}
            </Text>
            <Text style={styles.heroSub}>
              {data?.deliveries?.length ?? 0} deliveries
            </Text>
          </View>

          {/* Performance metrics */}
          <View style={styles.metricsRow}>
            <MetricCard
              icon="checkmark-circle"
              iconColor="#10B981"
              label="On-Time Rate"
              value={`${data?.onTimeRate ?? 0}%`}
            />
            <MetricCard
              icon="hand-left"
              iconColor="#4F46E5"
              label="Acceptance"
              value={`${data?.acceptanceRate ?? 0}%`}
            />
            <MetricCard
              icon="star"
              iconColor="#F59E0B"
              label="Avg Rating"
              value={(data?.avgRating ?? 0).toFixed(1)}
            />
          </View>

          {/* Payout status */}
          <Card style={styles.payoutCard}>
            <View style={styles.payoutRow}>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutLabel}>Pending Payout</Text>
                <Text style={styles.payoutAmount}>
                  {formatCurrency(data?.pendingPayout ?? 0)}
                </Text>
              </View>
              <View style={styles.payoutDivider} />
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutLabel}>Next Payout</Text>
                <Text style={styles.payoutDate}>
                  {data?.nextPayoutDate
                    ? new Date(data.nextPayoutDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '—'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Per-delivery list */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery History</Text>
            {!data?.deliveries || data.deliveries.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No deliveries in this period</Text>
              </Card>
            ) : (
              data.deliveries.map((d) => (
                <Card key={d.id} style={styles.deliveryCard}>
                  <View style={styles.deliveryRow}>
                    <View style={styles.deliveryLeft}>
                      <Ionicons name="storefront-outline" size={16} color="#9CA3AF" />
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
      )}
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: any;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <Card style={styles.metricCard}>
      <Ionicons name={icon} size={24} color={iconColor} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  tabActive: { backgroundColor: '#EEF2FF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#4F46E5' },
  earningsHero: {
    backgroundColor: '#4F46E5',
    padding: 28,
    alignItems: 'center',
    marginBottom: 0,
  },
  heroLabel: { fontSize: 13, color: '#C7D2FE', fontWeight: '600', letterSpacing: 0.5 },
  heroAmount: { fontSize: 46, fontWeight: '900', color: '#fff', marginTop: 4 },
  heroSub: { fontSize: 13, color: '#A5B4FC', marginTop: 4 },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingTop: 16,
  },
  metricCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 6 },
  metricLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, textAlign: 'center' },
  payoutCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 14 },
  payoutRow: { flexDirection: 'row', alignItems: 'center' },
  payoutInfo: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  payoutLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  payoutAmount: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 4 },
  payoutDate: { fontSize: 16, fontWeight: '700', color: '#4F46E5', marginTop: 4 },
  payoutDivider: { width: 1, height: 44, backgroundColor: '#E5E7EB' },
  section: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 15, color: '#6B7280' },
  deliveryCard: { marginBottom: 10, borderRadius: 14 },
  deliveryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  deliveryLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  deliveryInfo: { flex: 1 },
  deliveryStore: { fontSize: 14, fontWeight: '700', color: '#111827' },
  deliveryCustomer: { fontSize: 13, color: '#374151', marginTop: 2 },
  deliveryMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  deliveryRight: { alignItems: 'flex-end', gap: 6 },
  deliveryAmount: { fontSize: 16, fontWeight: '800', color: '#111827' },
});
