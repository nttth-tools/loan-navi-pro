"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, ListChecks, GitBranch, Plus, ChevronRight,
  AlertCircle, CheckCircle2, Clock, Search, X, Trash2,
  FileText, User, Building2, Save, Zap, BarChart2,
} from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useBanks } from "@/hooks/useBanks";
import { useLoanSchedules } from "@/hooks/useLoanSchedules";
import { useLoanScheduleTemplates } from "@/hooks/useLoanScheduleTemplates";
import {
  LOAN_DATE_LABELS, TASK_STATUS_LABELS, TASK_STATUS_STYLES,
  type LoanDateKey, type LoanTask, type TaskStatus, type LoanSchedule,
} from "@/types";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const DATE_KEYS_ORDERED: LoanDateKey[] = [
  "preLoanApplicationDate", "preLoanApprovalDate",
  "mainApplicationDate",    "mainApprovalDate",
  "landContractDate",       "landSettlementDate",
  "buildingContractDate",   "constructionStartDate",
  "constructionPaymentDate","raisedFrameDate",
  "interimPaymentDate",     "loanContractDate",
  "loanExecutionDate",      "deliveryDate",
];

const TIMELINE_STEPS: { key: LoanDateKey; label: string; color: string }[] = [
  { key: "preLoanApplicationDate",  label: "事前審査申込",  color: "#8B5CF6" },
  { key: "preLoanApprovalDate",     label: "事前審査承認",  color: "#7C3AED" },
  { key: "mainApplicationDate",     label: "本申込",        color: "#3B82F6" },
  { key: "mainApprovalDate",        label: "本申込承認",    color: "#2563EB" },
  { key: "landSettlementDate",      label: "土地決済",      color: "#F59E0B" },
  { key: "constructionPaymentDate", label: "着工金",        color: "#F97316" },
  { key: "interimPaymentDate",      label: "中間金",        color: "#EF4444" },
  { key: "loanContractDate",        label: "金消契約",      color: "#10B981" },
  { key: "loanExecutionDate",       label: "融資実行",      color: "#059669" },
  { key: "deliveryDate",            label: "引渡し",        color: "#D4AF37" },
];

// ─── ユーティリティ ───────────────────────────────────────────────────────────

function daysUntilColor(days: number) {
  if (days < 0)  return { text: "#EF4444", bg: "#FEF2F2", label: "期限切れ" };
  if (days === 0) return { text: "#F97316", bg: "#FFF7ED", label: "本日期限" };
  if (days <= 7)  return { text: "#EAB308", bg: "#FEFCE8", label: `残${days}日` };
  if (days <= 14) return { text: "#F59E0B", bg: "#FFFBEB", label: `残${days}日` };
  return              { text: "#3B82F6", bg: "#EFF6FF", label: `残${days}日` };
}

function calcDueDate(baseDate: string | undefined, offsetDays: number): string | undefined {
  if (!baseDate) return undefined;
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function todayDiff(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due   = new Date(dateStr); due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - today.getTime()) / 86_400_000);
}

function fmtDate(d: string | undefined) {
  if (!d) return "—";
  return d.replace(/-/g, "/");
}

// ─── サブコンポーネント ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TaskStatus }) {
  const s = TASK_STATUS_STYLES[status];
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color }}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

