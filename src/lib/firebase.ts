import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'

// Firebase web configuration supplied by the VIBRA project owner.
// These web-app identifiers are public client configuration, not admin credentials.
const firebaseConfig = {
  apiKey: 'AIzaSyBAsF_SALFEiraimj1Qg10AiOI8gpixheU',
  authDomain: 'vibra-44dce.firebaseapp.com',
  projectId: 'vibra-44dce',
  storageBucket: 'vibra-44dce.firebasestorage.app',
  messagingSenderId: '424385936523',
  appId: '1:424385936523:web:54c1b5fff7381519e8288e',
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

// Call these from browser-side code only (not during server rendering).
export const getVibraAuth = () => getAuth(firebaseApp)
export const vibraGoogleProvider = new GoogleAuthProvider()
export const getVibraDb = () => getFirestore(firebaseApp)
export const getVibraStorage = () => getStorage(firebaseApp)


// Firebase AI Logic uses the project's configured Gemini Developer API backend.
// Enable Firebase AI Logic for project vibra-44dce in the Firebase Console before use.
export const getVibraAIModel = () => {
  const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() })
  return getGenerativeModel(ai, {
    model: 'gemini-4-hydrogen',
    systemInstruction: 'You are VIBRA AI, a helpful multilingual assistant for VIBRA WORLDWIDE. Answer accurately and naturally in the language the user uses. Support Swahili and other world languages. If unsure, say so clearly. Never pretend to have performed actions you have not performed.',
  })
}
