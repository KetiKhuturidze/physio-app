import { Redirect } from 'expo-router';
import useAuthStore from 'src/stores/useAuthStore';

export default function Index() {
  const { user } = useAuthStore();

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === 'patient') return <Redirect href="/(patient)/home" />;
  return <Redirect href="/(physio)/dashboard" />;
}
