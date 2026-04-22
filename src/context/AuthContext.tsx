import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AuthContextType,
  AuthState,
  User,
  UserRole,
  Permission,
  ScopeLevel,
  rolePermissions,
} from "@/types/rbac";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        const token = localStorage.getItem("authToken");
        const userData = localStorage.getItem("userData");

        if (token && userData) {
          const user = JSON.parse(userData);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      // In production, this would be an API call to your backend
      // For now, we'll simulate authentication
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Simulate different users based on email
      let user: User;
      if (email.includes("admin")) {
        user = {
          id: "1",
          email,
          fullName: "Admin User",
          role: UserRole.ADMIN,
          scope: {
            level: ScopeLevel.FACTORY,
            factoryId: "factory-1",
          },
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        user = {
          id: "2",
          email,
          fullName: "Regular User",
          role: UserRole.USER,
          scope: {
            level: ScopeLevel.AREA,
            factoryId: "factory-1",
            areaId: "area-1",
          },
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // Store in localStorage
      const token = "token-" + Date.now();
      localStorage.setItem("authToken", token);
      localStorage.setItem("userData", JSON.stringify(user));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!authState.user) return false;

    const userPermissions = rolePermissions[authState.user.role];
    return userPermissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    return authState.user?.role === role;
  };

  const canAccessFactory = (factoryId: string): boolean => {
    if (!authState.user) return false;
    if (authState.user.role === UserRole.ADMIN) return true;

    return (
      authState.user.scope.level === ScopeLevel.FACTORY &&
      authState.user.scope.factoryId === factoryId
    );
  };

  const canAccessArea = (areaId: string): boolean => {
    if (!authState.user) return false;
    if (authState.user.role === UserRole.ADMIN) return true;

    if (
      authState.user.scope.level === ScopeLevel.AREA &&
      authState.user.scope.areaId === areaId
    ) {
      return true;
    }
    if (authState.user.scope.level === ScopeLevel.FACTORY) {
      return true; // Can access all areas in their factory
    }

    return false;
  };

  const canAccessDryer = (dryerId: string): boolean => {
    if (!authState.user) return false;
    if (authState.user.role === UserRole.ADMIN) return true;

    if (
      authState.user.scope.level === ScopeLevel.DRYER &&
      authState.user.scope.dryerId === dryerId
    ) {
      return true;
    }
    if (authState.user.scope.level === ScopeLevel.AREA) {
      return true; // Can access all dryers in their area
    }
    if (authState.user.scope.level === ScopeLevel.FACTORY) {
      return true; // Can access all dryers in their factory
    }

    return false;
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    hasPermission,
    hasRole,
    canAccessFactory,
    canAccessArea,
    canAccessDryer,
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
