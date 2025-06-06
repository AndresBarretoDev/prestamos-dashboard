import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster as UIToaster } from "@/components/ui/toaster"
import { Toaster } from "@/components/ui/sonner"
import { StagewiseToolbar } from "@stagewise/toolbar-next"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "Plataforma de Gestión de Préstamos",
  description: "Sistema para administrar préstamos personales",
  generator: 'v0.dev'
}

const stagewiseConfig = {
  plugins: []
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={dmSans.variable}>
      <body className="font-dm-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <UIToaster />
          <Toaster />
          {process.env.NODE_ENV === 'development' && (
            <StagewiseToolbar config={stagewiseConfig} />
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}