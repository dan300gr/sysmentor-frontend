import { AuthProvider } from "@/components/auth/auth-provider"
import Navbar from "@/components/home/navbar"
import Footer from "@/components/home/footer"
import ForosContent from "@/components/foros/foros-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Foros de Discusión | SysMentor",
  description: "Comunidad de estudiantes de Ingeniería en Sistemas y Tecnologías de la Información",
}

export default function ForosPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Foros de Discusión
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comparte tus dudas, conocimientos y experiencias con otros estudiantes de la carrera. Participa en
              discusiones académicas y forma parte de nuestra comunidad.
            </p>
          </div>
          <ForosContent />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
