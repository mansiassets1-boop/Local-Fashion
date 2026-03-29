import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApplicationStatus } from '@/hooks/useAgent';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const STATUS_STEPS = [
  { key: 'submitted', label: 'Application Submitted', icon: 'cloud-upload-outline' },
  { key: 'under_review', label: 'Under Review', icon: 'search-outline' },
  { key: 'approved', label: 'Approved', icon: 'checkmark-circle-outline' },
];

export default function ApplicationStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: application, isLoading, refetch } = useApplicationStatus(id);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const currentStatusIndex =
    application?.status === 'approved' || application?.status === 'rejected' ? 2 : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Status</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen message="Loading application…" />
      ) : !application ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={56} color="#D1D5DB" />
          <Text style={styles.errorText}>Application not found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
        >
          {/* Status hero */}
          <View
            style={[
              styles.statusHero,
              application.status === 'approved' && styles.heroApproved,
              application.status === 'rejected' && styles.heroRejected,
              application.status === 'pending' && styles.heroPending,
            ]}
          >
            <Ionicons
              name={
                application.status === 'approved'
                  ? 'checkmark-circle'
                  : application.status === 'rejected'
                  ? 'close-circle'
                  : 'time'
              }
              size={52}
              color="#fff"
            />
            <Text style={styles.heroStatus}>
              {application.status === 'approved'
                ? 'Application Approved!'
                : application.status === 'rejected'
                ? 'Application Rejected'
                : 'Under Review'}
            </Text>
            <Text style={styles.heroRef}>Ref: {application.trackingRef}</Text>
          </View>

          {/* Rejection reason */}
          {application.status === 'rejected' && application.rejectionReason && (
            <Card style={styles.rejectionCard}>
              <View style={styles.rejectionHeader}>
                <Ionicons name="information-circle" size={20} color="#DC2626" />
                <Text style={styles.rejectionTitle}>Reason for Rejection</Text>
              </View>
              <Text style={styles.rejectionText}>{application.rejectionReason}</Text>
            </Card>
          )}

          {/* Progress timeline */}
          <Card style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Application Progress</Text>
            {STATUS_STEPS.map((step, index) => {
              const isDone = index < currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const isRejected = application.status === 'rejected' && index === 2;
              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineIcon,
                        isDone && styles.timelineIconDone,
                        isCurrent && !isRejected && styles.timelineIconCurrent,
                        isRejected && styles.timelineIconRejected,
                      ]}
                    >
                      {isDone ? (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      ) : (
                        <Ionicons
                          name={step.icon as any}
                          size={14}
                          color={isCurrent ? '#fff' : '#9CA3AF'}
                        />
                      )}
                    </View>
                    {index < STATUS_STEPS.length - 1 && (
                      <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      style={[
                        styles.timelineLabel,
                        (isDone || isCurrent) && styles.timelineLabelActive,
                      ]}
                    >
                      {isRejected ? 'Rejected' : step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>

          {/* Application details */}
          <Card style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Store Details</Text>
            <DetailRow label="Store Name" value={application.storeName} />
            <DetailRow label="Owner Name" value={application.ownerName} />
            <DetailRow label="Phone" value={application.phone} />
            <DetailRow label="City" value={application.city} />
            <DetailRow label="Category" value={application.category} />
            <DetailRow label="Status" value="">
              <StatusBadge status={application.status} />
            </DetailRow>
            <DetailRow
              label="Submitted At"
              value={formatDateTime(application.submittedAt)}
            />
          </Card>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.replace('/(agent)')}
            >
              <Ionicons name="home-outline" size={18} color="#4F46E5" />
              <Text style={styles.homeBtnText}>Back to Home</Text>
            </TouchableOpacity>

            {application.status === 'rejected' && (
              <TouchableOpacity
                style={styles.resubmitBtn}
                onPress={() => router.replace('/(agent)/onboard')}
              >
                <Ionicons name="refresh-outline" size={18} color="#fff" />
                <Text style={styles.resubmitBtnText}>Submit New</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      {children ?? <Text style={detailStyles.value}>{value}</Text>}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: { fontSize: 13, color: '#6B7280', flex: 1 },
  value: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1.5, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4, width: 36 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#fff' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorText: { fontSize: 16, color: '#6B7280' },
  retryBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  statusHero: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
  },
  heroApproved: { backgroundColor: '#10B981' },
  heroRejected: { backgroundColor: '#EF4444' },
  heroPending: { backgroundColor: '#F59E0B' },
  heroStatus: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroRef: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  rejectionCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rejectionTitle: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  rejectionText: { fontSize: 13, color: '#374151', lineHeight: 19 },
  timelineCard: { margin: 16, borderRadius: 14 },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 16 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 32 },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconDone: { backgroundColor: '#10B981' },
  timelineIconCurrent: { backgroundColor: '#4F46E5' },
  timelineIconRejected: { backgroundColor: '#EF4444' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 4, minHeight: 20 },
  timelineLineDone: { backgroundColor: '#10B981' },
  timelineContent: { flex: 1, paddingBottom: 20 },
  timelineLabel: { fontSize: 14, color: '#9CA3AF', fontWeight: '500', paddingTop: 6 },
  timelineLabelActive: { color: '#111827', fontWeight: '700' },
  detailsCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 14 },
  detailsTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  homeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
  },
  homeBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 14 },
  resubmitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
  },
  resubmitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
