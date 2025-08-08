"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

interface UseSessionReturn {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const getSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (cancelled) return

        if (error) {
          setError(error.message)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    getSession()

    // Suscribirse a cambios de auth
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return

        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)
      }
    )

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  return { user, session, loading, error }
}
