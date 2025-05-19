import { AuthProvider } from "@/components/auth/auth-provider"
import Navbar from "@/components/home/navbar"
import Footer from "@/components/home/footer"
import NuevoForoForm from "@/components/foros/nuevo-foro-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Crear Nuevo Tema | SysMentor",
  description: "Crea un nuevo tema en los foros de SysMentor",
}

export default function NuevoForoPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Crear Nuevo Tema</h1>
            <NuevoForoForm />
          </div>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
