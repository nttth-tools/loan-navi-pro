"use client";

import { useLocalStorageCollection } from "@/hooks/useLocalStorageCollection";
import { AREA_MASTER_DEFAULTS } from "@/lib/areaMasterStorage";
import type { AreaMasterEntry } from "@/types";

export function useAreaMaster() {
  const { items: entries, loaded, add, update, remove } =
    useLocalStorageCollection<AreaMasterEntry>("loan_navi_area_master_v1", AREA_MASTER_DEFAULTS);

  const addEntry    = (data: Omit<AreaMasterEntry, "id">) => add(data);
  const updateEntry = (id: string, data: Omit<AreaMasterEntry, "id">) => update(id, data);
  const deleteEntry = (id: string) => remove(id);

  return { entries, loaded, addEntry, updateEntry, deleteEntry };
}
