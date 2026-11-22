"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  AuthUser,
  EmployeeRole,
} from "@/types/employee";

import {
  signInWithEmployee,
  signOutEmployee,
} from "@/firebase/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (
    employeeId: string,
    pin: string,
  ) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: EmployeeRole) => boolean;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  );

const STORAGE_KEY = "clock-tower-user";

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (saved) {
        setUser(
          JSON.parse(saved) as AuthUser,
        );
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(
    employeeId: string,
    pin: string,
  ): Promise<boolean> {
    try {
      const authenticatedUser =
        await signInWithEmployee(
          employeeId,
          pin,
        );

      if (!authenticatedUser) {
        return false;
      }

      setUser(authenticatedUser);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          authenticatedUser,
        ),
      );

      return true;
    } catch (error) {
      console.error(
        "Staff Firebase login error:",
        error,
      );

      return false;
    }
  }

  async function logout() {
    try {
      await signOutEmployee();
    } catch (error) {
      console.error(
        "Staff logout error:",
        error,
      );
    }

    setUser(null);

    localStorage.removeItem(
      STORAGE_KEY,
    );
  }

  function hasRole(
    role: EmployeeRole,
  ) {
    return user?.role === role;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside AuthProvider",
    );
  }

  return context;
}

export const useAuth =
  useAuthContext;