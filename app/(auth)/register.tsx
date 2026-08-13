import { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  type TextInput as TextInputType,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';
import { KA } from 'src/constants/strings.ka';
import { type UserRole } from 'src/types/index';

const S = KA;

type FieldErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
};

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function Register() {
  const { setUser } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [role, setRole] = useState<UserRole>('patient');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const emailRef = useRef<TextInputType>(null);
  const phoneRef = useRef<TextInputType>(null);
  const passwordRef = useRef<TextInputType>(null);
  const confirmPasswordRef = useRef<TextInputType>(null);

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    if (!fullName.trim()) errors.fullName = S.errors.requiredField;
    if (!email.trim()) {
      errors.email = S.errors.requiredField;
    } else if (!isValidEmail(email.trim())) {
      errors.email = S.errors.invalidEmail;
    }
    if (!phone.trim()) errors.phone = S.errors.requiredField;
    if (!password) {
      errors.password = S.errors.requiredField;
    } else if (password.length < 8) {
      errors.password = S.errors.passwordTooShort;
    }
    if (!confirmPassword) {
      errors.confirmPassword = S.errors.requiredField;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = S.errors.passwordMismatch;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setFormError(null);
    if (!validate()) return;

    setIsLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signUpError || !authData.user) {
      const isEmailInUse =
        signUpError?.message.toLowerCase().includes('already registered') ||
        signUpError?.message.toLowerCase().includes('already been registered');
      setFormError(isEmailInUse ? S.errors.emailInUse : S.errors.generic);
      setIsLoading(false);
      return;
    }

    const { data: userRow, error: userInsertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        full_name: fullName.trim(),
        role,
      })
      .select()
      .single();

    if (userInsertError || !userRow) {
      setFormError(S.errors.generic);
      setIsLoading(false);
      return;
    }

    if (role === 'physio') {
      const { error: profileInsertError } = await supabase
        .from('physio_profiles')
        .insert({
          user_id: authData.user.id,
          specialties: [],
          languages: [],
          is_verified: false,
          is_active: true,
        });

      if (profileInsertError) {
        setFormError(S.errors.generic);
        setIsLoading(false);
        return;
      }
    }

    setUser(userRow);
    // Navigation handled by root layout's onAuthStateChange + redirect effect
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-teal-600"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero section ── */}
        <View className="px-7 pb-10" style={{ paddingTop: insets.top + 32 }}>
          <Text className="text-teal-100 text-sm font-semibold tracking-widest uppercase mb-3">
            Movla
</Text>
          <Text className="text-white text-4xl font-bold leading-tight mb-2">
            {S.auth.register.title}
          </Text>
          <Text className="text-teal-100 text-base">
            {S.auth.register.subtitle}
          </Text>
        </View>

        {/* ── Form card ── */}
        <View className="flex-1 bg-white rounded-t-3xl px-6 pt-8">

          {/* Role selector */}
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            {S.auth.register.roleLabel}
          </Text>
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              className={`flex-1 rounded-2xl border-2 px-4 py-4 ${
                role === 'patient' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-gray-50'
              }`}
              onPress={() => setRole('patient')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text className={`text-sm font-bold mb-0.5 ${role === 'patient' ? 'text-teal-700' : 'text-gray-600'}`}>
                {S.auth.register.rolePatient}
              </Text>
              <Text className={`text-xs ${role === 'patient' ? 'text-teal-500' : 'text-gray-400'}`}>
                {S.auth.register.rolePatientDesc}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 rounded-2xl border-2 px-4 py-4 ${
                role === 'physio' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 bg-gray-50'
              }`}
              onPress={() => setRole('physio')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text className={`text-sm font-bold mb-0.5 ${role === 'physio' ? 'text-teal-700' : 'text-gray-600'}`}>
                {S.auth.register.rolePhysio}
              </Text>
              <Text className={`text-xs ${role === 'physio' ? 'text-teal-500' : 'text-gray-400'}`}>
                {S.auth.register.rolePhysioDesc}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full name */}
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            {S.auth.register.nameLabel}
          </Text>
          <TextInput
            className={`border rounded-2xl px-4 py-4 text-base text-gray-900 mb-1 bg-gray-50 ${
              fieldErrors.fullName ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder={S.auth.register.namePlaceholder}
            placeholderTextColor="#9ca3af"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            editable={!isLoading}
          />
          {fieldErrors.fullName ? (
            <Text className="text-red-500 text-xs mb-3">{fieldErrors.fullName}</Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Email */}
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            {S.auth.register.emailLabel}
          </Text>
          <TextInput
            ref={emailRef}
            className={`border rounded-2xl px-4 py-4 text-base text-gray-900 mb-1 bg-gray-50 ${
              fieldErrors.email ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder={S.auth.register.emailPlaceholder}
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            editable={!isLoading}
          />
          {fieldErrors.email ? (
            <Text className="text-red-500 text-xs mb-3">{fieldErrors.email}</Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Phone */}
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            {S.auth.register.phoneLabel}
          </Text>
          <TextInput
            ref={phoneRef}
            className={`border rounded-2xl px-4 py-4 text-base text-gray-900 mb-1 bg-gray-50 ${
              fieldErrors.phone ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder={S.auth.register.phonePlaceholder}
            placeholderTextColor="#9ca3af"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!isLoading}
          />
          {fieldErrors.phone ? (
            <Text className="text-red-500 text-xs mb-3">{fieldErrors.phone}</Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Password */}
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            {S.auth.register.passwordLabel}
          </Text>
          <TextInput
            ref={passwordRef}
            className={`border rounded-2xl px-4 py-4 text-base text-gray-900 mb-1 bg-gray-50 ${
              fieldErrors.password ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder={S.auth.register.passwordPlaceholder}
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            editable={!isLoading}
          />
          {fieldErrors.password ? (
            <Text className="text-red-500 text-xs mb-3">{fieldErrors.password}</Text>
          ) : (
            <View className="mb-4" />
          )}

          {/* Confirm password */}
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            {S.auth.register.confirmPasswordLabel}
          </Text>
          <TextInput
            ref={confirmPasswordRef}
            className={`border rounded-2xl px-4 py-4 text-base text-gray-900 mb-1 bg-gray-50 ${
              fieldErrors.confirmPassword ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholder={S.auth.register.confirmPasswordPlaceholder}
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            editable={!isLoading}
          />
          {fieldErrors.confirmPassword ? (
            <Text className="text-red-500 text-xs mb-3">{fieldErrors.confirmPassword}</Text>
          ) : (
            <View className="mb-5" />
          )}

          {/* Form-level error */}
          {formError && (
            <View className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm text-center">{formError}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center mb-6 ${
              isLoading ? 'bg-teal-400' : 'bg-teal-600'
            }`}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base tracking-wide">
                {S.auth.register.submitButton}
              </Text>
            )}
          </TouchableOpacity>

          {/* Login link */}
          <View className="flex-row justify-center items-center pb-8">
            <Text className="text-gray-500 text-sm">
              {S.auth.register.hasAccount}{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-teal-600 text-sm font-bold">
                  {S.auth.register.loginLink}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
