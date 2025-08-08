"use client"

import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { BellIcon, HomeIcon, UserIcon, LogOutIcon, SettingsIcon, UserCircleIcon, HelpCircleIcon, LogInIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfiguracionDialog } from "@/components/configuracion-dialog"
import { useState } from "react"
import { useSession } from "@/hooks/use-session"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function Navbar() {
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const { user, session, loading } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleLogin = () => {
    router.push("/auth/login")
  }

  // Mostrar loading mientras verifica la sesión
  if (loading) {
    return (
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M18 7c0-5.333-8-5.333-8 0" />
                <path d="M10 7v14" />
                <path d="M6 21h12" />
                <path d="M6 13h10" />
              </svg>
              <span>Préstamos</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <ModeToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M18 7c0-5.333-8-5.333-8 0" />
              <path d="M10 7v14" />
              <path d="M6 21h12" />
              <path d="M6 13h10" />
            </svg>
            <span>Préstamos</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium flex items-center gap-1 hover:underline">
              <HomeIcon className="h-4 w-4" />
              Inicio
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <BellIcon className="h-5 w-5" />
            <span className="sr-only">Notificaciones</span>
          </Button>

          {session ? (
            // Usuario autenticado
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserIcon className="h-5 w-5" />
                  <span className="sr-only">Perfil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ? "Administrador" : "Usuario"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <UserCircleIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfigDialogOpen(true)}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <HelpCircleIcon className="mr-2 h-4 w-4" />
                  <span>Ayuda</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Usuario no autenticado
            <Button onClick={handleLogin} variant="outline" size="sm">
              <LogInIcon className="mr-2 h-4 w-4" />
              Iniciar sesión
            </Button>
          )}

          <ModeToggle />
        </div>
      </div>

      <ConfiguracionDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
      />
    </header>
  )
}
