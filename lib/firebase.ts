import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let _app:  FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db:   Firestore | undefined;

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    const firebaseConfig = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // 一時デバッグ: 環境変数が読み込まれているか確認
    if (typeof window !== "undefined") {
      console.log("[firebase.ts] firebaseConfig =", {
        apiKey:            firebaseConfig.apiKey      ? firebaseConfig.apiKey.slice(0, 8) + "..." : "❌ MISSING",
        authDomain:        firebaseConfig.authDomain  || "❌ MISSING",
        projectId:         firebaseConfig.projectId   || "❌ MISSING",
        storageBucket:     firebaseConfig.storageBucket    || "❌ MISSING",
        messagingSenderId: firebaseConfig.messagingSenderId || "❌ MISSING",
        appId:             firebaseConfig.appId        ? firebaseConfig.appId.slice(0, 10) + "..." : "❌ MISSING",
      });
    }

    if (!firebaseConfig.apiKey) {
      throw new Error(
        "[Loan Navi Pro] Firebase APIキーが未設定です。\n" +
        ".env.local に NEXT_PUBLIC_FIREBASE_API_KEY を設定してください。\n" +
        "設定後は npm run dev を再起動してください。"
      );
    }

    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getFirebaseApp());
  return _db;
}
