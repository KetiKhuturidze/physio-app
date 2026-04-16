import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { decode } from 'base64-arraybuffer';

import DistrictPicker from 'src/components/DistrictPicker';
import { KA } from 'src/constants/strings.ka';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';

const S = KA.physioProfileEdit;
const MAX_BIO = 500;

const SPECIALTY_SUGGESTIONS = [
  'სპორტული რეაბილიტაცია',
  'ზურგის ტკივილი',
  'პოსტოპერაციული',
  'ნევროლოგიური',
  'ხანდაზმულთა',
  'პედიატრიული',
];

const LANGUAGE_SUGGESTIONS = ['ქართული', 'English', 'Русский'];

type ProfileRow = {
  id: string;
  bio: string | null;
  specialties: string[];
  languages: string[];
  base_district_id: string | null;
  physio_service_areas: { district_id: string }[];
  physio_services: {
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
    description: string | null;
  }[];
};

type ServiceDraft = {
  name: string;
  duration_minutes: string;
  price: string;
  description: string;
};

const EMPTY_SERVICE: ServiceDraft = {
  name: '',
  duration_minutes: '',
  price: '',
  description: '',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>;
}

type TagInputProps = {
  tags: string[];
  input: string;
  onInputChange: (v: string) => void;
  onAdd: (value?: string) => void;
  onRemove: (tag: string) => void;
  suggestions: string[];
  placeholder: string;
};

