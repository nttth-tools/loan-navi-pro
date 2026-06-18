"use client";

import { useLocalStorageCollection } from "@/hooks/useLocalStorageCollection";
import { BANKS } from "@/lib/banks";
import type { BankMaster } from "@/types";

export function useBanks() {
  const { items: banks, loaded, add, update, remove } =
    useLocalStorageCollection<BankMaster>("loan_navi_banks_v4", BANKS);

  const addBank    = (bank: BankMaster)                => add({ ...bank } as Omit<BankMaster, "id">);
  const updateBank = (id: string, data: BankMaster)    => update(id, data);
  const deleteBank = (id: string)                      => remove(id);

  return { banks, loaded, addBank, updateBank, deleteBank };
}
