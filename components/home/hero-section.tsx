import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChatbotButton } from "@/components/ui/button-chatbot"

export default function HeroSection() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Bienvenido a <span className="text-blue-600">SysMentor</span>
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl">
              Tu asistente académico inteligente para la carrera de Ingeniería en Sistemas y Tecnologías de la
              Información.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button asChild size="lg">
                <Link href="/chatbot">Generador IA</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/temario">Explorar Temario</Link>
              </Button>
              <ChatbotButton variant="outline" text="Asistente IA" />
            </div>
          </div>
          <div className="hidden md:block">
            <img
              src="/student-ai-assistant.png"
              alt="SysMentor - Asistente académico inteligente"
              className="w-full h-auto rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
