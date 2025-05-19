import { AuthProvider } from "@/components/auth/auth-provider"
import Navbar from "@/components/home/navbar"
import Footer from "@/components/home/footer"
import TemasMateriaContent from "@/components/materias/temas-materia-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Temas de la Materia | SysMentor",
  description: "Explora los temas semanales de la materia",
}

// La función debe ser asíncrona para Next.js 15
export default async function MateriaPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <TemasMateriaContent />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

