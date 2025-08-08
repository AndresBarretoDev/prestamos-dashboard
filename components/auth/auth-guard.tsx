"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      try {
        const supabase = createClient()
        
        // Obtener sesión actual
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (cancelled) return

        if (error) {
          console.error("Error getting session:", error)
          router.replace("/auth/login")
          return
        }

        // Si no hay sesión, redirigir a login
        if (!session) {
          router.replace("/auth/login")
          return
        }

        // Si requiere admin, verificar rol
        if (requireAdmin) {
          const adminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
          if (adminEmail && session.user.email !== adminEmail) {
            console.log("Usuario no es admin:", session.user.email)
            router.replace("/auth/login")
            return
          }
        }

        // Todo está bien, mostrar contenido
        if (!cancelled) {
          setReady(true)
        }
      } catch (error) {
        console.error("Error in AuthGuard:", error)
        if (!cancelled) {
          router.replace("/auth/login")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Suscribirse a cambios de auth
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return

        if (event === "SIGNED_OUT" || !session) {
          router.replace("/auth/login")
          return
        }

        // Re-verificar rol si es necesario
        if (requireAdmin) {
          const adminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
          if (adminEmail && session.user.email !== adminEmail) {
            router.replace("/auth/login")
            return
          }
        }

        if (!cancelled) {
          setReady(true)
        }
      }
    )

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [router, requireAdmin])

  // Mostrar loading mientras verifica
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Solo mostrar contenido si está listo
  if (!ready) {
    return null
  }

  return <>{children}</>
}
