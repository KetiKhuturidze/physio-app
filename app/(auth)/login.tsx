import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';
import { KA } from 'src/constants/strings.ka';

const S = KA;

export default function Login() {
  const { setUser } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim()) {
      setError(S.errors.requiredField);
      return;
    }

    if (!password) {
      setError(S.errors.requiredField);
      return;
    }

    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError(S.errors.authFailed);
      setIsLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      setError(S.errors.generic);
      setIsLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single();

    if (userError || !userData) {
      setError(S.errors.generic);
      setIsLoading(false);
      return;
    }

    setUser(userData);
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
            Physio
          </Text>
          <Text className="text-white text-4xl font-bold leading-tight mb-2">
            {S.auth.login.title}
          </Text>
          <Text className="text-teal-100 text-base">
            {S.auth.login.subtitle}
          </Text>
        </View>

        {/* ── Form card ── */}
        <View className="flex-1 bg-white rounded-t-3xl px-6 pt-8">

          {/* Email */}
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            {S.auth.login.emailLabel}
          </Text>
          <TextInput
            className="border border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900 mb-4 bg-gray-50"
            placeholder={S.auth.login.emailPlaceholder}
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
            editable={!isLoading}
          />

          {/* Password */}
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            {S.auth.login.passwordLabel}
          </Text>
          <TextInput
            className="border border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-900 mb-5 bg-gray-50"
            placeholder={S.auth.login.passwordPlaceholder}
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            editable={!isLoading}
          />

          {/* Error */}
          {error && (
            <View className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm text-center">{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center mb-6 ${
              isLoading ? 'bg-teal-400' : 'bg-teal-600'
            }`}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-bold text-base tracking-wide">
                {S.auth.login.submitButton}
              </Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View className="flex-row justify-center items-center pb-8">
            <Text className="text-gray-500 text-sm">
              {S.auth.login.noAccount}{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-teal-600 text-sm font-bold">
                  {S.auth.login.registerLink}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
