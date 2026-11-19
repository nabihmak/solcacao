/**
 * AuthContext - global authentication state (Student 1).
 *
 * Any component can read the logged-in user and call the auth actions:
 *   const { user, isAuthenticated, isPartner, login, logout, openAuthModal } = useAuth();
 *
 * - The login token is kept in localStorage (see services/tokenStorage.js).
 * - On page load, a saved token is checked (Phase 3: GET /api/auth/me)
 *   so the user stays signed in after a refresh.
 * - openAuthModal() lets any page (e.g. checkout or the B2B wizard)
 *   ask the user to sign in.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { tokenStorage } from '../services/tokenStorage';
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" while we check a saved token, then "ready"
  const [status, setStatus] = useState(tokenStorage.get() ? 'loading' : 'ready');
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  // Restore the session from a saved token (runs once on page load)
  useEffect(() => {
    if (!tokenStorage.get()) return;

    fetchCurrentUser()
      .then((data) => setUser(data.user))
      .catch((error) => {
        // Expired / invalid token -> forget it. Other errors keep the token.
        if (error.status === 401) tokenStorage.clear();
      })
      .finally(() => setStatus('ready'));
  }, []);

  // Saves the token + user after a successful login or registration
  const startSession = useCallback((data) => {
    tokenStorage.set(data.token);
    setUser(data.user);
    // Integration point: Student 3 can merge the guest cart here once the user is signed in.
    return data.user;
  }, []);

  const login = useCallback(async (email, password) => startSession(await loginUser(email, password)), [startSession]);

  const register = useCallback(async (payload) => startSession(await registerUser(payload)), [startSession]);

  // Stable functions so components can safely list them in effect dependencies
  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const logout = useCallback(() => {
    logoutUser().catch(() => {}); // end the session on the data layer too
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: Boolean(user),
      isPartner: user?.accountType === 'B2B',
      login,
      register,
      logout,
      setUser, // used by the profile page after an update
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
    }),
    [user, status, login, register, logout, isAuthModalOpen, openAuthModal, closeAuthModal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
