import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { getVibraDb, getVibraStorage } from '@/lib/firebase'

export function safeAvatarUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

/** Read the profile photo belonging to the authenticated Firebase UID. */
export async function readCreatorAvatar(userId: string): Promise<string | null> {
  if (!userId) return null
  const snapshot = await getDoc(doc(getVibraDb(), 'users', userId))
  if (!snapshot.exists()) return null
  return safeAvatarUrl(snapshot.data().photoURL ?? snapshot.data().avatar)
}

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024

/** Upload an avatar under the owner's Firebase Storage path and persist its URL. */
export async function saveCreatorAvatar(userId: string, file: File): Promise<string> {
  if (!userId) throw new Error('Ingia kwenye akaunti yako kwanza ili kuhifadhi picha mtandaoni.')
  if (!file.type.startsWith('image/')) throw new Error('Chagua faili ya picha.')
  if (file.size > AVATAR_MAX_BYTES) throw new Error('Picha ni kubwa mno. Chagua picha chini ya 5MB.')
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `profiles/${userId}/avatar-${Date.now()}.${extension}`
  const objectRef = storageRef(getVibraStorage(), path)
  await uploadBytes(objectRef, file, { contentType: file.type })
  const url = safeAvatarUrl(await getDownloadURL(objectRef))
  if (!url) throw new Error('Imeshindwa kupata anwani ya picha.')
  await setDoc(doc(getVibraDb(), 'users', userId), { photoURL: url, avatar: url }, { merge: true })
  return url
}

/** Read a local image file as a data URL so it can be previewed on this device. */
export function readLocalPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Chagua faili ya picha.')); return }
    if (file.size > AVATAR_MAX_BYTES) { reject(new Error('Picha ni kubwa mno. Chagua picha chini ya 5MB.')); return }
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Imeshindwa kusoma picha.'))
    reader.readAsDataURL(file)
  })
}
