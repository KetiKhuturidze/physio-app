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
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';
import { KA } from 'src/constants/strings.ka';

const S = KA;

export default function Login() {
  const { setUser } = useAuthStore();

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
    // Navigation handled by root layout's onAuthStateChange + redirect effect
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-16">

          {/* Brand mark */}
          <View className="mb-8">
            <View className="w-14 h-14 rounded-2xl bg-teal-600 items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">F</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-1.5">
              {S.auth.login.title}
            </Text>
            <Text className="text-base text-gray-500">
              {S.auth.login.subtitle}
            </Text>
          </View>

          {/* Email */}
          <Text className="text-sm font-medium text-gray-700 mb-1">
            {S.auth.login.emailLabel}
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3.5 text-base text-gray-900 mb-4 bg-gray-50"
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
          <Text className="text-sm font-medium text-gray-700 mb-1">
            {S.auth.login.passwordLabel}
          </Text>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3.5 text-base text-gray-900 mb-6 bg-gray-50"
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

          {/* Error message */}
          {error && (
            <Text className="text-red-500 text-sm mb-4 text-center">
              {error}
            </Text>
          )}

          {/* Submit button */}
          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${
              isLoading ? 'bg-teal-400' : 'bg-teal-600'
            }`}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {S.auth.login.submitButton}
              </Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-gray-500 text-sm">
              {S.auth.login.noAccount}{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-teal-600 text-sm font-semibold">
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
