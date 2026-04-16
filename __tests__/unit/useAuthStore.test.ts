import useAuthStore from 'src/stores/useAuthStore';
import { User } from 'src/types';

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  phone: '+995555123456',
  full_name: 'ნინო ბერიძე',
  role: 'physio',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  useAuthStore.setState({ user: null, session: false, isLoading: true });
});

describe('useAuthStore', () => {
  describe('initial state', () => {
    it('starts with null user, no session, and isLoading true', () => {
      const { user, session, isLoading } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(session).toBe(false);
      expect(isLoading).toBe(true);
    });
  });

  describe('setUser', () => {
    it('sets user and marks session active', () => {
      useAuthStore.getState().setUser(mockUser);
      const { user, session } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(session).toBe(true);
    });

    it('clears user and session when called with null', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setUser(null);
      const { user, session } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(session).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('updates isLoading to false', () => {
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('updates isLoading back to true', () => {
      useAuthStore.getState().setLoading(false);
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
    });
  });

  describe('logout', () => {
    it('clears user and session', () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().logout();
      const { user, session } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(session).toBe(false);
    });

    it('does not affect isLoading', () => {
      useAuthStore.getState().setLoading(false);
      useAuthStore.getState().logout();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('is safe to call when already logged out', () => {
      expect(() => useAuthStore.getState().logout()).not.toThrow();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
