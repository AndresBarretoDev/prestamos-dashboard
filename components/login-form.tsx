'use client'

import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error checking auth status:', error)
          return
        }

        // Si ya está autenticado, redirigir al dashboard
        if (session?.user) {
          const isAdmin = session.user.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ||
            session.user.email === 'info@bytesandbuilds.com'

          if (isAdmin) {
            router.replace('/')
          } else {
            // Para clientes, intentar ir a su préstamo
            try {
              const { data: deudor } = await supabase
                .from('deudores')
                .select('id')
                .eq('user_id', session.user.id)
                .single()

              if (deudor) {
                const { data: prestamo } = await supabase
                  .from('prestamos')
                  .select('id')
                  .eq('deudor_id', deudor.id)
                  .single()

                if (prestamo) {
                  router.replace(`/prestamos/${prestamo.id}`)
                } else {
                  router.replace('/')
                }
              } else {
                router.replace('/')
              }
            } catch (error) {
              router.replace('/')
            }
          }
        }
      } catch (error) {
        console.error('Error in auth check:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuthStatus()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Verificar si el usuario es admin
      const isAdmin = email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ||
        email === 'info@bytesandbuilds.com'

      if (isAdmin) {
        // Admin va al dashboard
        router.push('/')
      } else {
        // Cliente va a su préstamo (si existe)
        try {
          const { data: deudor } = await supabase
            .from('deudores')
            .select('id')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .single()

          if (deudor) {
            // Buscar el préstamo del deudor
            const { data: prestamo } = await supabase
              .from('prestamos')
              .select('id')
              .eq('deudor_id', deudor.id)
              .single()

            if (prestamo) {
              router.push(`/prestamos/${prestamo.id}`)
            } else {
              // Si no tiene préstamo, ir al dashboard
              router.push('/')
            }
          } else {
            // Si no tiene deudor asociado, ir al dashboard
            router.push('/')
          }
        } catch (error) {
          // En caso de error, ir al dashboard
          router.push('/')
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar loading mientras verifica si ya está autenticado
  if (checkingAuth) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Verificando autenticación...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/auth/sign-up" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