function DueBadge({ dueDate }: { dueDate?: string }) {
  const diff = todayDiff(dueDate);
  if (diff === null) return <span className="text-xs" style={{ color: "var(--text-muted)" }}>日程未設定</span>;
  const c = daysUntilColor(diff);
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

// ─── タイムラインビュー ───────────────────────────────────────────────────────

function TimelineView({ schedule }: { schedule: LoanSchedule }) {
  return (
    <div className="p-4">
      <div className="relative">
        {/* 縦線 — 統一グレー */}
        <div className="absolute left-[19px] top-6 bottom-6 w-0.5"
          style={{ background: "#E5E7EB" }} />

        <div className="space-y-2">
          {TIMELINE_STEPS.map((step, i) => {
            const date = schedule.dates[step.key];
            const tasks = schedule.tasks.filter(t => t.baseDateKey === step.key && t.status !== "done");
            const diff = todayDiff(date);

            // 進捗状態の判定
            const isCompleted  = date !== undefined && diff !== null && diff < 0;
            const isUpcoming   = date !== undefined && diff !== null && diff >= 0;
            const isUnset      = date === undefined;

            return (
              <div key={step.key} className="flex gap-4 relative">
                {/* ドット — 常に同じグレー */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10"
                  style={{
                    background: "#E5E7EB",
                    border: "2px solid #D1D5DB",
                  }}>
                  {isCompleted ? (
                    <CheckCircle2 size={16} style={{ color: "#22C55E" }} />
                  ) : (
                    <span className="text-xs font-bold" style={{ color: "#374151" }}>
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* コンテンツ */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                      {step.label}
                    </span>

                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "#DCFCE7", color: "#15803D" }}>
                        <CheckCircle2 size={10} />完了
                      </span>
                    )}

                    {isUpcoming && diff !== null && diff <= 30 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                        対応中
                      </span>
                    )}

                    {isUnset && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "#F3F4F6", color: "#9CA3AF" }}>
                        未着手
                      </span>
                    )}

                    {date && (
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{fmtDate(date)}</span>
                    )}

                    {isUpcoming && diff !== null && (
                      <DueBadge dueDate={date} />
                    )}
                  </div>

                  {tasks.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {tasks.map(task => {
                        const taskDiff = todayDiff(task.dueDate);
                        return (
                          <div key={task.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded-lg"
                            style={{ background: "var(--bg-secondary)" }}>
                            <AlertCircle size={10} style={{ color: taskDiff !== null && taskDiff <= 7 ? "#EF4444" : "#94A3B8", flexShrink: 0 }} />
                            <span style={{ color: "var(--text-secondary)" }}>{task.name}</span>
                            {task.dueDate && <span style={{ color: "var(--text-muted)" }}>({fmtDate(task.dueDate)})</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ガントチャート ───────────────────────────────────────────────────────────

const ROADMAP_EVENTS: { key: LoanDateKey; label: string; color: string }[] = [
  { key: "deliveryDate",            label: "引渡し",     color: "#2563EB" },
  { key: "loanExecutionDate",       label: "融資実行",   color: "#059669" },
  { key: "loanContractDate",        label: "金消契約",   color: "#0D9488" },
  { key: "constructionPaymentDate", label: "着工金",     color: "#7C3AED" },
  { key: "landSettlementDate",      label: "土地決済",   color: "#F59E0B" },
  { key: "mainApprovalDate",        label: "本申込承認", color: "#6366F1" },
];

const GANTT_PX   = 6;   // px per day
const GANTT_ROW  = 44;
const GANTT_HEAD = 36;
const GANTT_LEFT = 116;

function ganttMarkerColor(dateStr: string, today: Date) {
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0)   return { border: "#EF4444", fill: "#FEF2F2", text: "#EF4444", badge: "期限超過" };
  if (diff === 0) return { border: "#F97316", fill: "#FFEDD5", text: "#EA580C", badge: "本日" };
  if (diff <= 7)  return { border: "#F97316", fill: "#FFEDD5", text: "#EA580C", badge: `残${diff}日` };
  if (diff <= 14) return { border: "#EAB308", fill: "#FEF9C3", text: "#CA8A04", badge: `残${diff}日` };
  return              { border: "#CBD5E1", fill: "#F8FAFC",  text: "#64748B", badge: "" };
}

function YearRoadmap({ schedule }: { schedule: LoanSchedule }) {
  const now  = new Date();
  const year = now.getFullYear();
  const curM = now.getMonth();

  const eventsInMonth = (m: number) =>
    ROADMAP_EVENTS.filter(ev => {
      const d = schedule.dates[ev.key];
      if (!d) return false;
      const dt = new Date(d);
      return dt.getFullYear() === year && dt.getMonth() === m;
    });

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
      <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b"
        style={{ borderColor: "#E5E7EB", background: "#FAFAFA" }}>
        <div className="flex items-center gap-1.5 mr-2">
          <CalendarDays size={13} style={{ color: "#6B7280" }} />
          <span className="text-sm font-semibold" style={{ color: "#111827" }}>{year}年 年間ロードマップ</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {ROADMAP_EVENTS.map(ev => (
            <div key={ev.key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: ev.color }} />
              <span className="text-xs" style={{ color: "#6B7280" }}>{ev.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
        {Array.from({ length: 12 }, (_, m) => {
          const evs    = eventsInMonth(m);
          const isCur  = m === curM;
          const isPast = m < curM;
          return (
            <div key={m} className="border-r p-2 last:border-r-0"
              style={{ borderColor: "#E5E7EB", background: isCur ? "#EFF6FF" : isPast ? "#FAFAFA" : "#fff", minHeight: 80 }}>
              <div className="text-xs font-semibold mb-1.5"
                style={{ color: isCur ? "#2563EB" : isPast ? "#9CA3AF" : "#374151" }}>
                {m + 1}月{isCur ? " ●" : ""}
              </div>
              <div className="space-y-1">
                {evs.map((ev, i) => (
                  <div key={i} className="text-xs px-1 py-0.5 rounded truncate font-semibold"
                    style={{ background: ev.color + "20", color: ev.color, fontSize: "10px" }}>
                    {ev.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GanttView({ schedule }: { schedule: LoanSchedule }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const validStrs = TIMELINE_STEPS
    .map(s => schedule.dates[s.key])
    .filter((d): d is string => !!d);

  // ── date range ────────────────────────────────────────────────────────────
  let rangeStart: Date, rangeEnd: Date;
  if (validStrs.length === 0) {
    const now = new Date();
    rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    rangeEnd   = new Date(now.getFullYear(), now.getMonth() + 7, 0);
  } else {
    const ds = validStrs.map(s => { const d = new Date(s); d.setHours(0,0,0,0); return d; });
    rangeStart = new Date(Math.min(...ds.map(d => d.getTime())));
    rangeEnd   = new Date(Math.max(...ds.map(d => d.getTime())));
    rangeStart.setDate(1);                                  // snap to month start
    rangeEnd.setMonth(rangeEnd.getMonth() + 1, 0);          // snap to month end
  }

  const totalDays  = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000) + 1;
  const totalWidth = Math.max(totalDays * GANTT_PX, 480);

  const xOf = (s: string): number => {
    const d = new Date(s); d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - rangeStart.getTime()) / 86_400_000) * GANTT_PX;
  };

  const todayX    = Math.round((today.getTime() - rangeStart.getTime()) / 86_400_000) * GANTT_PX;
  const showToday = todayX >= 0 && todayX <= totalWidth;

  // month tick marks
  const monthTicks: { x: number; label: string; isJan: boolean }[] = [];
  const mc = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  while (mc <= rangeEnd) {
    monthTicks.push({
      x:     xOf(mc.toISOString().slice(0, 10)),
      label: mc.getMonth() === 0 ? `${mc.getFullYear()}年1月` : `${mc.getMonth() + 1}月`,
      isJan: mc.getMonth() === 0,
    });
    mc.setMonth(mc.getMonth() + 1);
  }

  return (
    <div className="p-4 space-y-5">
      {/* ── main chart ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
        <div style={{ display: "flex", overflow: "hidden" }}>

          {/* left label column */}
          <div className="shrink-0 border-r" style={{ width: GANTT_LEFT, borderColor: "#E5E7EB", background: "#FAFAFA" }}>
            <div className="flex items-end px-3 pb-1.5 border-b"
              style={{ height: GANTT_HEAD, borderColor: "#E5E7EB", background: "#F3F4F6" }}>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>工程</span>
            </div>
            {TIMELINE_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center px-3 border-b"
                style={{ height: GANTT_ROW, borderColor: "#F3F4F6", background: i % 2 === 0 ? "#FAFAFA" : "#fff" }}>
                <span className="text-xs font-medium" style={{ color: "#374151" }}>{step.label}</span>
              </div>
            ))}
          </div>

          {/* right scrollable timeline */}
          <div style={{ flex: 1, overflowX: "auto" }}>
            <div style={{ width: totalWidth, position: "relative" }}>

              {/* month header */}
              <div className="relative border-b"
                style={{ height: GANTT_HEAD, borderColor: "#E5E7EB", background: "#F3F4F6" }}>
                {monthTicks.map((tick, ti) => (
                  <div key={ti} className="absolute top-0 h-full flex items-end pb-1.5"
                    style={{ left: tick.x, paddingLeft: 6, borderLeft: ti > 0 ? "1px solid #E5E7EB" : "none" }}>
                    <span className="text-xs whitespace-nowrap"
                      style={{ color: tick.isJan ? "#1D4ED8" : "#6B7280", fontWeight: tick.isJan ? 600 : 400 }}>
                      {tick.label}
                    </span>
                  </div>
                ))}
                {showToday && (
                  <div className="absolute bottom-1 z-10" style={{ left: todayX, transform: "translateX(-50%)" }}>
                    <span className="text-xs font-bold px-1 rounded"
                      style={{ background: "#2563EB", color: "#fff", fontSize: "9px", lineHeight: "14px" }}>TODAY</span>
                  </div>
                )}
              </div>

              {/* rows */}
              {TIMELINE_STEPS.map((step, i) => {
                const dateStr = schedule.dates[step.key];
                const x  = dateStr !== undefined ? xOf(dateStr) : null;
                const mc = dateStr !== undefined ? ganttMarkerColor(dateStr, today) : null;

                return (
                  <div key={step.key} className="relative border-b"
                    style={{ height: GANTT_ROW, borderColor: "#F3F4F6", background: i % 2 === 0 ? "#FAFAFA" : "#fff" }}>

                    {/* month column lines */}
                    {monthTicks.map((tick, ti) => ti > 0 && (
                      <div key={ti} className="absolute top-0 h-full"
                        style={{ left: tick.x, width: 1, background: "#F0F0F0", zIndex: 1 }} />
                    ))}

                    {/* today line */}
                    {showToday && (
                      <div className="absolute top-0 h-full"
                        style={{ left: todayX, width: 2, background: "#BFDBFE", zIndex: 2 }} />
                    )}

                    {/* baseline */}
                    <div className="absolute" style={{ top: "50%", left: 0, right: 0, height: 1, background: "#E5E7EB", zIndex: 1 }} />

                    {/* milestone marker + label */}
                    {x !== null && dateStr !== undefined && mc !== null && (
                      <>
                        <div className="absolute rounded-full border-2"
                          style={{ left: x - 6, top: "50%", transform: "translateY(-50%)",
                                   width: 12, height: 12, background: mc.fill, borderColor: mc.border, zIndex: 5 }} />
                        <div className="absolute whitespace-nowrap"
                          style={{ left: x + 10, top: "50%", transform: "translateY(-50%)",
                                   color: mc.text, fontSize: "10px", zIndex: 5, pointerEvents: "none" }}>
                          {dateStr.slice(5).replace("-", "/")}
                          {mc.badge && <span className="ml-1 font-semibold">{mc.badge}</span>}
                        </div>
                      </>
                    )}

                    {/* unset */}
                    {!dateStr && (
                      <div className="absolute" style={{ left: 8, top: "50%", transform: "translateY(-50%)", color: "#D1D5DB", fontSize: "10px" }}>
                        未設定
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── year roadmap ───────────────────────────────────────────────────── */}
      <YearRoadmap schedule={schedule} />
    </div>
  );
}

// ─── カレンダービュー ─────────────────────────────────────────────────────────

function CalendarView({ schedule }: { schedule: LoanSchedule }) {
  const [viewYear,  setViewYear]  = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // この月にある日程・タスクをマップ化
  const dayEvents: Record<number, { label: string; color: string }[]> = {};
  const addEvent = (dateStr: string | undefined, label: string, color: string) => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      if (!dayEvents[day]) dayEvents[day] = [];
      dayEvents[day].push({ label, color });
    }
  };

  for (const [key, label] of Object.entries(LOAN_DATE_LABELS) as [LoanDateKey, string][]) {
    const step = TIMELINE_STEPS.find(s => s.key === key);
    addEvent(schedule.dates[key], label, step?.color ?? "#94A3B8");
  }
  for (const task of schedule.tasks) {
    if (task.dueDate) addEvent(task.dueDate, task.name, "#6366F1");
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <div className="p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
          else setViewMonth(m => m - 1);
        }} className="px-3 py-1.5 rounded-lg text-sm" style={{ border: "1px solid var(--border)" }}>
          ‹
        </button>
        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {viewYear}年{viewMonth + 1}月
        </span>
        <button onClick={() => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
          else setViewMonth(m => m + 1);
        }} className="px-3 py-1.5 rounded-lg text-sm" style={{ border: "1px solid var(--border)" }}>
          ›
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-1">
        {["日","月","火","水","木","金","土"].map((d, i) => (
          <div key={d} className="text-center text-xs py-1 font-medium"
            style={{ color: i === 0 ? "#EF4444" : i === 6 ? "#3B82F6" : "var(--text-muted)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-px" style={{ background: "var(--border)" }}>
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} style={{ background: "var(--bg-card)" }} className="h-16" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const events = dayEvents[day] ?? [];
          const dayOfWeek = (firstDay + day - 1) % 7;
          return (
            <div key={day} className="h-16 p-1 overflow-hidden"
              style={{
                background: isToday(day) ? "#EFF6FF" : "var(--bg-card)",
                borderTop: isToday(day) ? "2px solid #3B82F6" : undefined,
              }}>
              <span className="text-xs font-medium block mb-0.5"
                style={{ color: dayOfWeek === 0 ? "#EF4444" : dayOfWeek === 6 ? "#3B82F6" : "var(--text-secondary)" }}>
                {day}
              </span>
              {events.slice(0, 2).map((ev, j) => (
                <div key={j} className="text-xs px-1 rounded truncate mb-px"
                  style={{ background: ev.color + "22", color: ev.color, fontSize: "9px" }}>
                  {ev.label}
                </div>
              ))}
              {events.length > 2 && (
                <div className="text-xs" style={{ color: "var(--text-muted)", fontSize: "9px" }}>
                  +{events.length - 2}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── タスク一覧ビュー ─────────────────────────────────────────────────────────

function TaskListView({
  schedule, onUpdateStatus, onUpdateTask, onAddTask, onDeleteTask,
}: {
  schedule: LoanSchedule;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateTask: (taskId: string, data: Partial<LoanTask>) => void;
  onAddTask: (task: Omit<LoanTask, "id">) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [editingTask, setEditingTask]   = useState<LoanTask | null>(null);
  const [addingTask,  setAddingTask]    = useState(false);
  const [newTask, setNewTask] = useState<Omit<LoanTask, "id">>({
    name: "", baseDateKey: "deliveryDate", offsetDays: -14,
    status: "pending", requiredDocuments: [], assignee: "",
  });

  const filtered = schedule.tasks.filter(t =>
    filterStatus === "all" || t.status === filterStatus
  ).sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const handleSaveNew = () => {
    const base = schedule.dates[newTask.baseDateKey];
    const dueDate = calcDueDate(base, newTask.offsetDays);
    onAddTask({ ...newTask, dueDate });
    setAddingTask(false);
    setNewTask({ name: "", baseDateKey: "deliveryDate", offsetDays: -14, status: "pending", requiredDocuments: [], assignee: "" });
  };

  const inputStyle = { background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="p-4">
      {/* フィルター */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "pending", "in_progress", "done", "on_hold"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={filterStatus === s
              ? { background: "#2563EB", color: "#fff" }
              : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            {s === "all" ? "すべて" : TASK_STATUS_LABELS[s]}
            {s !== "all" && (
              <span className="ml-1 opacity-70">
                ({schedule.tasks.filter(t => t.status === s).length})
              </span>
            )}
          </button>
        ))}
        <button onClick={() => setAddingTask(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "#2563EB", color: "#fff" }}>
          <Plus size={12} />タスク追加
        </button>
      </div>

      {/* タスク追加フォーム */}
      {addingTask && (
        <div className="mb-4 p-4 rounded-xl space-y-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>タスク名</label>
              <input value={newTask.name} onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>基準日</label>
              <select value={newTask.baseDateKey} onChange={e => setNewTask(p => ({ ...p, baseDateKey: e.target.value as LoanDateKey }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                {DATE_KEYS_ORDERED.map(k => <option key={k} value={k}>{LOAN_DATE_LABELS[k]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                オフセット日数（負=前・正=後）
              </label>
              <input type="number" value={newTask.offsetDays}
                onChange={e => setNewTask(p => ({ ...p, offsetDays: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>担当者</label>
              <input value={newTask.assignee ?? ""} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>銀行提出先</label>
              <input value={newTask.bankSubmitTo ?? ""} onChange={e => setNewTask(p => ({ ...p, bankSubmitTo: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAddingTask(false)} className="px-4 py-2 rounded-lg text-sm"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>キャンセル</button>
            <button onClick={handleSaveNew} disabled={!newTask.name}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: "#2563EB", color: "#fff" }}>追加</button>
          </div>
        </div>
      )}

      {/* タスク一覧 */}
      {filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          <ListChecks size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">タスクがありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const diff = todayDiff(task.dueDate);
            const isEditing = editingTask?.id === task.id;
            return (
              <div key={task.id} className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                {/* タスク行 */}
                <div className="flex items-start gap-3 p-3">
                  {/* ステータスドット */}
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: TASK_STATUS_STYLES[task.status].color }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{task.name}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <DueBadge dueDate={task.dueDate} />
                        <button onClick={() => setEditingTask(isEditing ? null : task)}
                          className="p-1 rounded hover:opacity-70">
                          <FileText size={13} style={{ color: "var(--text-muted)" }} />
                        </button>
                        <button onClick={() => onDeleteTask(task.id)} className="p-1 rounded hover:opacity-70">
                          <Trash2 size={13} style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {LOAN_DATE_LABELS[task.baseDateKey]}
                        {task.offsetDays < 0 ? `の${Math.abs(task.offsetDays)}日前` : `の${task.offsetDays}日後`}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>期限: {fmtDate(task.dueDate)}</span>
                      )}
                      {task.assignee && (
                        <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                          <User size={10} />{task.assignee}
                        </span>
                      )}
                    </div>
                    {task.requiredDocuments.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {task.requiredDocuments.map((doc, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                            {doc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ステータス変更 */}
                  <select value={task.status}
                    onChange={e => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                    className="text-xs px-2 py-1 rounded-lg outline-none shrink-0"
                    style={{ background: TASK_STATUS_STYLES[task.status].bg, color: TASK_STATUS_STYLES[task.status].color, border: "none" }}>
                    {(Object.entries(TASK_STATUS_LABELS) as [TaskStatus, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* 編集パネル */}
                {isEditing && (
                  <div className="border-t p-3 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>担当者</label>
                        <input value={editingTask.assignee ?? ""}
                          onChange={e => setEditingTask(p => p ? { ...p, assignee: e.target.value } : p)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>銀行提出先</label>
                        <input value={editingTask.bankSubmitTo ?? ""}
                          onChange={e => setEditingTask(p => p ? { ...p, bankSubmitTo: e.target.value } : p)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>銀行担当者</label>
                        <input value={editingTask.bankContact ?? ""}
                          onChange={e => setEditingTask(p => p ? { ...p, bankContact: e.target.value } : p)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>期限日（手動設定）</label>
                        <input type="date" value={editingTask.dueDate ?? ""}
                          onChange={e => setEditingTask(p => p ? { ...p, dueDate: e.target.value } : p)}
                          className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>メモ</label>
                        <textarea value={editingTask.notes ?? ""}
                          onChange={e => setEditingTask(p => p ? { ...p, notes: e.target.value } : p)}
                          rows={2} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none resize-none" style={inputStyle} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingTask(null)}
                        className="px-3 py-1.5 rounded-lg text-xs" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                        キャンセル
                      </button>
                      <button onClick={() => { onUpdateTask(task.id, editingTask); setEditingTask(null); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: "#2563EB", color: "#fff" }}>
                        <Save size={11} />保存
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 日程入力セクション ───────────────────────────────────────────────────────

function DateInputSection({
  schedule, onSave,
}: {
  schedule: LoanSchedule;
  onSave: (dates: Partial<Record<LoanDateKey, string>>, payments: LoanSchedule["payments"]) => void;
}) {
  const [dates,    setDates]    = useState<Partial<Record<LoanDateKey, string>>>(schedule.dates);
  const [payments, setPayments] = useState(schedule.payments);
  const [open,     setOpen]     = useState(false);

  const inputStyle = { background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="border-b" style={{ borderColor: "var(--border)" }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
        style={{ color: "var(--text-primary)" }}>
        <span className="flex items-center gap-2">
          <CalendarDays size={15} style={{ color: "#3B82F6" }} />
          日程・支払設定
        </span>
        <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {DATE_KEYS_ORDERED.map(key => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  {LOAN_DATE_LABELS[key]}
                </label>
                <input type="date" value={dates[key] ?? ""}
                  onChange={e => setDates(p => ({ ...p, [key]: e.target.value || undefined }))}
                  className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "var(--text-secondary)" }}>支払い設定</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["landSettlement",    "土地決済（万円）"],
                ["constructionFee",  "着工金（万円）"],
                ["interimFee",       "中間金（万円）"],
                ["finalFee",         "最終金（万円）"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}</label>
                  <input type="number" value={payments[key] ?? ""}
                    onChange={e => setPayments(p => ({ ...p, [key]: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                </div>
              ))}
              <div className="col-span-2 flex gap-4">
                {([
                  ["bridgeLoan",     "つなぎ融資あり"],
                  ["splitExecution", "分割実行あり"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={payments[key] ?? false}
                      onChange={e => setPayments(p => ({ ...p, [key]: e.target.checked }))}
                      className="rounded" />
                    <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => { onSave(dates, payments); setOpen(false); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#2563EB", color: "#fff" }}>
              <Save size={13} />保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function LoanSchedulePage() {
  const { customers } = useCustomers();
  const { banks }     = useBanks();
  const {
    schedules, getByCustomer, upsert, applyTemplate,
    updateTaskStatus, updateTask, addTask, deleteTask, getAlerts,
  } = useLoanSchedules();
  const { templates, loaded: templatesLoaded } = useLoanScheduleTemplates();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [tab,    setTab]    = useState<"timeline" | "gantt" | "calendar" | "tasks">("gantt");
  const [search, setSearch] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // テンプレートが読み込まれたら初期選択
  const firstTemplateId = templates[0]?.id ?? "";
  const effectiveTemplateId = selectedTemplateId || firstTemplateId;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) ?? null;
  const schedule = selectedCustomerId ? getByCustomer(selectedCustomerId) : null;
  const alerts   = useMemo(() => getAlerts(), [schedules]);

  // 現在のスケジュールに紐づく銀行のテンプレートを優先表示
  const availableTemplates = useMemo(() => {
    if (!schedule?.bankId) return templates;
    const bankTmpls = templates.filter(t => t.bankId === schedule.bankId);
    const globalTmpls = templates.filter(t => !t.bankId);
    return bankTmpls.length > 0 ? [...bankTmpls, ...globalTmpls] : globalTmpls;
  }, [templates, schedule?.bankId]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.area.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveDates = (
    dates: Partial<Record<LoanDateKey, string>>,
    payments: LoanSchedule["payments"],
  ) => {
    if (!selectedCustomerId) return;
    upsert(selectedCustomerId, {
      customerId: selectedCustomerId,
      dates,
      payments,
      tasks: schedule?.tasks ?? [],
      bankId:   schedule?.bankId,
      bankName: schedule?.bankName,
    });
  };

  const handleApplyTemplate = () => {
    if (!selectedCustomerId || !schedule) return;
    const tmpl = templates.find(t => t.id === effectiveTemplateId);
    if (!tmpl) return;
    applyTemplate(selectedCustomerId, tmpl.tasks, schedule.dates, schedule.bankId, schedule.bankName);
    setShowTemplateModal(false);
  };

  const handleCreateSchedule = () => {
    if (!selectedCustomerId) return;
    upsert(selectedCustomerId, {
      customerId: selectedCustomerId,
      dates: {}, payments: {}, tasks: [],
    });
  };

  const scheduleId = schedule?.id ?? "";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-primary)" }}>

      {/* ─── 左パネル: 顧客リスト ─── */}
      <div className="w-72 shrink-0 flex flex-col border-r" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h1 className="font-bold text-base mb-3" style={{ color: "var(--text-primary)" }}>
            ローンスケジュール
          </h1>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="顧客名・エリアで検索"
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
        </div>

        {/* アラートサマリー */}
        {alerts.length > 0 && (
          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex flex-wrap gap-1">
              {[
                { label: "期限切れ", count: alerts.filter(a => a.daysUntil < 0).length,  color: "#EF4444" },
                { label: "本日",    count: alerts.filter(a => a.daysUntil === 0).length, color: "#F97316" },
                { label: "7日内",   count: alerts.filter(a => a.daysUntil > 0 && a.daysUntil <= 7).length, color: "#EAB308" },
              ].filter(x => x.count > 0).map(x => (
                <span key={x.label} className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: x.color + "22", color: x.color }}>
                  {x.label} {x.count}件
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 顧客一覧 */}
        <div className="flex-1 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              顧客が見つかりません
            </div>
          ) : (
            filteredCustomers.map(c => {
              const cs = getByCustomer(c.id);
              const customerAlerts = alerts.filter(a => a.customerId === c.id);
              const urgentCount = customerAlerts.filter(a => a.daysUntil <= 7).length;
              const isSelected  = selectedCustomerId === c.id;

              return (
                <button key={c.id} onClick={() => { setSelectedCustomerId(c.id); setTab("timeline"); }}
                  className="w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors"
                  style={{
                    background: isSelected ? "#EFF6FF" : "transparent",
                    borderLeft: isSelected ? "3px solid #2563EB" : "3px solid transparent",
                  }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{ background: "#E0E7FF", color: "#4338CA" }}>
                    {c.name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {c.name}
                      </span>
                      {urgentCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-bold shrink-0"
                          style={{ background: "#FEE2E2", color: "#DC2626" }}>
                          !{urgentCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {cs ? `${cs.tasks.filter(t => t.status !== "done").length}件の未完了タスク` : "スケジュール未作成"}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── 右パネル: スケジュール詳細 ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedCustomer ? (
          /* 顧客未選択時 */
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <CalendarDays size={48} className="mb-4 opacity-20" style={{ color: "var(--text-muted)" }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              顧客を選択してください
            </h2>
            <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
              左のリストから顧客を選ぶと<br />ローンスケジュールを管理できます
            </p>

            {/* 全体アラートリスト */}
            {alerts.length > 0 && (
              <div className="w-full max-w-md">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  ⚠ 期限が近いタスク
                </h3>
                <div className="space-y-2">
                  {alerts.slice(0, 10).map((a, i) => {
                    const c = customers.find(x => x.id === a.customerId);
                    const col = daysUntilColor(a.daysUntil);
                    return (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                        style={{ background: col.bg, border: `1px solid ${col.text}33` }}>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col.text }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{a.task.name}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c?.name ?? "—"}</p>
                        </div>
                        <span className="text-xs font-semibold shrink-0" style={{ color: col.text }}>{col.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 顧客選択済み */
          <>
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: "#E0E7FF", color: "#4338CA" }}>
                  {selectedCustomer.name.slice(0, 1)}
                </div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {selectedCustomer.area} · {selectedCustomer.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {schedule && (
                  <button onClick={() => setShowTemplateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                    style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #DCFCE7" }}>
                    <Zap size={12} />テンプレートから生成
                  </button>
                )}
                <button onClick={() => setSelectedCustomerId(null)}
                  className="p-2 rounded-lg hover:opacity-70">
                  <X size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>
            </div>

            {!schedule ? (
              /* スケジュール未作成 */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CalendarDays size={40} className="mx-auto mb-4 opacity-30" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                    {selectedCustomer.name} のスケジュールはまだ作成されていません
                  </p>
                  <button onClick={handleCreateSchedule}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold mx-auto"
                    style={{ background: "#2563EB", color: "#fff" }}>
                    <Plus size={15} />スケジュールを作成
                  </button>
                </div>
              </div>
            ) : (
              /* スケジュール詳細 */
              <div className="flex-1 overflow-y-auto">
                {/* 日程入力 */}
                <DateInputSection schedule={schedule} onSave={handleSaveDates} />

                {/* タブ */}
                <div className="flex border-b px-4 pt-2" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
                  {([
                    { id: "timeline" as const, icon: GitBranch,    label: "タイムライン" },
                    { id: "gantt"    as const, icon: BarChart2,    label: "ガントチャート" },
                    { id: "calendar" as const, icon: CalendarDays, label: "カレンダー" },
                    { id: "tasks"    as const, icon: ListChecks,   label: `タスク一覧（${schedule.tasks.length}）` },
                  ]).map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setTab(id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 mr-1 transition-colors"
                      style={tab === id
                        ? { borderColor: "#2563EB", color: "#2563EB" }
                        : { borderColor: "transparent", color: "var(--text-muted)" }}>
                      <Icon size={13} />{label}
                    </button>
                  ))}
                </div>

                {/* タブコンテンツ */}
                {tab === "timeline" && <TimelineView schedule={schedule} />}
                {tab === "gantt"    && <GanttView    schedule={schedule} />}
                {tab === "calendar" && <CalendarView schedule={schedule} />}
                {tab === "tasks"    && (
                  <TaskListView
                    schedule={schedule}
                    onUpdateStatus={(taskId, status) => updateTaskStatus(scheduleId, taskId, status)}
                    onUpdateTask={(taskId, data) => updateTask(scheduleId, taskId, data)}
                    onAddTask={task => addTask(scheduleId, task)}
                    onDeleteTask={taskId => deleteTask(scheduleId, taskId)}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── テンプレートモーダル ─── */}
      {showTemplateModal && schedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                テンプレートからタスク生成
              </h3>
              <button onClick={() => setShowTemplateModal(false)}>
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              テンプレートを選んで自動でタスクを生成します。<br />
              既存のタスクはすべて上書きされます。
            </p>

            {availableTemplates.length === 0 ? (
              <div className="text-center py-6 mb-4" style={{ color: "var(--text-muted)" }}>
                <p className="text-sm">テンプレートがありません</p>
                <a href="/banks" className="text-xs underline mt-1 block" style={{ color: "#2563EB" }}>
                  銀行マスタでテンプレートを作成する
                </a>
              </div>
            ) : (
              <div className="space-y-2 mb-5">
                {availableTemplates.map(tmpl => (
                  <label key={tmpl.id}
                    className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                    style={{
                      background: effectiveTemplateId === tmpl.id ? "#EFF6FF" : "var(--bg-secondary)",
                      border: `1px solid ${effectiveTemplateId === tmpl.id ? "#BFDBFE" : "var(--border)"}`,
                    }}>
                    <input type="radio" name="template" value={tmpl.id}
                      checked={effectiveTemplateId === tmpl.id}
                      onChange={() => setSelectedTemplateId(tmpl.id)}
                      className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{tmpl.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {tmpl.bankId ? "銀行専用" : "共通"} · {tmpl.tasks.length}件のタスクを生成
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                キャンセル
              </button>
              <button onClick={handleApplyTemplate}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "#2563EB", color: "#fff" }}>
                <Zap size={14} />生成する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
