import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DistrictPicker from 'src/components/DistrictPicker';
import { KA } from 'src/constants/strings.ka';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';

const S = KA.patientProfile;

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="mb-3">
      <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</Text>
      {subtitle && <Text className="text-xs text-gray-400 mt-0.5">{subtitle}</Text>}
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>;
}

export default function PatientProfile() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [defaultAddress, setDefaultAddress] = useState(user?.default_address ?? '');
  const [defaultDistrictIds, setDefaultDistrictIds] = useState<string[]>(
    user?.default_district_id ? [user.default_district_id] : [],
  );

  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSave() {
    if (!user) return;
    if (!fullName.trim()) {
      setSaveResult('error');
      return;
    }
    setSaving(true);
    setSaveResult(null);

    const { error } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        default_address: defaultAddress.trim() || null,
        default_district_id: defaultDistrictIds[0] ?? null,
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      setSaveResult('error');
      return;
    }

    setUser({
      ...user,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      default_address: defaultAddress.trim() || null,
      default_district_id: defaultDistrictIds[0] ?? null,
    });
    setSaveResult('success');
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSaveResult('error');
        return;
      }
      logout();
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  }

  const initials = (user?.full_name ?? '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View className="bg-white px-6 pb-5 border-b border-gray-100" style={{ paddingTop: insets.top + 12 }}>
          <Text className="text-2xl font-bold text-gray-900">{S.title}</Text>
        </View>

        {/* ── Hero ── */}
        <View className="bg-white px-6 pt-6 pb-6 items-center gap-3 border-b border-gray-100">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center">
            <Text className="text-blue-700 text-2xl font-semibold">{initials}</Text>
          </View>
          <View className="items-center gap-1.5">
            <Text className="text-xl font-bold text-gray-900">{user?.full_name}</Text>
            <Text className="text-sm text-gray-400">{user?.email}</Text>
            <View className="bg-blue-100 rounded-full px-3 py-1">
              <Text className="text-blue-700 text-xs font-medium">
                {KA.auth.register.rolePatient}
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 mt-4 gap-4">
          {/* ── Result banner ── */}
          {saveResult === 'success' && (
            <View className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <Text className="text-green-800 text-sm">{S.saveSuccess}</Text>
            </View>
          )}
          {saveResult === 'error' && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <Text className="text-red-700 text-sm">{S.saveError}</Text>
            </View>
          )}

          {/* ── Basic info ── */}
          <View className="bg-white rounded-2xl p-4">
            <SectionTitle title={S.nameLabel} />
            <FieldLabel label={S.nameLabel} />
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm mb-3"
              value={fullName}
              onChangeText={(v) => { setFullName(v); setSaveResult(null); }}
              placeholder={KA.auth.register.namePlaceholder}
              placeholderTextColor="#9ca3af"
              returnKeyType="next"
            />
            <FieldLabel label={S.phoneLabel} />
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
              value={phone}
              onChangeText={(v) => { setPhone(v); setSaveResult(null); }}
              placeholder={KA.auth.register.phonePlaceholder}
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>

          {/* ── Default address ── */}
          <View className="bg-white rounded-2xl p-4">
            <SectionTitle
              title={S.defaultAddressTitle}
              subtitle={S.defaultAddressSubtitle}
            />
            <FieldLabel label={S.defaultAddressLabel} />
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm mb-3"
              value={defaultAddress}
              onChangeText={(v) => { setDefaultAddress(v); setSaveResult(null); }}
              placeholder={S.defaultAddressPlaceholder}
              placeholderTextColor="#9ca3af"
              returnKeyType="next"
            />
            <FieldLabel label={S.defaultDistrictLabel} />
            <DistrictPicker
              selectedIds={defaultDistrictIds}
              onChange={(ids) => { setDefaultDistrictIds(ids); setSaveResult(null); }}
              singleSelect
            />
          </View>

          {/* ── Save ── */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
            className={`rounded-2xl py-4 items-center ${saving ? 'bg-green-300' : 'bg-green-600'}`}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">{S.saveButton}</Text>
            )}
          </TouchableOpacity>

          {/* ── Logout ── */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.8}
            className={`rounded-2xl py-4 items-center border ${
              loggingOut ? 'border-red-200 bg-red-50' : 'border-red-300 bg-white'
            }`}
          >
            {loggingOut ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <Text className="text-red-600 font-semibold text-base">{S.logoutButton}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
