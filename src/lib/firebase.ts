import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyB4KCTV87pUqee_HeH1VBZ1buasDRI4n4o",
  authDomain: "book-a-session-d2938.firebaseapp.com",
  projectId: "book-a-session-d2938",
  storageBucket: "book-a-session-d2938.firebasestorage.app",
  messagingSenderId: "562685317198",
  appId: "1:562685317198:web:f50340193373bbbc15731f",
  measurementId: "G-GM2Q31PEBS",
  databaseURL: "https://book-a-session-d2938-default-rtdb.firebaseio.com"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const rtdb = getDatabase(app)
export const auth = getAuth(app)
export default app
