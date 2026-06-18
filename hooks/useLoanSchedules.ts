"use client";

import { useLocalStorageCollection } from "@/hooks/useLocalStorageCollection";
import type { LoanSchedule, LoanTask, LoanDateKey, TemplateTask } from "@/types";

export function useLoanSchedules() {
  const { items: schedules, loaded, add, update, remove } =
    useLocalStorageCollection<LoanSchedule>("loan_navi_loan_schedules");

  // 顧客IDで取得
  const getByCustomer = (customerId: string) =>
    schedules.find(s => s.customerId === customerId) ?? null;

  // スケジュール作成または更新
  const upsert = (customerId: string, data: Omit<LoanSchedule, "id" | "createdAt" | "updatedAt">) => {
    const existing = getByCustomer(customerId);
    const now = new Date().toISOString().slice(0, 10);
    if (existing) {
      update(existing.id, { ...data, updatedAt: now });
    } else {
      add({ ...data, customerId, createdAt: now, updatedAt: now });
    }
  };

  // タスクの due date を自動計算
  const calcDueDate = (schedule: LoanSchedule, task: LoanTask): string | undefined => {
    const base = schedule.dates[task.baseDateKey];
    if (!base) return undefined;
    const d = new Date(base);
    d.setDate(d.getDate() + task.offsetDays);
    return d.toISOString().slice(0, 10);
  };

  // タスクの due dates を一括再計算
  const recalcDueDates = (schedule: LoanSchedule): LoanSchedule => ({
    ...schedule,
    tasks: schedule.tasks.map(t => ({
      ...t,
      dueDate: calcDueDate(schedule, t) ?? t.dueDate,
    })),
  });

  // テンプレートからタスクを自動生成
  const applyTemplate = (
    customerId: string,
    templateTasks: TemplateTask[],
    dates: Partial<Record<LoanDateKey, string>>,
    bankId?: string,
    bankName?: string,
  ) => {
    const existing = getByCustomer(customerId);
    const now = new Date().toISOString().slice(0, 10);

    const newTasks: LoanTask[] = templateTasks.map(t => {
      const base = dates[t.baseDateKey];
      let dueDate: string | undefined;
      if (base) {
        const d = new Date(base);
        d.setDate(d.getDate() + t.offsetDays);
        dueDate = d.toISOString().slice(0, 10);
      }
      return {
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: t.name,
        baseDateKey: t.baseDateKey,
        offsetDays: t.offsetDays,
        dueDate,
        status: "pending" as const,
        requiredDocuments: t.requiredDocuments ?? [],
        notes: t.notes,
        assignee: "",
      };
    });

    if (existing) {
      update(existing.id, {
        dates: { ...existing.dates, ...dates },
        tasks: newTasks,
        bankId,
        bankName,
        payments: existing.payments,
        updatedAt: now,
      });
    } else {
      add({
        customerId,
        bankId,
        bankName,
        dates,
        payments: {},
        tasks: newTasks,
        createdAt: now,
        updatedAt: now,
      });
    }
  };

  // タスクのステータス更新
  const updateTaskStatus = (scheduleId: string, taskId: string, status: LoanTask["status"]) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    update(scheduleId, {
      tasks: schedule.tasks.map(t => t.id === taskId ? { ...t, status } : t),
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };

  // タスクの更新
  const updateTask = (scheduleId: string, taskId: string, data: Partial<LoanTask>) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    update(scheduleId, {
      tasks: schedule.tasks.map(t => t.id === taskId ? { ...t, ...data } : t),
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };

  // タスク追加
  const addTask = (scheduleId: string, task: Omit<LoanTask, "id">) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    const newTask: LoanTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    update(scheduleId, {
      tasks: [...schedule.tasks, newTask],
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };

  // タスク削除
  const deleteTask = (scheduleId: string, taskId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    update(scheduleId, {
      tasks: schedule.tasks.filter(t => t.id !== taskId),
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };

  // アラート取得（全スケジュール横断）
  const getAlerts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alerts: Array<{
      scheduleId: string;
      customerId: string;
      task: LoanTask;
      daysUntil: number;
    }> = [];

    for (const schedule of schedules) {
      for (const task of schedule.tasks) {
        if (task.status === "done") continue;
        if (!task.dueDate) continue;
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        const diff = Math.floor((due.getTime() - today.getTime()) / 86_400_000);
        if (diff <= 30) {
          alerts.push({ scheduleId: schedule.id, customerId: schedule.customerId, task, daysUntil: diff });
        }
      }
    }

    return alerts.sort((a, b) => a.daysUntil - b.daysUntil);
  };

  return {
    schedules, loaded,
    getByCustomer, upsert, applyTemplate,
    updateTaskStatus, updateTask, addTask, deleteTask,
    remove, recalcDueDates, getAlerts,
  };
}
