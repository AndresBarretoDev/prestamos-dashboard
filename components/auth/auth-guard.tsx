"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireOwnership?: boolean
  prestamoId?: string
}

export function AuthGuard({ children, requireAdmin = false, requireOwnership = false, prestamoId }: AuthGuardProps) {
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

        // Si requiere propiedad de préstamo, verificar que el usuario sea dueño
        if (requireOwnership && prestamoId) {
          try {
            // Verificar si el usuario es admin (los admins pueden ver todos los préstamos)
            const adminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
            const isAdmin = adminEmail && session.user.email === adminEmail

            if (!isAdmin) {
              // Verificar que el préstamo pertenece al usuario
              const { data: deudor, error: deudorError } = await supabase
                .from('deudores')
                .select('id')
                .eq('user_id', session.user.id)
                .single()

              if (deudorError || !deudor) {
                console.log("Usuario no tiene deudor asociado")
                router.replace("/auth/login")
                return
              }

              // Verificar que el préstamo pertenece al deudor del usuario
              const { data: prestamo, error: prestamoError } = await supabase
                .from('prestamos')
                .select('id')
                .eq('id', prestamoId)
                .eq('deudor_id', deudor.id)
                .single()

              if (prestamoError || !prestamo) {
                console.log("Usuario no tiene acceso a este préstamo")
                router.replace("/auth/login")
                return
              }
            }
          } catch (error) {
            console.error("Error verificando propiedad de préstamo:", error)
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

        // Re-verificar propiedad de préstamo si es necesario
        if (requireOwnership && prestamoId) {
          try {
            const adminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL
            const isAdmin = adminEmail && session.user.email === adminEmail

            if (!isAdmin) {
              const { data: deudor, error: deudorError } = await supabase
                .from('deudores')
                .select('id')
                .eq('user_id', session.user.id)
                .single()

              if (deudorError || !deudor) {
                router.replace("/auth/login")
                return
              }

              const { data: prestamo, error: prestamoError } = await supabase
                .from('prestamos')
                .select('id')
                .eq('id', prestamoId)
                .eq('deudor_id', deudor.id)
                .single()

              if (prestamoError || !prestamo) {
                router.replace("/auth/login")
                return
              }
            }
          } catch (error) {
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
  }, [router, requireAdmin, requireOwnership, prestamoId])

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
