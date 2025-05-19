import { AuthProvider } from "@/components/auth/auth-provider"
import Navbar from "@/components/home/navbar"
import Footer from "@/components/home/footer"
import ForoDetalleContent from "@/components/foros/foro-detalle-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Detalle del Tema | SysMentor",
  description: "Detalle del tema y comentarios en los foros de SysMentor",
}

export default function ForoDetallePage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <ForoDetalleContent />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