function TagInput({
  tags,
  input,
  onInputChange,
  onAdd,
  onRemove,
  suggestions,
  placeholder,
}: TagInputProps) {
  const unusedSuggestions = suggestions.filter((s) => !tags.includes(s));
  return (
    <View>
      {tags.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <View
              key={tag}
              className="flex-row items-center bg-green-100 rounded-full px-3 py-1.5 gap-1"
            >
              <Text className="text-green-800 text-sm">{tag}</Text>
              <TouchableOpacity onPress={() => onRemove(tag)} hitSlop={8}>
                <Text className="text-green-600 text-sm font-bold">×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View className="flex-row gap-2">
        <TextInput
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white"
          value={input}
          onChangeText={onInputChange}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          returnKeyType="done"
          onSubmitEditing={() => onAdd()}
        />
        <TouchableOpacity
          onPress={() => onAdd()}
          disabled={!input.trim()}
          className={`w-12 rounded-xl items-center justify-center ${
            input.trim() ? 'bg-green-600' : 'bg-gray-100'
          }`}
        >
          <Text
            className={`text-2xl font-light ${
              input.trim() ? 'text-white' : 'text-gray-300'
            }`}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>
      {unusedSuggestions.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-2.5">
          {unusedSuggestions.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => onAdd(s)}
              className="bg-gray-100 rounded-full px-3 py-1.5"
            >
              <Text className="text-gray-600 text-sm">+ {s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ProfileEdit() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  const [isFirstSave, setIsFirstSave] = useState(false);

  const [avatarDisplayUri, setAvatarDisplayUri] = useState<string | null>(null);
  const [newAvatarLocalUri, setNewAvatarLocalUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState('');
  const [baseDistrictIds, setBaseDistrictIds] = useState<string[]>([]);
  const [serviceAreaIds, setServiceAreaIds] = useState<string[]>([]);

  const [services, setServices] = useState<ServiceDraft[]>([]);
  const [addingService, setAddingService] = useState(false);
  const [serviceForm, setServiceForm] = useState<ServiceDraft>(EMPTY_SERVICE);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  // Load existing profile on mount
  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('physio_profiles')
        .select(
          'id, bio, specialties, languages, base_district_id, physio_service_areas(district_id), physio_services(id, name, duration_minutes, price, description)',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (dbError) {
        setLoading(false);
        return;
      }

      if (!data) {
        setIsFirstSave(true);
        setAvatarDisplayUri(user.avatar_url);
        setLoading(false);
        return;
      }

      const row = data as unknown as ProfileRow;
      setBio(row.bio ?? '');
      setSpecialties(row.specialties ?? []);
      setLanguages(row.languages ?? []);
      setBaseDistrictIds(row.base_district_id ? [row.base_district_id] : []);
      setServiceAreaIds(row.physio_service_areas.map((sa) => sa.district_id));
      setServices(
        row.physio_services.map((svc) => ({
          name: svc.name,
          duration_minutes: String(svc.duration_minutes),
          price: String(svc.price),
          description: svc.description ?? '',
        })),
      );
      setAvatarDisplayUri(user.avatar_url);
      setLoading(false);
    }

    loadProfile();
  }, [user]);

  // Auto-add base district to service areas when changed
  useEffect(() => {
    const baseId = baseDistrictIds[0];
    if (baseId && !serviceAreaIds.includes(baseId)) {
      setServiceAreaIds((prev) => [...prev, baseId]);
    }
  }, [baseDistrictIds, serviceAreaIds]);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarDisplayUri(uri);
      setNewAvatarLocalUri(uri);
      setSuccessVisible(false);
    }
  }

  async function uploadAvatar(uri: string): Promise<string | null> {
    if (!user) return null;
    setAvatarUploading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = decode(base64);
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) {
        console.error('[uploadAvatar] storage upload failed:', uploadError);
        setError(S.saveError);
        return null;
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return `${data.publicUrl}?t=${Date.now()}`;
    } catch (err) {
      console.error('[uploadAvatar] unexpected error:', err);
      setError(S.saveError);
      return null;
    } finally {
      setAvatarUploading(false);
    }
  }

  function addTag(
    list: string[],
    setList: (v: string[]) => void,
    input: string,
    setInput: (v: string) => void,
    value?: string,
  ) {
    const tag = (value ?? input).trim();
    if (!tag || list.includes(tag)) return;
    setList([...list, tag]);
    if (!value) setInput('');
    setSuccessVisible(false);
  }

  function removeTag(list: string[], setList: (v: string[]) => void, tag: string) {
    setList(list.filter((t) => t !== tag));
    setSuccessVisible(false);
  }

  function confirmAddService() {
    const name = serviceForm.name.trim();
    const duration = parseInt(serviceForm.duration_minutes, 10);
    const price = parseFloat(serviceForm.price);
    if (!name || isNaN(duration) || duration <= 0 || isNaN(price) || price <= 0) return;
    setServices((prev) => [...prev, { ...serviceForm, name }]);
    setServiceForm(EMPTY_SERVICE);
    setAddingService(false);
    setSuccessVisible(false);
  }

  function removeService(index: number) {
    setServices((prev) => prev.filter((_, i) => i !== index));
    setSuccessVisible(false);
  }

  function validate(): string | null {
    if (!bio.trim()) return `${S.bioLabel}: ${KA.errors.requiredField}`;
    if (specialties.length === 0) return `${S.specialtiesLabel}: ${KA.errors.requiredField}`;
    if (baseDistrictIds.length === 0) return `${S.baseDistrictLabel}: ${KA.errors.requiredField}`;
    return null;
  }

  async function handleSave() {
    if (!user) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessVisible(false);

    // 1. Upload avatar if a new one was picked
    let avatarUrl: string | null = null;
    if (newAvatarLocalUri) {
      avatarUrl = await uploadAvatar(newAvatarLocalUri);
      if (!avatarUrl) {
        setSaving(false);
        return;
      }
    }

    // 2. Persist new avatar_url to users table
    if (avatarUrl) {
      const { error: userError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
      if (userError) {
        console.error('[handleSave] users update failed:', userError);
        setError(S.saveError);
        setSaving(false);
        return;
      }
      setUser({ ...user, avatar_url: avatarUrl });
    }

    // 3. Check if profile row exists, then update or insert
    const { data: existing } = await supabase
      .from('physio_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let profileError = null;
    let physioId: string = existing?.id ?? '';

    if (existing?.id) {
      const { error } = await supabase
        .from('physio_profiles')
        .update({
          bio: bio.trim(),
          specialties,
          languages,
          base_district_id: baseDistrictIds[0] ?? null,
          is_active: true,
        })
        .eq('user_id', user.id);
      profileError = error;
    } else {
      const { data: inserted, error } = await supabase
        .from('physio_profiles')
        .insert({
          user_id: user.id,
          bio: bio.trim(),
          specialties,
          languages,
          base_district_id: baseDistrictIds[0] ?? null,
          is_active: true,
        })
        .select('id')
        .single();
      profileError = error;
      if (inserted?.id) physioId = inserted.id;
    }

    if (profileError) {
      console.error('[handleSave] profile save failed:', profileError);
      setError(S.saveError);
      setSaving(false);
      return;
    }

    // 4. Delete + re-insert service areas
    const { error: deleteAreasError } = await supabase
      .from('physio_service_areas')
      .delete()
      .eq('physio_id', physioId);

    if (deleteAreasError) {
      console.error('[handleSave] physio_service_areas delete failed:', deleteAreasError);
      setError(S.saveError);
      setSaving(false);
      return;
    }

    if (serviceAreaIds.length > 0) {
      const { error: insertAreasError } = await supabase
        .from('physio_service_areas')
        .insert(serviceAreaIds.map((district_id) => ({ physio_id: physioId, district_id })));
      if (insertAreasError) {
        console.error('[handleSave] physio_service_areas insert failed:', insertAreasError);
        setError(S.saveError);
        setSaving(false);
        return;
      }
    }

    // 5. Delete + re-insert services
    const { error: deleteSvcsError } = await supabase
      .from('physio_services')
      .delete()
      .eq('physio_id', physioId);

    if (deleteSvcsError) {
      console.error('[handleSave] physio_services delete failed:', deleteSvcsError);
      setError(S.saveError);
      setSaving(false);
      return;
    }

    if (services.length > 0) {
      const { error: insertSvcsError } = await supabase.from('physio_services').insert(
        services.map((svc) => ({
          physio_id: physioId,
          name: svc.name.trim(),
          duration_minutes: parseInt(svc.duration_minutes, 10),
          price: parseFloat(svc.price),
          description: svc.description.trim() || null,
        })),
      );
      if (insertSvcsError) {
        console.error('[handleSave] physio_services insert failed:', insertSvcsError);
        setError(S.saveError);
        setSaving(false);
        return;
      }
    }

    setNewAvatarLocalUri(null);
    setSuccessVisible(true);
    setSaving(false);

    if (isFirstSave) {
      router.replace('/(physio)/dashboard');
    } else {
      router.replace('/(physio)/profile');
    }
  }

  const initials =
    user?.full_name
      .trim()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') ?? '';

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }

  const isBusy = saving || avatarUploading;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="bg-white px-6 pt-14 pb-5 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">{S.title}</Text>
        </View>

        {/* Banners */}
        {isFirstSave && (
          <View className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Text className="text-amber-800 text-sm">{S.profileIncompleteWarning}</Text>
          </View>
        )}
        {successVisible && (
          <View className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <Text className="text-green-800 text-sm">{S.saveSuccess}</Text>
          </View>
        )}
        {error && (
          <View className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        <View className="px-4 mt-6 gap-5">
          {/* ── Avatar ── */}
          <View className="items-center">
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8}>
              {avatarDisplayUri ? (
                <Image
                  source={{ uri: avatarDisplayUri }}
                  className="w-24 h-24 rounded-full bg-gray-200"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center">
                  <Text className="text-green-700 text-2xl font-semibold">{initials}</Text>
                </View>
              )}
              {avatarUploading && (
                <View className="absolute inset-0 rounded-full bg-black/30 items-center justify-center">
                  <ActivityIndicator color="#ffffff" />
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-green-600 rounded-full w-7 h-7 items-center justify-center border-2 border-white">
                <Text className="text-white text-xs">✎</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Bio ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.bioLabel} />
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm min-h-[100px]"
              value={bio}
              onChangeText={(v) => {
                if (v.length <= MAX_BIO) {
                  setBio(v);
                  setSuccessVisible(false);
                }
              }}
              placeholder={S.bioPlaceholder}
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
            />
            <Text className="text-xs text-gray-400 text-right mt-1">
              {bio.length}/{MAX_BIO}
            </Text>
          </View>

          {/* ── Specialties ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.specialtiesLabel} />
            <TagInput
              tags={specialties}
              input={specialtyInput}
              onInputChange={setSpecialtyInput}
              onAdd={(v) =>
                addTag(specialties, setSpecialties, specialtyInput, setSpecialtyInput, v)
              }
              onRemove={(tag) => removeTag(specialties, setSpecialties, tag)}
              suggestions={SPECIALTY_SUGGESTIONS}
              placeholder={S.specialtiesPlaceholder}
            />
          </View>

          {/* ── Languages ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.languagesLabel} />
            <TagInput
              tags={languages}
              input={languageInput}
              onInputChange={setLanguageInput}
              onAdd={(v) =>
                addTag(languages, setLanguages, languageInput, setLanguageInput, v)
              }
              onRemove={(tag) => removeTag(languages, setLanguages, tag)}
              suggestions={LANGUAGE_SUGGESTIONS}
              placeholder={S.languagesLabel}
            />
          </View>

          {/* ── Services ── */}
          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <FieldLabel label={S.servicesLabel} />
              {!addingService && (
                <TouchableOpacity
                  onPress={() => setAddingService(true)}
                  className="bg-green-600 rounded-full px-3 py-1"
                >
                  <Text className="text-white text-sm font-medium">{S.addServiceButton}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Existing service cards */}
            {services.length > 0 && (
              <View className="gap-2 mb-3">
                {services.map((svc, i) => (
                  <View
                    key={i}
                    className="border border-gray-100 rounded-xl px-3 py-3 bg-gray-50 flex-row items-start justify-between"
                  >
                    <View className="flex-1 gap-0.5">
                      <Text className="text-sm font-semibold text-gray-900">{svc.name}</Text>
                      <Text className="text-xs text-gray-500">
                        {svc.duration_minutes} {S.serviceMinutes} · ₾{svc.price}
                      </Text>
                      {svc.description ? (
                        <Text className="text-xs text-gray-400 mt-0.5">{svc.description}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => removeService(i)}
                      hitSlop={8}
                      className="ml-3 mt-0.5"
                    >
                      <Text className="text-gray-400 text-lg font-bold">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add service inline form */}
            {addingService && (
              <View className="border border-green-200 rounded-xl p-3 bg-green-50 gap-2">
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white"
                  value={serviceForm.name}
                  onChangeText={(v) => setServiceForm((f) => ({ ...f, name: v }))}
                  placeholder={S.serviceNamePlaceholder}
                  placeholderTextColor="#9ca3af"
                  returnKeyType="next"
                />
                <View className="flex-row gap-2">
                  <TextInput
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white"
                    value={serviceForm.duration_minutes}
                    onChangeText={(v) =>
                      setServiceForm((f) => ({ ...f, duration_minutes: v.replace(/[^0-9]/g, '') }))
                    }
                    placeholder={S.serviceDurationPlaceholder}
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    returnKeyType="next"
                  />
                  <TextInput
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white"
                    value={serviceForm.price}
                    onChangeText={(v) =>
                      setServiceForm((f) => ({ ...f, price: v.replace(/[^0-9.]/g, '') }))
                    }
                    placeholder={S.servicePricePlaceholder}
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                  />
                </View>
                <TextInput
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white"
                  value={serviceForm.description}
                  onChangeText={(v) => setServiceForm((f) => ({ ...f, description: v }))}
                  placeholder={S.serviceDescriptionPlaceholder}
                  placeholderTextColor="#9ca3af"
                  returnKeyType="done"
                />
                <View className="flex-row gap-2 mt-1">
                  <TouchableOpacity
                    onPress={() => {
                      setAddingService(false);
                      setServiceForm(EMPTY_SERVICE);
                    }}
                    className="flex-1 border border-gray-300 rounded-xl py-2.5 items-center"
                  >
                    <Text className="text-gray-600 text-sm font-medium">{S.serviceCancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmAddService}
                    disabled={
                      !serviceForm.name.trim() ||
                      !serviceForm.duration_minutes ||
                      !serviceForm.price
                    }
                    className={`flex-1 rounded-xl py-2.5 items-center ${
                      serviceForm.name.trim() && serviceForm.duration_minutes && serviceForm.price
                        ? 'bg-green-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        serviceForm.name.trim() && serviceForm.duration_minutes && serviceForm.price
                          ? 'text-white'
                          : 'text-gray-400'
                      }`}
                    >
                      {S.serviceAddConfirm}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ── Base district ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.baseDistrictLabel} />
            <DistrictPicker
              selectedIds={baseDistrictIds}
              onChange={(ids) => {
                setBaseDistrictIds(ids);
                setSuccessVisible(false);
              }}
              singleSelect
            />
          </View>

          {/* ── Service areas ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.serviceAreasLabel} />
            <DistrictPicker
              selectedIds={serviceAreaIds}
              onChange={(ids) => {
                setServiceAreaIds(ids);
                setSuccessVisible(false);
              }}
            />
          </View>

          {/* ── Save button ── */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isBusy}
            activeOpacity={0.8}
            className={`rounded-2xl py-4 items-center ${isBusy ? 'bg-green-300' : 'bg-green-600'}`}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">{S.saveButton}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
