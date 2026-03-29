import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { useAcceptAssignment, useRejectAssignment } from '@/hooks/useDelivery';
import { formatCurrency, formatDistance, formatDuration } from '@/lib/utils';
import { useDeliveryStatus } from '@/hooks/useDelivery';

export default function AssignmentModal() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>();
  const { data: status } = useDeliveryStatus();
  const { mutate: accept, isPending: accepting } = useAcceptAssignment();
  const { mutate: reject, isPending: rejecting } = useRejectAssignment();

  // The assignment is embedded in the status query or passed via notification data
  // In practice it comes from the push payload; here we read from the active query
  const assignment = status?.activeAssignment;

  const handleAccept = useCallback(() => {
    const id = assignmentId ?? assignment?.id;
    if (!id) return;
    accept(id, {
      onSuccess: () => {
        router.replace('/(delivery)/active');
      },
      onError: () => {
        Alert.alert('Error', 'Could not accept the assignment. Please try again.');
      },
    });
  }, [assignmentId, assignment, accept]);

  const handleReject = useCallback(() => {
    const id = assignmentId ?? assignment?.id;
    if (!id) return;
    Alert.alert('Reject Assignment', 'Are you sure? This may affect your acceptance rate.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () =>
          reject(
            { assignmentId: id, reason: 'rejected_by_partner' },
            {
              onSuccess: () => router.back(),
            },
          ),
      },
    ]);
  }, [assignmentId, assignment, reject]);

  const handleTimeout = useCallback(() => {
    const id = assignmentId ?? assignment?.id;
    if (id) {
      reject({ assignmentId: id, reason: 'timeout' });
    }
    router.back();
  }, [assignmentId, assignment, reject]);

  if (!assignment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.noAssignment}>Assignment no longer available</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Dark header */}
      <View style={styles.header}>
        <Ionicons name="notifications" size={24} color="#F59E0B" />
        <Text style={styles.headerTitle}>New Assignment!</Text>
        <CountdownTimer seconds={60} onExpire={handleTimeout} size={72} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Earnings hero */}
        <View style={styles.earningsHero}>
          <Text style={styles.earningsLabel}>Estimated Earnings</Text>
          <Text style={styles.earningsAmount}>
            {formatCurrency(assignment.estimatedEarnings)}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={16} color="#C7D2FE" />
              <Text style={styles.metaText}>
                {formatDistance(assignment.estimatedDistance)}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#C7D2FE" />
              <Text style={styles.metaText}>
                {formatDuration(assignment.estimatedDuration)}
              </Text>
            </View>
          </View>
        </View>

        {/* Pickup detail */}
        <View style={styles.routeCard}>
          <View style={styles.routePoint}>
            <View style={[styles.dot, styles.dotStore]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeMain}>{assignment.storeName}</Text>
              <Text style={styles.routeSub}>{assignment.storeAddress}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePoint}>
            <View style={[styles.dot, styles.dotDest]} />
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>DELIVER TO</Text>
              <Text style={styles.routeMain}>{assignment.customerArea}</Text>
              {assignment.customerFloor ? (
                <Text style={styles.routeSub}>{assignment.customerFloor}</Text>
              ) : null}
              {assignment.customerLandmark ? (
                <Text style={styles.routeSub}>Near: {assignment.customerLandmark}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Order items */}
        {assignment.orderItems?.length > 0 && (
          <View style={styles.itemsCard}>
            <Text style={styles.itemsTitle}>Order Contents</Text>
            {assignment.orderItems.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>×{item.quantity}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.rejectBtn, rejecting && styles.btnDisabled]}
          onPress={handleReject}
          disabled={rejecting || accepting}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={22} color="#EF4444" />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptBtn, accepting && styles.btnDisabled]}
          onPress={handleAccept}
          disabled={accepting || rejecting}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={22} color="#fff" />
          <Text style={styles.acceptText}>{accepting ? 'Accepting…' : 'Accept'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noAssignment: { fontSize: 16, color: '#9CA3AF', marginBottom: 16 },
  backBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', flex: 1, marginLeft: 10 },
  content: { padding: 20, paddingBottom: 8 },
  earningsHero: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsLabel: { fontSize: 13, color: '#C7D2FE', fontWeight: '600', letterSpacing: 0.5 },
  earningsAmount: { fontSize: 42, fontWeight: '900', color: '#fff', marginTop: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 14, color: '#C7D2FE', fontWeight: '600' },
  metaDivider: { width: 1, height: 16, backgroundColor: '#6366F1' },
  routeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  routePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  dotStore: { backgroundColor: '#F59E0B' },
  dotDest: { backgroundColor: '#10B981' },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 1 },
  routeMain: { fontSize: 15, fontWeight: '700', color: '#F9FAFB', marginTop: 2 },
  routeSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#374151',
    marginLeft: 6,
    marginVertical: 4,
  },
  itemsCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  itemsTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, letterSpacing: 0.5 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  itemName: { fontSize: 14, color: '#F9FAFB' },
  itemQty: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 16,
  },
  rejectText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
  },
  acceptText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  btnDisabled: { opacity: 0.6 },
});
