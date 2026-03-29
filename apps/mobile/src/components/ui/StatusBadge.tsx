import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type Status =
  | 'assigned'
  | 'arrived_store'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'onboarded'
  | 'interested'
  | 'not_interested'
  | 'already_listed'
  | 'paid'
  | string;

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  assigned: { label: 'Assigned', bg: '#EEF2FF', text: '#4F46E5' },
  arrived_store: { label: 'At Store', bg: '#FEF3C7', text: '#D97706' },
  picked_up: { label: 'Picked Up', bg: '#FEF3C7', text: '#D97706' },
  out_for_delivery: { label: 'Out for Delivery', bg: '#DBEAFE', text: '#2563EB' },
  delivered: { label: 'Delivered', bg: '#D1FAE5', text: '#059669' },
  failed: { label: 'Failed', bg: '#FEE2E2', text: '#DC2626' },
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#D97706' },
  approved: { label: 'Approved', bg: '#D1FAE5', text: '#059669' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', text: '#DC2626' },
  onboarded: { label: 'Onboarded', bg: '#D1FAE5', text: '#059669' },
  interested: { label: 'Interested', bg: '#DBEAFE', text: '#2563EB' },
  not_interested: { label: 'Not Interested', bg: '#F3F4F6', text: '#6B7280' },
  already_listed: { label: 'Already Listed', bg: '#E0E7FF', text: '#4338CA' },
  paid: { label: 'Paid', bg: '#D1FAE5', text: '#059669' },
  online: { label: 'Online', bg: '#D1FAE5', text: '#059669' },
  offline: { label: 'Offline', bg: '#F3F4F6', text: '#6B7280' },
};

interface StatusBadgeProps {
  status: Status;
  style?: ViewStyle;
}

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    bg: '#F3F4F6',
    text: '#6B7280',
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
