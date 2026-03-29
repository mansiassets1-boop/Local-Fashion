import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { useOnboardStore, useSendStoreOwnerOtp, useVerifyStoreOwnerOtp } from '@/hooks/useAgent';
import { getCurrentLocation } from '@/lib/location';
import { isValidIndianPhone, isValidGST, isValidIFSC } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/ui/OTPInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const TOTAL_STEPS = 5;

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'];
const CATEGORIES = ['Women\'s Wear', 'Men\'s Wear', 'Kids\' Wear', 'Ethnic Wear', 'Western Wear', 'Accessories', 'Footwear', 'Sportswear'];

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

const step1Schema = z.object({
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  phone: z.string().refine(isValidIndianPhone, 'Enter a valid 10-digit mobile number'),
  city: z.string().min(1, 'Please select a city'),
  category: z.string().min(1, 'Please select a store category'),
});

const step2Schema = z.object({
  address: z.string().min(10, 'Please enter a complete address'),
});

const step3Schema = z.object({
  gstNumber: z.string().optional().refine((v) => !v || isValidGST(v), 'Invalid GST number format'),
  prepTime: z.number({ invalid_type_error: 'Enter minutes' }).min(1).max(300),
  returnPolicyDays: z.number({ invalid_type_error: 'Enter days' }).min(0).max(90),
  bankAccount: z.string().min(8, 'Enter a valid account number'),
  ifscCode: z.string().refine(isValidIFSC, 'Invalid IFSC code (e.g., HDFC0001234)'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface FormState {
  step1: Partial<Step1Data>;
  step2: Partial<Step2Data> & { latitude?: number; longitude?: number };
  step3: Partial<Step3Data>;
  photos: {
    exterior?: string;
    idProof?: string;
    products: string[];
  };
  phoneVerified: boolean;
  consentOtp: string[];
}

export default function OnboardStoreScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    step1: {},
    step2: {},
    step3: {},
    photos: { products: [] },
    phoneVerified: false,
    consentOtp: ['', '', '', '', '', ''],
  });
  const [ownerOtp, setOwnerOtp] = useState(['', '', '', '', '', '']);
  const [ownerOtpSent, setOwnerOtpSent] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { mutate: sendOwnerOtp, isPending: sendingOwnerOtp } = useSendStoreOwnerOtp();
  const { mutate: verifyOwnerOtp, isPending: verifyingOwnerOtp } = useVerifyStoreOwnerOtp();
  const { mutate: onboardStore } = useOnboardStore();

  // Step 1 form
  const {
    control: c1,
    handleSubmit: hs1,
    formState: { errors: e1 },
    watch: w1,
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: form.step1 as Step1Data,
  });

  // Step 2 form
  const {
    control: c2,
    handleSubmit: hs2,
    formState: { errors: e2 },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: form.step2 as Step2Data,
  });

  // Step 3 form
  const {
    control: c3,
    handleSubmit: hs3,
    formState: { errors: e3 },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: form.step3 as Step3Data,
  });

  const handleStep1Submit = (data: Step1Data) => {
    if (!form.phoneVerified) {
      Alert.alert('Phone Not Verified', 'Please verify the store owner\'s phone number first.');
      return;
    }
    setForm((f) => ({ ...f, step1: data }));
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: Step2Data) => {
    setForm((f) => ({ ...f, step2: { ...f.step2, ...data } }));
    setCurrentStep(3);
  };

  const handleStep3Submit = (data: Step3Data) => {
    setForm((f) => ({ ...f, step3: data }));
    setCurrentStep(4);
  };

  const handleSendOwnerOtp = () => {
    const phone = w1('phone');
    if (!phone || !isValidIndianPhone(phone)) {
      Alert.alert('Invalid Number', 'Enter the store owner\'s phone number first.');
      return;
    }
    sendOwnerOtp(phone, {
      onSuccess: () => {
        setOwnerOtpSent(true);
        Alert.alert('OTP Sent', `An OTP was sent to the store owner at ${phone}.`);
      },
      onError: () => Alert.alert('Error', 'Could not send OTP. Please try again.'),
    });
  };

  const handleVerifyOwnerOtp = () => {
    const phone = w1('phone');
    const code = ownerOtp.join('');
    if (code.length !== 6) {
      Alert.alert('Incomplete OTP', 'Enter the 6-digit OTP received by the store owner.');
      return;
    }
    verifyOwnerOtp(
      { phone, otp: code },
      {
        onSuccess: (data) => {
          if (data.verified) {
            setForm((f) => ({ ...f, phoneVerified: true }));
            Alert.alert('Verified', 'Store owner\'s phone number has been verified.');
          } else {
            Alert.alert('Invalid OTP', 'The OTP entered is incorrect.');
          }
        },
        onError: () => Alert.alert('Error', 'Verification failed. Please try again.'),
      },
    );
  };

  const handleGetLocation = async () => {
    setFetchingLocation(true);
    try {
      const coords = await getCurrentLocation();
      setForm((f) => ({
        ...f,
        step2: { ...f.step2, latitude: coords.latitude, longitude: coords.longitude },
      }));
    } catch (err: any) {
      Alert.alert('Location Error', err.message);
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleCapturePhoto = async (field: 'exterior' | 'idProof') => {
    Alert.alert('Add Photo', 'Choose source', [
      {
        text: 'Camera',
        onPress: async () => {
          const { status } = await Camera.Camera.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission denied', 'Camera access is required.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setForm((f) => ({
              ...f,
              photos: { ...f.photos, [field]: uri },
            }));
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setForm((f) => ({
              ...f,
              photos: { ...f.photos, [field]: uri },
            }));
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAddProductPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setForm((f) => ({
        ...f,
        photos: { ...f.photos, products: [...f.photos.products, ...uris].slice(0, 5) },
      }));
    }
  };

  const handleFinalSubmit = async () => {
    const consentCode = form.consentOtp.join('');
    if (consentCode.length !== 6) {
      Alert.alert('Consent OTP Required', 'Please enter the store owner consent OTP.');
      return;
    }
    if (!form.photos.exterior) {
      Alert.alert('Photo Required', 'Please capture the store exterior photo.');
      return;
    }
    if (!form.photos.idProof) {
      Alert.alert('ID Proof Required', 'Please capture the store owner\'s ID proof.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('ownerName', form.step1.ownerName!);
      fd.append('storeName', form.step1.storeName!);
      fd.append('phone', form.step1.phone!);
      fd.append('city', form.step1.city!);
      fd.append('category', form.step1.category!);
      fd.append('address', form.step2.address!);
      if (form.step2.latitude) fd.append('latitude', String(form.step2.latitude));
      if (form.step2.longitude) fd.append('longitude', String(form.step2.longitude));
      if (form.step3.gstNumber) fd.append('gstNumber', form.step3.gstNumber);
      fd.append('prepTime', String(form.step3.prepTime));
      fd.append('returnPolicyDays', String(form.step3.returnPolicyDays));
      fd.append('bankAccount', form.step3.bankAccount!);
      fd.append('ifscCode', form.step3.ifscCode!);
      fd.append('ownerConsentOtp', consentCode);
      fd.append('exteriorPhoto', { uri: form.photos.exterior, type: 'image/jpeg', name: 'exterior.jpg' } as any);
      fd.append('idProof', { uri: form.photos.idProof, type: 'image/jpeg', name: 'id_proof.jpg' } as any);
      form.photos.products.forEach((uri, i) => {
        fd.append(`productPhoto_${i}`, { uri, type: 'image/jpeg', name: `product_${i}.jpg` } as any);
      });

      onboardStore(fd, {
        onSuccess: (data) => {
          setSubmitting(false);
          Alert.alert(
            'Application Submitted!',
            `Tracking Reference: ${data.trackingRef}\n\nThe store application is under review.`,
            [
              {
                text: 'Track Status',
                onPress: () =>
                  router.push(`/(agent)/onboard/${data.applicationId}/status`),
              },
              {
                text: 'Back to Home',
                onPress: () => router.replace('/(agent)'),
              },
            ],
          );
        },
        onError: () => {
          setSubmitting(false);
          Alert.alert('Submission Failed', 'Could not submit the application. Please try again.');
        },
      });
    } catch {
      setSubmitting(false);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          {currentStep > 1 ? (
            <TouchableOpacity onPress={() => setCurrentStep((s) => s - 1)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Onboard New Store</Text>
            <Text style={styles.headerSub}>Step {currentStep} of {TOTAL_STEPS}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <React.Fragment key={i}>
              <View
                style={[
                  styles.stepDot,
                  i + 1 < currentStep && styles.stepDotDone,
                  i + 1 === currentStep && styles.stepDotActive,
                ]}
              >
                {i + 1 < currentStep ? (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                ) : (
                  <Text style={[styles.stepNum, i + 1 === currentStep && styles.stepNumActive]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < TOTAL_STEPS - 1 && (
                <View style={[styles.stepLine, i + 1 < currentStep && styles.stepLineDone]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* ─── STEP 1: Store Basic Info ───────────────────────────────────── */}
          {currentStep === 1 && (
            <View>
              <Text style={styles.stepTitle}>Store Basic Info</Text>
              <Text style={styles.stepSubtitle}>Enter the store owner's details.</Text>

              <Controller
                control={c1}
                name="ownerName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Owner Full Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={e1.ownerName?.message}
                    placeholder="Rahul Sharma"
                    autoCapitalize="words"
                  />
                )}
              />

              <Controller
                control={c1}
                name="storeName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Store Name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={e1.storeName?.message}
                    placeholder="Fashionista Boutique"
                    autoCapitalize="words"
                  />
                )}
              />

              {/* Phone with OTP verification */}
              <View style={styles.phoneVerifyGroup}>
                <Controller
                  control={c1}
                  name="phone"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Store Owner's Phone"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={e1.phone?.message}
                      placeholder="9876543210"
                      keyboardType="phone-pad"
                      maxLength={10}
                      rightIcon={form.phoneVerified ? 'checkmark-circle' : undefined}
                      containerStyle={{ marginBottom: 8 }}
                    />
                  )}
                />
                {form.phoneVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.verifiedText}>Phone Verified</Text>
                  </View>
                ) : (
                  <>
                    <Button
                      title={ownerOtpSent ? 'Resend OTP' : 'Send OTP to Owner'}
                      variant="secondary"
                      size="sm"
                      loading={sendingOwnerOtp}
                      onPress={handleSendOwnerOtp}
                      style={styles.sendOtpBtn}
                    />
                    {ownerOtpSent && (
                      <View style={styles.otpVerifyBox}>
                        <Text style={styles.otpVerifyLabel}>Owner OTP</Text>
                        <OTPInput
                          value={ownerOtp}
                          onChange={setOwnerOtp}
                          autoFocus={false}
                        />
                        <Button
                          title="Verify"
                          variant="primary"
                          size="sm"
                          loading={verifyingOwnerOtp}
                          onPress={handleVerifyOwnerOtp}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* City dropdown */}
              <Controller
                control={c1}
                name="city"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.selectGroup}>
                    <Text style={styles.selectLabel}>City</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                      {CITIES.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.chip, value === c && styles.chipActive]}
                          onPress={() => onChange(c)}
                        >
                          <Text style={[styles.chipText, value === c && styles.chipTextActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {e1.city && <Text style={styles.fieldError}>{e1.city.message}</Text>}
                  </View>
                )}
              />

              {/* Category */}
              <Controller
                control={c1}
                name="category"
                render={({ field: { value, onChange } }) => (
                  <View style={styles.selectGroup}>
                    <Text style={styles.selectLabel}>Store Category</Text>
                    <View style={styles.categoryGrid}>
                      {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.categoryChip, value === cat && styles.chipActive]}
                          onPress={() => onChange(cat)}
                        >
                          <Text style={[styles.chipText, value === cat && styles.chipTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {e1.category && <Text style={styles.fieldError}>{e1.category.message}</Text>}
                  </View>
                )}
              />

              <Button
                title="Next: Store Address"
                variant="primary"
                size="lg"
                fullWidth
                onPress={hs1(handleStep1Submit)}
                style={styles.nextBtn}
              />
            </View>
          )}

          {/* ─── STEP 2: Store Address ────────────────────────────────────────── */}
          {currentStep === 2 && (
            <View>
              <Text style={styles.stepTitle}>Store Address</Text>
              <Text style={styles.stepSubtitle}>Enter or pin the store location.</Text>

              <Controller
                control={c2}
                name="address"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Full Address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={e2.address?.message}
                    placeholder="Shop No. 12, MG Road, Bengaluru 560001"
                    multiline
                    numberOfLines={3}
                  />
                )}
              />

              <Button
                title={fetchingLocation ? 'Fetching…' : 'Use Current Location'}
                variant="secondary"
                size="md"
                fullWidth
                loading={fetchingLocation}
                onPress={handleGetLocation}
                style={styles.locationBtn}
              />

              {form.step2.latitude && (
                <View style={styles.mapPreview}>
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.mapView}
                    region={{
                      latitude: form.step2.latitude,
                      longitude: form.step2.longitude!,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: form.step2.latitude,
                        longitude: form.step2.longitude!,
                      }}
                    />
                  </MapView>
                  <Text style={styles.coordText}>
                    {form.step2.latitude.toFixed(5)}, {form.step2.longitude?.toFixed(5)}
                  </Text>
                </View>
              )}

              <Button
                title="Next: Business Details"
                variant="primary"
                size="lg"
                fullWidth
                onPress={hs2(handleStep2Submit)}
                style={styles.nextBtn}
              />
            </View>
          )}

          {/* ─── STEP 3: Business Details ─────────────────────────────────────── */}
          {currentStep === 3 && (
            <View>
              <Text style={styles.stepTitle}>Business Details</Text>
              <Text style={styles.stepSubtitle}>Operational and banking info.</Text>

              <Controller
                control={c3}
                name="gstNumber"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="GST Number (Optional)"
                    value={value}
                    onChangeText={(t) => onChange(t.toUpperCase())}
                    onBlur={onBlur}
                    error={e3.gstNumber?.message}
                    placeholder="22AAAAA0000A1Z5"
                    autoCapitalize="characters"
                    maxLength={15}
                  />
                )}
              />

              <Controller
                control={c3}
                name="prepTime"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Preparation Time (minutes)"
                    value={value?.toString()}
                    onChangeText={(t) => onChange(t ? parseInt(t) : undefined)}
                    onBlur={onBlur}
                    error={e3.prepTime?.message}
                    placeholder="30"
                    keyboardType="number-pad"
                    maxLength={3}
                    hint="Average time to prepare an order before pickup"
                  />
                )}
              />

              <Controller
                control={c3}
                name="returnPolicyDays"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Return Policy (days)"
                    value={value?.toString()}
                    onChangeText={(t) => onChange(t ? parseInt(t) : undefined)}
                    onBlur={onBlur}
                    error={e3.returnPolicyDays?.message}
                    placeholder="7"
                    keyboardType="number-pad"
                    maxLength={2}
                    hint="Number of days customers can return items"
                  />
                )}
              />

              <Controller
                control={c3}
                name="bankAccount"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Bank Account Number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={e3.bankAccount?.message}
                    placeholder="1234567890"
                    keyboardType="number-pad"
                    maxLength={18}
                  />
                )}
              />

              <Controller
                control={c3}
                name="ifscCode"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="IFSC Code"
                    value={value}
                    onChangeText={(t) => onChange(t.toUpperCase())}
                    onBlur={onBlur}
                    error={e3.ifscCode?.message}
                    placeholder="HDFC0001234"
                    autoCapitalize="characters"
                    maxLength={11}
                  />
                )}
              />

              <Button
                title="Next: Photos"
                variant="primary"
                size="lg"
                fullWidth
                onPress={hs3(handleStep3Submit)}
                style={styles.nextBtn}
              />
            </View>
          )}

          {/* ─── STEP 4: Photos ───────────────────────────────────────────────── */}
          {currentStep === 4 && (
            <View>
              <Text style={styles.stepTitle}>Store Photos</Text>
              <Text style={styles.stepSubtitle}>
                Capture required photos for verification.
              </Text>

              {/* Store exterior */}
              <PhotoCapture
                label="Store Exterior *"
                uri={form.photos.exterior}
                onCapture={() => handleCapturePhoto('exterior')}
              />

              {/* ID proof */}
              <PhotoCapture
                label="Owner ID Proof *"
                uri={form.photos.idProof}
                onCapture={() => handleCapturePhoto('idProof')}
              />

              {/* Product photos */}
              <View style={styles.productPhotos}>
                <Text style={styles.photoLabel}>Product Photos (Optional)</Text>
                <View style={styles.productGrid}>
                  {form.photos.products.map((uri, i) => (
                    <View key={i} style={styles.productThumb}>
                      <Image source={{ uri }} style={styles.productThumbImg} />
                      <TouchableOpacity
                        style={styles.removePhoto}
                        onPress={() =>
                          setForm((f) => ({
                            ...f,
                            photos: {
                              ...f.photos,
                              products: f.photos.products.filter((_, j) => j !== i),
                            },
                          }))
                        }
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {form.photos.products.length < 5 && (
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddProductPhoto}>
                      <Ionicons name="add" size={28} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Button
                title="Next: Owner Consent"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  if (!form.photos.exterior || !form.photos.idProof) {
                    Alert.alert('Photos Required', 'Please capture both store exterior and ID proof photos.');
                    return;
                  }
                  setCurrentStep(5);
                }}
                style={styles.nextBtn}
              />
            </View>
          )}

          {/* ─── STEP 5: Owner Consent ────────────────────────────────────────── */}
          {currentStep === 5 && (
            <View>
              <Text style={styles.stepTitle}>Owner Consent</Text>
              <Text style={styles.stepSubtitle}>
                Review information and get digital consent from the store owner.
              </Text>

              {/* Summary */}
              <View style={styles.summaryCard}>
                <SummaryRow label="Store" value={form.step1.storeName ?? ''} />
                <SummaryRow label="Owner" value={form.step1.ownerName ?? ''} />
                <SummaryRow label="Phone" value={form.step1.phone ?? ''} />
                <SummaryRow label="City" value={form.step1.city ?? ''} />
                <SummaryRow label="Category" value={form.step1.category ?? ''} />
                <SummaryRow label="Address" value={form.step2.address ?? ''} />
                <SummaryRow label="Prep Time" value={`${form.step3.prepTime ?? ''} min`} />
                <SummaryRow label="Return Policy" value={`${form.step3.returnPolicyDays ?? ''} days`} />
                {form.step3.gstNumber && (
                  <SummaryRow label="GST" value={form.step3.gstNumber} />
                )}
              </View>

              <View style={styles.consentBox}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#4F46E5" />
                <Text style={styles.consentText}>
                  The store owner confirms that all submitted information is accurate and consents to
                  joining the LocalFashion platform.
                </Text>
              </View>

              <Text style={styles.otpVerifyLabel}>Owner Consent OTP</Text>
              <Text style={styles.otpHint}>
                Ask the store owner to enter the OTP sent to their phone ({form.step1.phone})
              </Text>
              <OTPInput
                value={form.consentOtp}
                onChange={(otp) => setForm((f) => ({ ...f, consentOtp: otp }))}
                autoFocus={false}
              />

              <Button
                title={submitting ? 'Submitting…' : 'Submit Application'}
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                onPress={handleFinalSubmit}
                style={[styles.nextBtn, { backgroundColor: '#10B981' }]}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function PhotoCapture({
  label,
  uri,
  onCapture,
}: {
  label: string;
  uri?: string;
  onCapture: () => void;
}) {
  return (
    <View style={photoStyles.container}>
      <Text style={photoStyles.label}>{label}</Text>
      <TouchableOpacity style={photoStyles.captureArea} onPress={onCapture} activeOpacity={0.8}>
        {uri ? (
          <>
            <Image source={{ uri }} style={photoStyles.preview} />
            <View style={photoStyles.retakeOverlay}>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={photoStyles.retakeText}>Retake</Text>
            </View>
          </>
        ) : (
          <View style={photoStyles.placeholder}>
            <Ionicons name="camera-outline" size={36} color="#9CA3AF" />
            <Text style={photoStyles.placeholderText}>Tap to capture</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value}>{value}</Text>
    </View>
  );
}

const photoStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  captureArea: {
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  preview: { width: '100%', height: '100%' },
  retakeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  retakeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  placeholderText: { fontSize: 14, color: '#9CA3AF' },
});

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
    paddingVertical: 12,
  },
  backBtn: { padding: 4, width: 36 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#C7D2FE', marginTop: 2 },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#4F46E5' },
  stepDotDone: { backgroundColor: '#10B981' },
  stepNum: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  stepNumActive: { color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 2 },
  stepLineDone: { backgroundColor: '#10B981' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  stepSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 },
  phoneVerifyGroup: { marginBottom: 16 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  verifiedText: { fontSize: 13, color: '#10B981', fontWeight: '700' },
  sendOtpBtn: { marginTop: 4, alignSelf: 'flex-start' },
  otpVerifyBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  otpVerifyLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  otpHint: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  selectGroup: { marginBottom: 16 },
  selectLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  chipScroll: { flexGrow: 0, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginRight: 8,
    backgroundColor: '#F9FAFB',
  },
  chipActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#4F46E5', fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  fieldError: { color: '#EF4444', fontSize: 12, marginTop: 4 },
  nextBtn: { marginTop: 24 },
  locationBtn: { marginBottom: 16 },
  mapPreview: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mapView: { height: 160 },
  coordText: {
    padding: 8,
    fontSize: 11,
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
  },
  productPhotos: { marginBottom: 16 },
  photoLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  productThumbImg: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 2, right: 2 },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  consentBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  consentText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },
});
