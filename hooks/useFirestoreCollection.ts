"use client";

import { useState, useEffect } from "react";
import {
  collection, onSnapshot, addDoc, doc,
  updateDoc, deleteDoc, setDoc, type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export function useFirestoreCollection<T extends { id: string }>(
  collectionPath: string | null,
) {
  const [items,  setItems]  = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!collectionPath) return;
    const db   = getFirebaseDb();
    const unsub = onSnapshot(collection(db, collectionPath), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
      setLoaded(true);
    }, () => setLoaded(true));
    return unsub;
  }, [collectionPath]);

  const add = (data: Omit<T, "id">) => {
    if (!collectionPath) return;
    addDoc(collection(getFirebaseDb(), collectionPath), data as DocumentData);
  };

  const update = (id: string, data: Partial<Omit<T, "id">>) => {
    if (!collectionPath) return;
    updateDoc(doc(getFirebaseDb(), collectionPath, id), data as DocumentData);
  };

  const remove = (id: string) => {
    if (!collectionPath) return;
    deleteDoc(doc(getFirebaseDb(), collectionPath, id));
  };

  const set = (id: string, data: Omit<T, "id">) => {
    if (!collectionPath) return;
    setDoc(doc(getFirebaseDb(), collectionPath, id), data as DocumentData);
  };

  return { items, loaded, add, update, remove, set };
}
