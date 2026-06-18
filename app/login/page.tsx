"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Firebase なし版 — ログイン不要のためダッシュボードへ直接リダイレクト
export default function LoginPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard"); }, [router]);
  return null;
}
