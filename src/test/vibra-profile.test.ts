import { beforeEach, expect, it, vi } from 'vitest'
import { readCreatorAvatar, safeAvatarUrl } from '@/lib/vibra-profile'

const db = vi.hoisted(() => ({ doc: vi.fn(), getDoc: vi.fn(), getVibraDb: vi.fn() }))
vi.mock('firebase/firestore', () => ({ doc: db.doc, getDoc: db.getDoc }))
vi.mock('@/lib/firebase', () => ({ getVibraDb: db.getVibraDb }))

beforeEach(() => {
  vi.clearAllMocks()
  db.getVibraDb.mockReturnValue('firebase-db')
  db.doc.mockReturnValue('user-document')
})

it('reads the avatar only from the requested Firebase user document', async () => {
  db.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ photoURL: 'https://example.com/logo.png' }) })
  expect(await readCreatorAvatar('current-user-id')).toBe('https://example.com/logo.png')
  expect(db.doc).toHaveBeenCalledWith('firebase-db', 'users', 'current-user-id')
})

it('does not query Firebase without an authenticated ID', async () => {
  expect(await readCreatorAvatar('')).toBeNull()
  expect(db.getDoc).not.toHaveBeenCalled()
})

it('rejects unsafe avatar URLs', () => {
  expect(safeAvatarUrl('javascript:alert(1)')).toBeNull()
  expect(safeAvatarUrl('https://user:password@example.com/logo')).toBeNull()
})

it('returns no avatar for a missing profile', async () => {
  db.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) })
  expect(await readCreatorAvatar('current-user-id')).toBeNull()
})
