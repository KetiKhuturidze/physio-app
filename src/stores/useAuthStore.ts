import { create } from 'zustand';
import { User } from 'src/types/index';

type AuthState = {
  user: User | null;
  session: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
};

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: false,
  isLoading: true,

  setUser: (user) => set({ user, session: user !== null }),

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => set({ user: null, session: false }),
}));

export default useAuthStore;
