import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

interface User {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  role: "customer" | "host";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  role?: "customer" | "host";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "@wrenchlist_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(USER_STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(new URL("/api/auth/signin", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Sign in failed" };
      }

      setUser(data.user);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (signUpData: SignUpData) => {
    setIsLoading(true);
    try {
      const response = await fetch(new URL("/api/auth/signup", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signUpData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Sign up failed" };
      }

      setUser(data.user);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
