import TemarioContent from "@/components/temario/temario-content"
import { AuthProvider } from "@/components/auth/auth-provider"
import Navbar from "@/components/home/navbar"
import Footer from "@/components/home/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Temario | SysMentor",
  description: "Explora el temario de Ingeniería en Sistemas y Tecnologías de la Información",
}

export default function TemarioPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Temario Interactivo
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explora las materias organizadas por semestre para la carrera de Ingeniería en Sistemas y Tecnologías de
              la Información. Haz clic en cada semestre para ver sus asignaturas.
            </p>
          </div>
          <TemarioContent />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
