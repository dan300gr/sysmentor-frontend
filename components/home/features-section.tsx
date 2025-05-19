import { BookOpen, MessageSquare, Users, Lightbulb, Wand2 } from "lucide-react"

const features = [
  {
    name: "Temario Interactivo",
    description:
      "Accede al plan de estudios completo con recursos interactivos y material de apoyo para cada asignatura.",
    icon: BookOpen,
  },
  {
    name: "Asistente Inteligente",
    description: "Resuelve tus dudas académicas con nuestro asistente basado en IA, disponible 24/7 para ayudarte.",
    icon: MessageSquare,
  },
  {
    name: "Generador IA",
    description: "Crea ejercicios, cuestionarios y recursos personalizados para reforzar tus conocimientos.",
    icon: Wand2,
  },
  {
    name: "Foros de Discusión",
    description: "Participa en comunidades de aprendizaje donde puedes compartir conocimientos con otros estudiantes.",
    icon: Users,
  },
  {
    name: "Ejercicios Personalizados",
    description:
      "Practica con ejercicios generados específicamente para reforzar tus conocimientos en áreas específicas.",
    icon: Lightbulb,
  },
]

export default function FeaturesSection() {
  return (
    <div className="py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Características Principales</h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            SysMentor ofrece herramientas diseñadas específicamente para estudiantes de Ingeniería en Sistemas.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8 h-full">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.name}</h3>
                    <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
