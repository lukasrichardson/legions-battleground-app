import { useSession } from 'next-auth/react';

/**
 * Simple wrapper around NextAuth's useSession hook
 * Provides convenient access to authentication state and user info
 */
export const useAuth = () => {
  const { data: session, status } = useSession();

  return {
    // User information
    user: session?.user || null,
    userId: (session?.user as { id?: string })?.id || null, // Using the ID exposed via session callback
    
    // Authentication state
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    
    // Session data (for advanced use cases)
    session,
    status,
  };
};

export type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};