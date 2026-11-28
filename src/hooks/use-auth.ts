import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { getVibraAuth } from '@/lib/firebase'

type VibraUser = User & { id: string }

export function useAuth() {
  const [user, setUser] = useState<VibraUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(getVibraAuth(), current => {
    setUser(current ? Object.assign(current, { id: current.uid }) : null)
    setLoading(false)
  }), [])

  return { session: user ? { user } : null, user, loading }
}
