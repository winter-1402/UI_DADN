import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AuthContextType,
  AuthState,
  UserRole,
  Permission,
  APIUser,
  User,
  rolePermissions,
} from "@/types/rbac";
import { authAPI } from "../app/config/api.config";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Convert API User response to internal User object with computed role
 */
const mapAPIUserToUser = (apiUser: APIUser): User => {
  return {
    ...apiUser,
    role: apiUser.is_admin ? UserRole.ADMIN : UserRole.USER,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const storedUserData = localStorage.getItem("userData");

        if (!token) {
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        // Optimistically restore user from cache
        if (storedUserData) {
          const cachedUser = JSON.parse(storedUserData) as User;
          setAuthState({ user: cachedUser, isAuthenticated: true, isLoading: true });
        }

        // Validate token by fetching current user
        try {
          const response = await authAPI.getCurrentUser();
          const apiUser: APIUser = response.data ?? response;
          const user = mapAPIUserToUser(apiUser);
          localStorage.setItem("userData", JSON.stringify(user));
          setAuthState({ user, isAuthenticated: true, isLoading: false });
        } catch {
          // Token invalid/expired
          localStorage.removeItem("access_token");
          localStorage.removeItem("userData");
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));
    try {
      // 1. Call POST /auth/login -> { data: { access_token, ... } }
      const loginResponse = await authAPI.login(email, password);
      const accessToken: string | undefined =
        loginResponse?.data?.access_token ?? loginResponse?.access_token;

      if (!accessToken) {
        throw new Error("Login response missing access_token");
      }

      // 2. Persist token so subsequent apiRequest calls are authenticated
      localStorage.setItem("access_token", accessToken);
      // 3. Resolve current user (prefer payload from login, fallback to /auth/me)
      let apiUser: APIUser | undefined =
        loginResponse?.data?.user ?? loginResponse?.user;
      if (!apiUser) {
        const meResponse = await authAPI.getCurrentUser();
        apiUser = meResponse.data ?? meResponse;
      }
      if (!apiUser) {
        throw new Error("Unable to resolve current user");
      }

      const user = mapAPIUserToUser(apiUser);
      localStorage.setItem("userData", JSON.stringify(user));

      setAuthState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("userData");
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
  };

  const logout = (): void => {
    // Best-effort server-side logout; ignore failures
    authAPI.logout().catch(() => {});
    localStorage.removeItem("access_token");
    localStorage.removeItem("userData");
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    if (!authState.user) return false;
    if (authState.user.role === UserRole.ADMIN) return true;
    return authState.user.role === role;
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!authState.user) return false;

    const userRole = authState.user.role;
    const permissions = rolePermissions[userRole] || [];

    return permissions.includes(permission);
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
