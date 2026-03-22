// Firebase Admin for Edge Runtime with nodejs_compat
// Lazy initialization with fallback to demo mode

let _db: any = null
let _auth: any = null
let _initialized = false

export async function getDb() {
  if (_initialized) return _db
  await initFirebase()
  return _db
}

export async function getAuth() {
  if (_initialized) return _auth
  await initFirebase()
  return _auth
}

async function initFirebase() {
  if (_initialized) return
  _initialized = true

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

  if (!privateKey || !clientEmail) {
    console.log('Firebase Admin: No credentials - demo mode')
    return
  }

  try {
    const admin = await import('firebase-admin')

    const app = admin.default.apps.length === 0
      ? admin.default.initializeApp({
          credential: admin.default.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'book-a-session-d2938',
            clientEmail: clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        })
      : admin.default.app()

    _db = app.firestore()
    _auth = app.auth()
    console.log('Firebase Admin: OK')
  } catch (error: any) {
    console.warn('Firebase Admin: Failed -', error?.message)
  }
}

// Legacy exports for backward compatibility (null until initialized)
export const db: any = null
export const auth: any = null
