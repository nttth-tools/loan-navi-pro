import type { ScreeningRecord } from '@/types';

const KEY = 'loan_navi_screening';
const PENDING_KEY = 'loan_navi_screening_pending';

export function loadScreenings(): ScreeningRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScreeningRecord[];
  } catch {
    return [];
  }
}

export function saveScreenings(records: ScreeningRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function addScreening(record: Omit<ScreeningRecord, 'id' | 'createdAt'>): ScreeningRecord {
  const full: ScreeningRecord = {
    ...record,
    id: `scr_${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const existing = loadScreenings();
  saveScreenings([full, ...existing]);
  return full;
}

// For diagnosis → screening pre-fill flow
export function setPendingScreening(data: Partial<ScreeningRecord>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PENDING_KEY, JSON.stringify(data));
}

export function popPendingScreening(): Partial<ScreeningRecord> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw) as Partial<ScreeningRecord>;
  } catch {
    return null;
  }
}
