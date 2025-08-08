import { Dashboard } from "@/components/dashboard"
import { Navbar } from "@/components/navbar"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function Home() {
  return (
    <AuthGuard requireAdmin={true}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto p-4 md:p-6">
          <Dashboard />
        </main>
      </div>
    </AuthGuard>
  )
}
