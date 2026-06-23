import { useAuth as useAuthContext } from '../context/AuthContext';

/**
 * Custom hook for authentication
 * Provides access to auth state and functions
 */
export const useAuth = () => {
  const auth = useAuthContext();
  return auth;
};

export default useAuth;