import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { PermissionManager, ROLES } from '../utils/rolePermissions';
import { AuditLogger } from '../utils/auditUtils';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  lastLogin?: Date;
  isActive: boolean;
  mustChangePassword?: boolean;
  sessionId: string;
  loginAttempts?: number;
  lockedUntil?: Date;
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiry: Date | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
  checkAnyPermission: (permissions: string[]) => boolean;
  refreshSession: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isSessionValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    sessionExpiry: null,
    token: null,
  });

  // Session validation
  const isSessionValid = (): boolean => {
    if (!authState.sessionExpiry) return false;
    return new Date() < authState.sessionExpiry;
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedAuth = localStorage.getItem('mediconnect_admin_auth');
        if (savedAuth) {
          const parsedAuth = JSON.parse(savedAuth);
          
          // Check if session is still valid
          if (parsedAuth.sessionExpiry && new Date(parsedAuth.sessionExpiry) > new Date()) {
            setAuthState({
              user: parsedAuth.user,
              isAuthenticated: true,
              isLoading: false,
              sessionExpiry: new Date(parsedAuth.sessionExpiry),
              token: parsedAuth.token,
            });
            
            // Log session restoration
            AuditLogger.log('SESSION_RESTORED', parsedAuth.user.id, {
              userEmail: parsedAuth.user.email,
              sessionId: parsedAuth.user.sessionId
            });
          } else {
            // Session expired
            localStorage.removeItem('mediconnect_admin_auth');
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('mediconnect_admin_auth');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  // Auto-logout on session expiry
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.sessionExpiry) return;

    const checkSession = () => {
      if (!isSessionValid()) {
        toast.warning('Session expired. Please log in again.');
        logout();
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.sessionExpiry]);

  const login = (user: AdminUser, token: string) => {
      const sessionExpiry = new Date(Date.now() + SESSION_DURATION);
      const newAuthState = {
        user,
        isAuthenticated: true,
        isLoading: false,
        sessionExpiry,
        token
      };

      setAuthState(newAuthState);
      localStorage.setItem('mediconnect_admin_auth', JSON.stringify(newAuthState));
      toast.success(`Welcome back, ${user.name}!`);
  };

  const logout = () => {
    if (authState.user) {
      AuditLogger.log('LOGOUT', authState.user.id, {
        userEmail: authState.user.email,
        sessionId: authState.user.sessionId
      });
    }

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionExpiry: null,
      token: null,
    });

    localStorage.removeItem('mediconnect_admin_auth');
    toast.success('Logged out successfully');
  };

  const checkPermission = (permission: string): boolean => {
    if (!authState.user) return false;
    return PermissionManager.hasPermission(authState.user.role, permission);
  };

  const checkAnyPermission = (permissions: string[]): boolean => {
    if (!authState.user) return false;
    return PermissionManager.hasAnyPermission(authState.user.role, permissions);
  };

  const refreshSession = async (): Promise<boolean> => {
    if (!authState.user || !isSessionValid()) {
      logout();
      return false;
    }

    try {
      const newSessionExpiry = new Date(Date.now() + SESSION_DURATION);
      const updatedAuthState = {
        ...authState,
        sessionExpiry: newSessionExpiry
      };

      setAuthState(updatedAuthState);
      localStorage.setItem('mediconnect_admin_auth', JSON.stringify(updatedAuthState));

      AuditLogger.log('SESSION_REFRESHED', authState.user.id, {
        sessionId: authState.user.sessionId,
        newExpiry: newSessionExpiry.toISOString()
      });

      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!authState.user) return false;

    try {
      // In production, this would call your backend API
      await new Promise(resolve => setTimeout(resolve, 1000));

      AuditLogger.log('PASSWORD_CHANGED', authState.user.id, {
        userEmail: authState.user.email
      });

      toast.success('Password changed successfully');
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
      return false;
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    checkPermission,
    checkAnyPermission,
    refreshSession,
    changePassword,
    isSessionValid
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermissions?: string[]
) {
  return function AuthenticatedComponent(props: T) {
    const { isAuthenticated, isLoading, checkAnyPermission } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    if (requiredPermissions && !checkAnyPermission(requiredPermissions)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
