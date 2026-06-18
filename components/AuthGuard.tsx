"use client";

// Firebase なし版 — ログイン不要、常に children を表示する
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
