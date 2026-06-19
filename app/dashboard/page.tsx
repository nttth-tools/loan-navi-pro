"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar, AlertTriangle, Clock, CheckSquare, CalendarClock,
  ChevronRight, ExternalLink, Square, MapPin, FileText,
  Bell, ArrowRight,
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLoanSchedules } from "@/hooks/useLoanSchedules";
import { useCustomers } from "@/hooks/useCustomers";

// ─── Date helpers ────────────────────────────────────────────

function useTodayJa() {
  const [text, setText] = useState("");
  useEffect(() => {
    const d = new Date();
    const days = ["日","月","火","水","木","金","土"];
    setText(`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日（${days[d.getDay()]}）`);
  }, []);
  return text;
}

function relativeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

function fmtMD(d: Date) {
  const days = ["日","月","火","水","木","金","土"];
  return `${d.getMonth()+1}/${d.getDate()}（${days[d.getDay()]}）`;
}
function offsetDate(n: number): Date { const x = new Date(); x.setDate(x.getDate()+n); return x; }

// ─── Demo data ───────────────────────────────────────────────

type TodayTask = {
  id: string;
  customerName: string;
  taskName: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  time: string;
  urgency: 'overdue' | 'today' | 'soon';
};

function buildTodayTasks(): TodayTask[] {
  return [
    {
      id: "t1", customerName: "山田 様", taskName: "本申込書の提出",
      tag: "本審査", tagColor: "#7C3AED", tagBg: "#EDE9FE",
      time: "10:00", urgency: "today",
    },
    {
      id: "t2", customerName: "佐藤 様", taskName: "金消契約書の内容確認",
      tag: "契約準備", tagColor: "#059669", tagBg: "#D1FAE5",
      time: "14:00", urgency: "today",
    },
    {
      id: "t3", customerName: "鈴木 様", taskName: "着工金実行の銀行確認",
      tag: "融資実行", tagColor: "#1D4ED8", tagBg: "#DBEAFE",
      time: "11:00", urgency: "today",
    },
    {
      id: "t4", customerName: "田中 様", taskName: "融資実行日の調整連絡",
      tag: "融資実行", tagColor: "#1D4ED8", tagBg: "#DBEAFE",
      time: "15:00", urgency: "today",
    },
    {
      id: "t5", customerName: "高橋 様", taskName: "事前審査の追加書類送付",
      tag: "事前審査", tagColor: "#B45309", tagBg: "#FEF3C7",
      time: "（昨日期限）", urgency: "overdue",
    },
  ];
}

function buildWeekTasks() {
  return [
    { name: "伊藤 様 銀行比較提案書作成", tag: "提案", tagColor: "#B45309", tagBg: "#FEF3C7", date: fmtMD(offsetDate(1)) },
    { name: "木村 様 書類チェック", tag: "事前審査", tagColor: "#1D4ED8", tagBg: "#DBEAFE", date: fmtMD(offsetDate(2)) },
    { name: "松田 様 進捗確認電話", tag: "本審査", tagColor: "#7C3AED", tagBg: "#EDE9FE", date: fmtMD(offsetDate(2)) },
    { name: "中村 様 面談", tag: "提案", tagColor: "#B45309", tagBg: "#FEF3C7", date: fmtMD(offsetDate(3)) },
    { name: "渡辺 様 融資実行準備", tag: "融資実行", tagColor: "#1D4ED8", tagBg: "#DBEAFE", date: fmtMD(offsetDate(4)) },
  ];
}

function buildRecentCustomers() {
  return [
    { name: "田中 健一 様", age: 35, amount: "4,000万円", status: "本審査中", statusColor: "#7C3AED", statusBg: "#EDE9FE", date: relativeDate(0) },
    { name: "佐藤 美咲 様", age: 32, amount: "3,500万円", status: "契約準備", statusColor: "#059669", statusBg: "#D1FAE5", date: relativeDate(0) },
    { name: "鈴木 大輔 様", age: 40, amount: "5,000万円", status: "事前審査中", statusColor: "#1D4ED8", statusBg: "#DBEAFE", date: relativeDate(-1) },
    { name: "高橋 優子 様", age: 28, amount: "3,000万円", status: "提案中", statusColor: "#B45309", statusBg: "#FEF3C7", date: relativeDate(-1) },
    { name: "伊藤 誠 様",   age: 45, amount: "6,000万円", status: "融資実行待", statusColor: "#1D4ED8", statusBg: "#DBEAFE", date: relativeDate(-2) },
  ];
}

