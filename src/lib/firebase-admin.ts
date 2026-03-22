// Firebase Admin SDK for Vercel (Node.js runtime)
import admin from 'firebase-admin'

let adminApp: admin.app.App | null = null
let adminDb: admin.firestore.Firestore | null = null
let adminAuth: admin.auth.Auth | null = null

function initializeFirebaseAdmin() {
  if (adminApp) return { db: adminDb, auth: adminAuth }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

  if (!privateKey || !clientEmail) {
    console.log('Firebase Admin: No credentials - running in demo mode')
    return { db: null, auth: null }
  }

  try {
    if (admin.apps.length === 0) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'book-a-session-d2938',
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      })
    } else {
      adminApp = admin.app()
    }

    adminDb = adminApp.firestore()
    adminAuth = adminApp.auth()
    console.log('Firebase Admin: Initialized successfully')
  } catch (error: any) {
    console.warn('Firebase Admin: Initialization failed -', error?.message)
    adminApp = null
    adminDb = null
    adminAuth = null
  }

  return { db: adminDb, auth: adminAuth }
}

// Initialize on module load
const { db: _db, auth: _auth } = initializeFirebaseAdmin()

export const db = _db
export const auth = _auth

// Async getter for lazy initialization
export async function getDb() {
  if (!adminDb) {
    initializeFirebaseAdmin()
  }
  return adminDb
}

export async function getAuth() {
  if (!adminAuth) {
    initializeFirebaseAdmin()
  }
  return adminAuth
}

export default adminApp
