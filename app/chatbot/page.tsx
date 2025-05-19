import Navbar from "@/components/home/navbar"
import Footer from "@/components/home/footer"
import ChatbotGeneratorContent from "@/components/chatbot/chatbot-generator-content"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthProvider } from "@/components/auth/auth-provider"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Generador IA | SysMentor",
  description: "Generador inteligente de ejercicios y recursos para estudiantes de Ingeniería en Sistemas",
}

export default function ChatbotPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Generador Inteligente
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Crea ejercicios, cuestionarios y recursos personalizados para reforzar tus conocimientos en Ingeniería en
              Sistemas.
            </p>
          </div>

          <Tabs defaultValue="generator" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="generator" className="text-sm sm:text-base">
                Generador IA
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm sm:text-base">
                Mis Generaciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="mt-0">
              <ChatbotGeneratorContent />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg shadow-md border border-gray-100">
                <div className="text-center max-w-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Historial de Generaciones</h3>
                  <p className="text-gray-600 mb-4">
                    Aquí podrás ver todas tus generaciones anteriores y reutilizarlas cuando lo necesites.
                  </p>
                  <p className="text-sm text-blue-600">Esta función estará disponible próximamente.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
