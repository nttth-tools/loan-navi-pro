"use client";

import { useState, useEffect, useCallback } from 'react';
import { loadBanks, saveBanks } from '@/lib/bankStorage';
import type { BankMaster } from '@/types';

export function useBanks() {
  const [banks, setBanks] = useState<BankMaster[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBanks(loadBanks());
    setLoaded(true);
  }, []);

  const addBank = useCallback((bank: BankMaster) => {
    setBanks(prev => {
      const next = [...prev, bank];
      saveBanks(next);
      return next;
    });
  }, []);

  const updateBank = useCallback((id: string, data: BankMaster) => {
    setBanks(prev => {
      const next = prev.map(b => b.id === id ? data : b);
      saveBanks(next);
      return next;
    });
  }, []);

  const deleteBank = useCallback((id: string) => {
    setBanks(prev => {
      const next = prev.filter(b => b.id !== id);
      saveBanks(next);
      return next;
    });
  }, []);

  return { banks, loaded, addBank, updateBank, deleteBank };
}
