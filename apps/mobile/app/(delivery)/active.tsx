import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { LocationSubscription } from 'expo-location';

import { deliveryApi, DeliveryAssignment } from '@/lib/api';
import {
  useActiveAssignment,
  useUpdateAssignmentStatus,
  useConfirmDelivery,
  useReportIssue,
} from '@/hooks/useDelivery';
import { watchLocation } from '@/lib/location';
import { buildGoogleMapsUrl } from '@/lib/location';
import { formatCurrency, formatDistance, formatDuration } from '@/lib/utils';
import { DeliveryMap } from '@/components/delivery/DeliveryMap';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ActiveDeliveryScreen() {
  const { data: assignment, isLoading, refetch } = useActiveAssignment();
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateAssignmentStatus();
  const { mutate: confirmDelivery, isPending: confirming } = useConfirmDelivery();
  const { mutate: reportIssue, isPending: reportingIssue } = useReportIssue();

  const [partnerLocation, setPartnerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [issueNotes, setIssueNotes] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');

  const locationSub = useRef<LocationSubscription | null>(null);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestCoords = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sub = await watchLocation((coords) => {
          if (mounted) {
            setPartnerLocation(coords);
            latestCoords.current = coords;
          }
        });
        locationSub.current = sub;

        locationInterval.current = setInterval(async () => {
          if (latestCoords.current) {
            try {
              await deliveryApi.updateLocation(
                latestCoords.current.latitude,
                latestCoords.current.longitude,
              );
            } catch {}
          }
        }, 10_000);
      } catch {}
    })();

    return () => {
      mounted = false;
      locationSub.current?.remove();
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, []);

  const handleArrivedAtStore = () => {
    if (!assignment) return;
    Alert.alert('Arrived at Store', 'Confirm that you are at the store.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () =>
          updateStatus(
            { assignmentId: assignment.id, status: 'arrived_store' },
            { onSuccess: () => refetch() },
          ),
      },
    ]);
  };

  const handlePickedUp = () => {
    if (!assignment) return;
    Alert.alert('Order Picked Up', 'Confirm you have collected the order from the store.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () =>
          updateStatus(
            { assignmentId: assignment.id, status: 'picked_up' },
            { onSuccess: () => refetch() },
          ),
      },
    ]);
  };

  const handleConfirmDelivery = () => {
    if (!assignment) return;
    if (otpInput.length !== 4 && otpInput.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the customer OTP.');
      return;
    }
    confirmDelivery(
      { assignmentId: assignment.id, otp: otpInput },
      {
        onSuccess: () => {
          Alert.alert('Delivered!', 'Great job! The delivery is complete.', [
            { text: 'OK', onPress: () => refetch() },
          ]);
          setOtpInput('');
        },
        onError: () => Alert.alert('Invalid OTP', 'The OTP is incorrect. Please check with the customer.'),
      },
    );
  };

  const handleOpenNavigation = () => {
    if (!assignment) return;
    const dest =
      assignment.status === 'out_for_delivery' && assignment.customerLatitude
        ? { latitude: assignment.customerLatitude, longitude: assignment.customerLongitude! }
        : { latitude: assignment.storeLatitude, longitude: assignment.storeLongitude };
    const label = assignment.status === 'out_for_delivery' ? assignment.customerArea : assignment.storeName;
    const url = buildGoogleMapsUrl(dest, label);
    Linking.openURL(url);
  };

  const handleReportIssue = () => {
    if (!selectedIssue) {
      Alert.alert('Select Issue', 'Please select an issue type.');
      return;
    }
    if (!assignment) return;
    reportIssue(
      { assignmentId: assignment.id, issue: selectedIssue, notes: issueNotes },
      {
        onSuccess: () => {
          setShowReportModal(false);
          setSelectedIssue('');
          setIssueNotes('');
          Alert.alert('Issue Reported', 'Our team will look into this.');
          refetch();
        },
      },
    );
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading delivery…" />;

  if (!assignment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.noDelivery}>
          <Ionicons name="bicycle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.noDeliveryTitle}>No Active Delivery</Text>
          <Text style={styles.noDeliveryText}>
            Go online and accept an assignment to see it here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const showStorePinOnMap =
    assignment.status === 'assigned' || assignment.status === 'arrived_store';
  const showDestPin =
    assignment.status === 'out_for_delivery' && !!assignment.customerLatitude;

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <DeliveryMap
        partnerLocation={partnerLocation ?? undefined}
        storeLocation={
          showStorePinOnMap
            ? { latitude: assignment.storeLatitude, longitude: assignment.storeLongitude }
            : undefined
        }
        destinationLocation={
          showDestPin && assignment.customerLatitude
            ? { latitude: assignment.customerLatitude!, longitude: assignment.customerLongitude! }
            : undefined
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Navigation button */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <TouchableOpacity style={styles.navBtn} onPress={handleOpenNavigation} activeOpacity={0.9}>
          <Ionicons name="navigate" size={20} color="#fff" />
          <Text style={styles.navBtnText}>Navigate</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom status card */}
      <View style={styles.bottomCard}>
        {/* Status indicator */}
        <View style={styles.statusHeader}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>{getStatusLabel(assignment.status)}</Text>
          </View>
          <Text style={styles.earningsChip}>{formatCurrency(assignment.estimatedEarnings)}</Text>
        </View>

        {/* ── assigned / arrived_store ─────────────────────────────────── */}
        {(assignment.status === 'assigned' || assignment.status === 'arrived_store') && (
          <View>
            <Text style={styles.instructionHeading}>
              Head to {assignment.storeName}
            </Text>
            <Text style={styles.addressText}>{assignment.storeAddress}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="navigate-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>
                {formatDistance(assignment.estimatedDistance)} ·{' '}
                {formatDuration(assignment.estimatedDuration)} away
              </Text>
            </View>

            {assignment.status === 'assigned' ? (
              <Button
                title="I've Arrived at Store"
                variant="primary"
                size="lg"
                fullWidth
                loading={updatingStatus}
                onPress={handleArrivedAtStore}
                style={styles.actionBtn}
              />
            ) : (
              <Button
                title="Order Picked Up"
                variant="primary"
                size="lg"
                fullWidth
                loading={updatingStatus}
                onPress={handlePickedUp}
                style={styles.actionBtn}
              />
            )}

            {/* Items list when at store */}
            {assignment.status === 'arrived_store' && assignment.orderItems?.length > 0 && (
              <View style={styles.itemsList}>
                <Text style={styles.itemsTitle}>Items to collect:</Text>
                {assignment.orderItems.map((item, i) => (
                  <Text key={i} style={styles.itemText}>
                    • {item.name} ×{item.quantity}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── picked_up ─────────────────────────────────────────────────── */}
        {assignment.status === 'picked_up' && (
          <View>
            <Text style={styles.instructionHeading}>Order Picked Up</Text>
            <Text style={styles.addressText}>
              Set status once you've left the store.
            </Text>
            <Button
              title="Start Delivery"
              variant="primary"
              size="lg"
              fullWidth
              loading={updatingStatus}
              onPress={() =>
                updateStatus(
                  { assignmentId: assignment.id, status: 'out_for_delivery' },
                  { onSuccess: () => refetch() },
                )
              }
              style={styles.actionBtn}
            />
          </View>
        )}

        {/* ── out_for_delivery ─────────────────────────────────────────── */}
        {assignment.status === 'out_for_delivery' && (
          <View>
            <Text style={styles.instructionHeading}>Deliver to Customer</Text>
            <Text style={styles.addressText}>{assignment.customerArea}</Text>
            {assignment.customerFloor && (
              <Text style={styles.landmarkText}>{assignment.customerFloor}</Text>
            )}
            {assignment.customerLandmark && (
              <Text style={styles.landmarkText}>Near: {assignment.customerLandmark}</Text>
            )}

            <View style={styles.otpSection}>
              <Text style={styles.otpLabel}>Customer OTP</Text>
              <TextInput
                style={styles.otpInput}
                value={otpInput}
                onChangeText={setOtpInput}
                placeholder="Enter OTP"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>

            <View style={styles.deliveryActions}>
              <Button
                title="Report Issue"
                variant="danger"
                size="md"
                onPress={() => setShowReportModal(true)}
                style={styles.issueBtn}
              />
              <Button
                title="Confirm Delivery"
                variant="primary"
                size="md"
                loading={confirming}
                onPress={handleConfirmDelivery}
                style={styles.confirmBtn}
              />
            </View>
          </View>
        )}
      </View>

      {/* Report Issue Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report Delivery Issue</Text>

            {['not_home', 'wrong_address', 'customer_unreachable', 'other'].map((issue) => (
              <TouchableOpacity
                key={issue}
                style={[
                  styles.issueOption,
                  selectedIssue === issue && styles.issueOptionSelected,
                ]}
                onPress={() => setSelectedIssue(issue)}
              >
                <Text
                  style={[
                    styles.issueOptionText,
                    selectedIssue === issue && styles.issueOptionTextSelected,
                  ]}
                >
                  {issueLabel(issue)}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.notesInput}
              placeholder="Additional notes (optional)"
              value={issueNotes}
              onChangeText={setIssueNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setShowReportModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Submit"
                variant="danger"
                size="md"
                loading={reportingIssue}
                onPress={handleReportIssue}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStatusLabel(status: DeliveryAssignment['status']): string {
  const labels: Record<DeliveryAssignment['status'], string> = {
    assigned: 'Head to Store',
    arrived_store: 'At Store',
    picked_up: 'Order Collected',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    failed: 'Issue Reported',
  };
  return labels[status] ?? status;
}

function issueLabel(issue: string): string {
  const labels: Record<string, string> = {
    not_home: 'Customer not home',
    wrong_address: 'Wrong / incomplete address',
    customer_unreachable: 'Customer not reachable',
    other: 'Other issue',
  };
  return labels[issue] ?? issue;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  safeArea: { flex: 1 },
  noDelivery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  noDeliveryTitle: { fontSize: 22, fontWeight: '700', color: '#374151' },
  noDeliveryText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  navBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' },
  statusPillText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  earningsChip: { fontSize: 18, fontWeight: '800', color: '#111827' },
  instructionHeading: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  landmarkText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { fontSize: 13, color: '#6B7280' },
  actionBtn: { marginTop: 16 },
  itemsList: {
    marginTop: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  itemsTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6 },
  itemText: { fontSize: 14, color: '#374151', paddingVertical: 2 },
  otpSection: { marginTop: 14 },
  otpLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  otpInput: {
    borderWidth: 2,
    borderColor: '#4F46E5',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    paddingVertical: 14,
    backgroundColor: '#EEF2FF',
  },
  deliveryActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  issueBtn: { flex: 1 },
  confirmBtn: { flex: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  issueOption: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  issueOptionSelected: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  issueOptionText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  issueOptionTextSelected: { color: '#DC2626', fontWeight: '700' },
  notesInput: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    marginTop: 8,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 12 },
});
