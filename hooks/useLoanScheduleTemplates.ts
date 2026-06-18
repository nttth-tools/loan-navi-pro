"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_TEMPLATES } from "@/lib/loanScheduleTemplates";
import type { LoanScheduleTemplate, TemplateTask, LoanDateKey } from "@/types";

const LS_KEY = "loan_navi_schedule_templates";

function genId(prefix = "t") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function loadFromStorage(): LoanScheduleTemplate[] {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LoanScheduleTemplate[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // 初回のみ DEFAULT_TEMPLATES を localStorage に書き込む
  localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_TEMPLATES));
  return DEFAULT_TEMPLATES;
}

function saveToStorage(templates: LoanScheduleTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(templates));
}

export function useLoanScheduleTemplates() {
  const [templates, setTemplates] = useState<LoanScheduleTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTemplates(loadFromStorage());
    setLoaded(true);
  }, []);

  const persist = useCallback((next: LoanScheduleTemplate[]) => {
    setTemplates(next);
    saveToStorage(next);
  }, []);

  // ─── テンプレート CRUD ───────────────────────────────────────────────────

  const addTemplate = useCallback((data: Omit<LoanScheduleTemplate, "id">): LoanScheduleTemplate => {
    const tmpl: LoanScheduleTemplate = { ...data, id: genId("tmpl") };
    setTemplates(prev => {
      const next = [...prev, tmpl];
      saveToStorage(next);
      return next;
    });
    return tmpl;
  }, []);

  const updateTemplate = useCallback((id: string, data: Partial<Omit<LoanScheduleTemplate, "id">>) => {
    setTemplates(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...data } : t);
      saveToStorage(next);
      return next;
    });
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => {
      const next = prev.filter(t => t.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  // ─── タスク CRUD ─────────────────────────────────────────────────────────

  const addTask = useCallback((templateId: string, data: Omit<TemplateTask, "id">): TemplateTask => {
    const task: TemplateTask = { ...data, id: genId("task") };
    setTemplates(prev => {
      const next = prev.map(t =>
        t.id === templateId ? { ...t, tasks: [...t.tasks, task] } : t
      );
      saveToStorage(next);
      return next;
    });
    return task;
  }, []);

  const updateTask = useCallback((templateId: string, taskId: string, data: Partial<Omit<TemplateTask, "id">>) => {
    setTemplates(prev => {
      const next = prev.map(t =>
        t.id === templateId
          ? { ...t, tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, ...data } : tk) }
          : t
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((templateId: string, taskId: string) => {
    setTemplates(prev => {
      const next = prev.map(t =>
        t.id === templateId
          ? { ...t, tasks: t.tasks.filter(tk => tk.id !== taskId) }
          : t
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const reorderTasks = useCallback((templateId: string, tasks: TemplateTask[]) => {
    setTemplates(prev => {
      const next = prev.map(t => t.id === templateId ? { ...t, tasks } : t);
      saveToStorage(next);
      return next;
    });
  }, []);

  // 銀行IDでフィルタ（bankId が一致するもの、または全体テンプレート）
  const getByBank = useCallback((bankId: string) =>
    templates.filter(t => !t.bankId || t.bankId === bankId),
  [templates]);

  const getByBankOnly = useCallback((bankId: string) =>
    templates.filter(t => t.bankId === bankId),
  [templates]);

  return {
    templates, loaded,
    addTemplate, updateTemplate, deleteTemplate,
    addTask, updateTask, deleteTask, reorderTasks,
    getByBank, getByBankOnly,
  };
}
