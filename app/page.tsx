import { Dashboard } from "@/components/dashboard"
import { Navbar } from "@/components/navbar"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 md:p-6">
        <Dashboard />
      </main>
    </div>
  )
}
