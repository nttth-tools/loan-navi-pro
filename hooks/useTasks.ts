"use client";

import { useLocalStorageCollection } from "@/hooks/useLocalStorageCollection";

export interface Task {
  id:       string;
  text:     string;
  tag:      string;
  tagColor: string;
  tagBg:    string;
  date:     string;
  done:     boolean;
}

export function useTasks() {
  const { items: tasks, loaded, add, update, remove } =
    useLocalStorageCollection<Task>("loan_navi_tasks");

  const addTask    = (data: Omit<Task, "id">) => add(data);
  const toggleTask = (id: string, done: boolean) => update(id, { done });
  const deleteTask = (id: string) => remove(id);

  return { tasks, loaded, addTask, toggleTask, deleteTask };
}
