import { BANKS } from './banks';
import type { BankMaster } from '@/types';

const KEY = 'loan_navi_banks_v4';

export function loadBanks(): BankMaster[] {
  if (typeof window === 'undefined') return BANKS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return BANKS;
    return JSON.parse(raw) as BankMaster[];
  } catch {
    return BANKS;
  }
}

export function saveBanks(banks: BankMaster[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(banks));
}
