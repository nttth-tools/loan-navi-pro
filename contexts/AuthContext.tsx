"use client";

// Firebase を使わないスタブ版 AuthContext
// データは localStorage で管理、ログイン不要でアプリを利用できる

import { createContext, useContext, ReactNode } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { UserProfile } from "@/hooks/useUserProfile";

interface AuthContextValue {
  user:          null;
  companyId:     string | null;
  profile:       UserProfile;
  loading:       false;
  authError:     null;
  signIn:        (email: string, password: string) => Promise<void>;
  signUp:        (email: string, password: string, name: string, company: string) => Promise<void>;
  signOut:       () => Promise<void>;
  updateProfile: (p: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, companyId: "local", profile: { name: "山田 太郎", role: "営業担当", company: "株式会社〇〇ハウス", email: "" },
  loading: false, authError: null,
  signIn: async () => {}, signUp: async () => {},
  signOut: async () => {}, updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { profile, save } = useUserProfile();

  const value: AuthContextValue = {
    user:      null,
    companyId: "local",
    profile,
    loading:   false,
    authError: null,
    signIn:        async () => {},
    signUp:        async () => {},
    signOut:       async () => {},
    updateProfile: save,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "山田 太郎", role: "営業担当", company: "株式会社〇〇ハウス", email: "",
};
