const firebaseConfig = {
  apiKey: "AIzaSyBAsF_SALFEiraimj1Qg10AiOI8gpixheU",
  authDomain: "vibra-44dce.firebaseapp.com",
  projectId: "vibra-44dce",
  storageBucket: "vibra-44dce.firebasestorage.app",
  messagingSenderId: "424385936523",
  appId: "1:424385936523:web:54c1b5fff7381519e8288e",
}

declare global {
  interface Window {
    firebase?: any
  }
}

let firebasePromise: Promise<any> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing?.dataset.loaded === "true") return resolve()
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Firebase SDK failed to load.")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => { script.dataset.loaded = "true"; resolve() }
    script.onerror = () => reject(new Error("Firebase SDK failed to load. Check your internet connection."))
    document.head.appendChild(script)
  })
}

export function getFirebaseServices(): Promise<{ firebase: any; auth: any; db: any; storage: any }> {
  if (typeof window === "undefined") return Promise.reject(new Error("Firebase is available in the browser only."))
  if (!firebasePromise) {
    firebasePromise = (async () => {
      const base = "https://www.gstatic.com/firebasejs/9.22.0"
      await loadScript(`${base}/firebase-app-compat.js`)
      await loadScript(`${base}/firebase-auth-compat.js`)
      await loadScript(`${base}/firebase-firestore-compat.js`)
      await loadScript(`${base}/firebase-storage-compat.js`)
      const firebase = window.firebase
      if (!firebase) throw new Error("Firebase SDK did not initialize.")
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig)
      return { firebase, auth: firebase.auth(), db: firebase.firestore(), storage: firebase.storage() }
    })().catch(error => {
      firebasePromise = null
      throw error
    })
  }
  return firebasePromise
}