// ─── Sub-components ──────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl transition-shadow ${className}`}
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, href, count }: { title: string; href?: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-0 px-5 pt-5 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        {count !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#F3F4F6", color: "#6B7280" }}>
            {count}件
          </span>
        )}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "#6B7280" }}>
          すべて見る <ExternalLink size={10} />
        </Link>
      )}
    </div>
  );
}

const alertColorMap = (days: number) => {
  if (days < 0)   return { color: "#DC2626", bg: "#FEF2F2", label: `${Math.abs(days)}日超過` };
  if (days === 0)  return { color: "#EA580C", bg: "#FFF7ED", label: "本日期限" };
  if (days <= 3)   return { color: "#D97706", bg: "#FFFBEB", label: `残${days}日` };
  if (days <= 7)   return { color: "#CA8A04", bg: "#FEFCE8", label: `残${days}日` };
  return               { color: "#2563EB", bg: "#EFF6FF", label: `残${days}日` };
};

// ─── Page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const todayJa = useTodayJa();
  const { profile } = useUserProfile();
  const { getAlerts } = useLoanSchedules();
  const { customers } = useCustomers();

  const loanAlerts = useMemo(() => getAlerts().slice(0, 6), [customers]);
  const todayTasks = useMemo(() => buildTodayTasks(), []);
  const weekTasks  = useMemo(() => buildWeekTasks(), []);
  const recentCustomers = useMemo(() => buildRecentCustomers(), []);

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setChecked(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Sort: overdue → today (by time) — demo data is already sorted
  const sortedTasks = [...todayTasks].sort((a, b) => {
    const ord = { overdue: 0, today: 1, soon: 2 };
    return ord[a.urgency] - ord[b.urgency];
  });
  const remaining  = sortedTasks.filter(t => !checked.has(t.id));
  const done       = sortedTasks.filter(t => checked.has(t.id));

  return (
    <div className="p-4 md:p-7 max-w-[1280px]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {profile.name}さん、お疲れ様です
          </h1>
          <p className="text-sm mt-1 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <Calendar size={13} />
            {todayJa}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tasks"
            className="relative p-2 rounded-lg transition-colors hover:bg-gray-50"
            style={{ border: "1px solid var(--border)" }}>
            <Bell size={15} style={{ color: "var(--text-secondary)" }} />
            {remaining.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: "#EF4444", color: "#fff", fontSize: "9px" }}>
                {remaining.length}
              </span>
            )}
          </Link>
          <Link href="/loan-schedule"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-gray-50"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <CalendarClock size={13} />
            スケジュール
          </Link>
          <Link href="/diagnosis"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "linear-gradient(135deg,#3B82F6,#6366F1)", color: "#fff" }}>
            ローン診断
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── 本日の対応タスク ── */}
      <Card className="mb-4">
        <SectionTitle
          title="本日の対応タスク"
          href="/tasks"
          count={remaining.length}
        />
        <div className="p-5">
          {remaining.length === 0 && done.length === 0 && (
            <div className="py-8 text-center">
              <CheckSquare size={28} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
              <p className="text-sm" style={{ color: "#9CA3AF" }}>本日の対応タスクはありません</p>
            </div>
          )}

          {/* 未完了 */}
          {remaining.length > 0 && (
            <div className="space-y-1">
              {remaining.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group"
                  style={{ outline: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  {/* urgency bar */}
                  <div className="w-1 h-8 rounded-full shrink-0"
                    style={{ background: t.urgency === "overdue" ? "#EF4444" : "#D1D5DB" }} />
                  <Square size={15} className="shrink-0" style={{ color: t.urgency === "overdue" ? "#EF4444" : "#9CA3AF" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {t.customerName}
                      </span>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {t.taskName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: t.tagBg, color: t.tagColor }}>
                        {t.tag}
                      </span>
                      <span className="text-xs" style={{ color: t.urgency === "overdue" ? "#EF4444" : "#9CA3AF" }}>
                        {t.urgency === "overdue" ? "⚠ " : ""}{t.time}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 完了済み */}
          {done.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
              <p className="text-xs font-medium mb-2 px-3" style={{ color: "#9CA3AF" }}>
                完了 ({done.length})
              </p>
              <div className="space-y-1">
                {done.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                    style={{ outline: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <div className="w-1 h-6 rounded-full shrink-0" style={{ background: "#E5E7EB" }} />
                    <CheckSquare size={15} className="shrink-0" style={{ color: "#10B981" }} />
                    <span className="text-sm line-through" style={{ color: "#9CA3AF" }}>
                      {t.customerName}　{t.taskName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer link */}
          <div className="mt-4 pt-3 flex items-center gap-3" style={{ borderTop: "1px solid #F3F4F6" }}>
            <Link href="/tasks"
              className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: "#2563EB" }}>
              タスクを追加 <ChevronRight size={12} />
            </Link>
            <Link href="/loan-schedule"
              className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: "#6B7280" }}>
              スケジュールを確認 <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </Card>

      {/* ── Middle row: alerts + recent customers + week tasks ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 mb-4">

        {/* Left: alerts + recent customers */}
        <div className="space-y-4">

          {/* ローンスケジュールアラート */}
          <Card>
            <SectionTitle title="ローンスケジュール アラート" href="/loan-schedule" />
            <div className="p-5">
              {loanAlerts.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarClock size={26} className="mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>期限の近い工程はありません</p>
                  <p className="text-xs mt-1" style={{ color: "#CBD5E1" }}>スケジュールを登録すると自動でアラートが表示されます</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {loanAlerts.map((a, i) => {
                    const c   = customers.find(x => x.id === a.customerId);
                    const col = alertColorMap(a.daysUntil);
                    return (
                      <Link key={i} href="/loan-schedule"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                        style={{ textDecoration: "none" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}>
                        <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: col.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {c?.name ?? "—"}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                            {a.task.name}
                          </p>
                        </div>
                        <span className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded"
                          style={{ background: col.bg, color: col.color }}>
                          {col.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* 最近の顧客一覧 */}
          <Card>
            <SectionTitle title="最近の顧客一覧" href="/customers" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["顧客名", "年齢", "希望額", "進捗", "最終更新"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentCustomers.map((c, i) => (
                    <tr key={i}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid #F9FAFB" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: "#EFF6FF", color: "#2563EB" }}>
                            {c.name[0]}
                          </div>
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{c.age}歳</td>
                      <td className="px-5 py-3 text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{c.amount}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded font-medium"
                          style={{ background: c.statusBg, color: c.statusColor }}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>{c.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3" style={{ borderTop: "1px solid #F9FAFB" }}>
              <Link href="/customers"
                className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "#6B7280" }}>
                顧客一覧をすべて見る <ExternalLink size={10} />
              </Link>
            </div>
          </Card>
        </div>

        {/* Right: 今週のタスク */}
        <div>
          <Card className="sticky top-4">
            <SectionTitle title="今週のタスク" href="/tasks" count={weekTasks.length} />
            <div className="p-5 space-y-1">
              {weekTasks.map((t, i) => (
                <div key={i}
                  className="flex items-start gap-2.5 px-2 py-2.5 rounded-lg cursor-pointer transition-colors group"
                  onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <Square size={13} className="shrink-0 mt-0.5" style={{ color: "#D1D5DB" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ background: t.tagBg, color: t.tagColor }}>
                        {t.tag}
                      </span>
                      <span className="text-xs" style={{ color: "#9CA3AF" }}>{t.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-5">
              <Link href="/tasks"
                className="w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors hover:opacity-90"
                style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" }}>
                タスクを追加する
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* ── CTA banner ── */}
      <div className="rounded-xl p-5 flex items-center gap-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#EFF6FF" }}>
          <FileText size={17} style={{ color: "#2563EB" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            お客様にローン診断を提案しましょう
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            属性情報を入力するだけで、最適な銀行候補を自動算出・提案書を即時作成できます
          </p>
        </div>
        <Link href="/diagnosis"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 shrink-0"
          style={{ background: "linear-gradient(135deg,#3B82F6,#6366F1)", color: "#fff" }}>
          ローン診断を始める <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
