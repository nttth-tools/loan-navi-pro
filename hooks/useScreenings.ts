"use client";

import { useLocalStorageCollection } from "@/hooks/useLocalStorageCollection";
import type { ScreeningRecord } from "@/types";

export function useScreenings() {
  const { items: screenings, loaded, add, update, remove } =
    useLocalStorageCollection<ScreeningRecord>("loan_navi_screening");

  const addScreening = (data: Omit<ScreeningRecord, "id" | "createdAt">) =>
    add({ ...data, createdAt: new Date().toISOString().slice(0, 10) } as Omit<ScreeningRecord, "id">);

  const updateScreening = (id: string, data: Partial<Omit<ScreeningRecord, "id">>) =>
    update(id, data as Omit<ScreeningRecord, "id">);

  const deleteScreening = (id: string) => remove(id);

  return { screenings, loaded, addScreening, updateScreening, deleteScreening };
}

// Standalone function for adding a screening from non-hook contexts (e.g. diagnosis page)
export function addScreeningRecord(data: Omit<ScreeningRecord, "id" | "createdAt">): ScreeningRecord {
  const record: ScreeningRecord = {
    ...data,
    id: `scr_${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  try {
    const raw = localStorage.getItem("loan_navi_screening");
    const list: ScreeningRecord[] = raw ? JSON.parse(raw) : [];
    list.push(record);
    localStorage.setItem("loan_navi_screening", JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
  return record;
}
