"use client";

import { useLocalStorageCollection } from "@/hooks/useLocalStorageCollection";
import type { Customer } from "@/types";

export function useCustomers() {
  const { items: customers, loaded, add, update, remove } =
    useLocalStorageCollection<Customer>("loan_navi_customers");

  const addCustomer = (data: Omit<Customer, "id">) =>
    add({ ...data, createdAt: data.createdAt ?? new Date().toISOString().slice(0, 10) });

  const updateCustomer = (id: string, data: Omit<Customer, "id">) => update(id, data);

  const deleteCustomer = (id: string) => remove(id);

  return { customers, loaded, addCustomer, updateCustomer, deleteCustomer };
}
