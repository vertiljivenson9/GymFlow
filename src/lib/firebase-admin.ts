// Firebase Admin SDK - Node.js runtime
import admin from 'firebase-admin'

let adminApp: admin.app.App | null = null
let adminDb: admin.firestore.Firestore | null = null
let adminAuth: admin.auth.Auth | null = null

function initializeFirebase() {
  if (adminApp) return

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

  if (!privateKey || !clientEmail) {
    console.log('Firebase Admin: No credentials - running in demo mode')
    return
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
    console.warn('Firebase Admin: Failed -', error)
  }
}

// Initialize on first use
initializeFirebase()

export const db = adminDb
export const auth = adminAuth

export async function getDb() {
  if (!adminDb) initializeFirebase()
  return adminDb
}
