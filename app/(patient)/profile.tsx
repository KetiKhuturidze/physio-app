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
import { deleteAccount } from 'src/hooks/useAccount';
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
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

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

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteError(false);
    const ok = await deleteAccount();
    if (!ok) {
      setDeleteError(true);
      setDeletingAccount(false);
      return;
    }
    await supabase.auth.signOut();
    logout();
    router.replace('/(auth)/login');
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
      className="flex-1 bg-brand-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        overScrollMode="never"
      >
        <View
          className="bg-brand-900 px-6 rounded-b-[28px] justify-center"
          style={{ paddingTop: insets.top, height: insets.top + 84 }}
        >
          <Text className="text-brand-200 text-sm font-semibold uppercase tracking-widest">
            {S.title}
          </Text>
        </View>

        <View
          className="mx-4 mt-4 bg-white rounded-2xl p-5 items-center"
          style={{
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <View className="w-20 h-20 rounded-full bg-brand-100 items-center justify-center mb-3">
            <Text className="text-brand-700 text-2xl font-bold">{initials}</Text>
          </View>
          <Text className="text-gray-900 text-xl font-bold">{user?.full_name}</Text>
          <Text className="text-gray-500 text-sm mt-0.5">{user?.email}</Text>
          <View className="bg-brand-100 rounded-full px-3 py-1 mt-2">
            <Text className="text-brand-700 text-xs font-semibold">
              {KA.auth.register.rolePatient}
            </Text>
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
            className={`rounded-2xl py-4 items-center ${saving ? 'bg-accent-300' : 'bg-accent-600'}`}
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

          {/* ── Delete account ── */}
          {deleteError && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <Text className="text-red-700 text-sm">{S.deleteAccountError}</Text>
            </View>
          )}
          {deleteConfirming ? (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4 gap-3">
              <Text className="text-red-800 text-sm leading-5">{S.deleteAccountWarning}</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setDeleteConfirming(false)}
                  disabled={deletingAccount}
                  activeOpacity={0.8}
                  className="flex-1 rounded-xl py-3 items-center border border-gray-300 bg-white"
                >
                  <Text className="text-gray-700 font-semibold text-sm">{S.deleteAccountCancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  disabled={deletingAccount}
                  activeOpacity={0.8}
                  className="flex-1 rounded-xl py-3 items-center bg-red-600"
                >
                  {deletingAccount ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-white font-semibold text-sm">{S.deleteAccountConfirm}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setDeleteConfirming(true)}
              activeOpacity={0.8}
              className="items-center py-2"
            >
              <Text className="text-red-400 text-sm">{S.deleteAccountButton}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
