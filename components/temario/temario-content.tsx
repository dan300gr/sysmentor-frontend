"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import SemestreAccordion from "@/components/temario/semestre-accordion"
import { createAuthClient, isAuthenticated } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"

// Definir interfaces para los tipos de datos
interface Semestre {
  id: number
  nombre: string
}

interface Materia {
  id: number
  nombre: string
  descripcion: string | null
  semestre_id: number
}

// Mapa de números ordinales en español a números
const ordinales: Record<string, number> = {
  Primer: 1,
  Segundo: 2,
  Tercer: 3,
  Cuarto: 4,
  Quinto: 5,
  Sexto: 6,
  Septimo: 7,
  Séptimo: 7,
  Octavo: 8,
  Noveno: 9,
  Decimo: 10,
  Décimo: 10,
}

// Función para extraer el número de semestre basado en el nombre
const getSemestreNumero = (nombre: string): number => {
  // Buscar si alguna palabra del nombre coincide con un ordinal
  const palabras = nombre.split(" ")
  for (const palabra of palabras) {
    const ordinal = ordinales[palabra]
    if (ordinal) return ordinal
  }

  // Si no encontramos un ordinal, intentamos extraer un número
  const numeroMatch = nombre.match(/\d+/)
  if (numeroMatch) {
    return Number.parseInt(numeroMatch[0], 10)
  }

  // Si todo falla, devolvemos un valor alto para que aparezca al final
  return 999
}

// Frases motivacionales para mostrar aleatoriamente
const frasesMotivacinales = [
  "El conocimiento es poder. ¡Sigue aprendiendo!",
  "Cada materia te acerca más a tu meta profesional.",
  "La constancia es la clave del éxito académico.",
  "Aprender es un viaje, no un destino. ¡Disfrútalo!",
  "El esfuerzo de hoy es el éxito del mañana.",
  "La tecnología cambia el mundo, y tú serás parte de ese cambio.",
  "Cada línea de código te acerca más a convertirte en un gran ingeniero.",
  "La curiosidad es el motor del aprendizaje en tecnología.",
  "Los grandes logros requieren tiempo y dedicación.",
  "Tu futuro en tecnología comienza con cada materia que dominas.",
]

export default function TemarioContent() {
  const [semestres, setSemestres] = useState<Semestre[]>([])
  const [materiasPorSemestre, setMateriasPorSemestre] = useState<Record<number, Materia[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fraseMotivacional, setFraseMotivacional] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
      // Si no está autenticado, mostrar mensaje y redirigir a login
      toast({
        variant: "destructive",
        title: "Acceso restringido",
        description: "Debes iniciar sesión para acceder al temario.",
      })
      router.push("/login")
      return
    }

    // Si está autenticado, seleccionar una frase motivacional aleatoria
    const randomIndex = Math.floor(Math.random() * frasesMotivacinales.length)
    setFraseMotivacional(frasesMotivacinales[randomIndex])

    // Cargar los datos del temario
    fetchSemestres()
  }, [router, toast])

  // Función optimizada para cargar los semestres y materias
  const fetchSemestres = async () => {
    try {
      setLoading(true)
      const authClient = createAuthClient()

      // Obtener semestres
      const response = await authClient.get("/semestres")

      // Ordenar semestres usando la función de extracción de número
      const semestresOrdenados = response.data.sort((a: Semestre, b: Semestre) => {
        const numA = getSemestreNumero(a.nombre)
        const numB = getSemestreNumero(b.nombre)
        return numA - numB
      })

      setSemestres(semestresOrdenados)

      // Cargar todas las materias en una sola solicitud
      const todasMateriasResponse = await authClient.get("/materias")
      const todasMaterias: Materia[] = todasMateriasResponse.data

      // Organizar materias por semestre_id
      const materiasAgrupadas: Record<number, Materia[]> = {}

      // Inicializar arrays vacíos para cada semestre
      semestresOrdenados.forEach((semestre: Semestre) => {
        materiasAgrupadas[semestre.id] = []
      })

      // Agrupar materias por semestre_id
      todasMaterias.forEach((materia: Materia) => {
        if (materiasAgrupadas[materia.semestre_id]) {
          materiasAgrupadas[materia.semestre_id].push(materia)
        }
      })

      setMateriasPorSemestre(materiasAgrupadas)
      setError(null)
    } catch (err) {
      console.error("Error al cargar el temario:", err)
      setError("No se pudo cargar el temario. Por favor, intenta de nuevo más tarde.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el temario. Por favor, intenta de nuevo más tarde.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-white"></div>
          </div>
        </div>
        <p className="mt-6 text-lg text-gray-600 animate-pulse">Cargando tu camino académico...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center max-w-2xl mx-auto">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={() => fetchSemestres()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Frase motivacional */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-8 text-center shadow-sm border border-blue-100">
        <p className="text-blue-800 text-lg italic font-medium">&quot;{fraseMotivacional}&quot;</p>
      </div>

      <div className="space-y-6">
        {semestres.length === 0 ? (
          <p className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">No hay semestres disponibles.</p>
        ) : (
          semestres.map((semestre) => (
            <SemestreAccordion
              key={semestre.id}
              semestre={semestre}
              materias={materiasPorSemestre[semestre.id] || []}
            />
          ))
        )}
      </div>
    </div>
  )
}
