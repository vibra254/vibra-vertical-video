import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

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
