"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserProfile {
  name:    string;
  role:    string;
  company: string;
  email:   string;
}

const LS_KEY = "loan_navi_user_profile";

const DEFAULT_PROFILE: UserProfile = {
  name:    "山田 太郎",
  role:    "営業担当",
  company: "株式会社〇〇ハウス",
  email:   "",
};

export function loadUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PROFILE;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loaded,  setLoaded]  = useState(false);

  useEffect(() => {
    setProfile(loadUserProfile());
    setLoaded(true);
  }, []);

  const save = useCallback(async (p: UserProfile) => {
    setProfile(p);
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  }, []);

  return { profile, save, loaded };
}
