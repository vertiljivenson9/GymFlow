import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB4KCTV87pUqee_HeH1VBZ1buasDRI4n4o",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "book-a-session-d2938.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "book-a-session-d2938",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "book-a-session-d2938.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "562685317198",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:562685317198:web:f50340193373bbbc15731f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GM2Q31PEBS",
  databaseURL: "https://book-a-session-d2938-default-rtdb.firebaseio.com"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const rtdb = getDatabase(app)
export const auth = getAuth(app)
export default app
