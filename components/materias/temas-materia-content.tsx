"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, ArrowLeft, BookOpen, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createAuthClient, isAuthenticated } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import TemaCard from "@/components/materias/tema-card"
import { EstadoProgreso, type EstadoProgresoType, obtenerTodosLosProgresos } from "@/lib/progreso"

interface Materia {
  id: number
  nombre: string
  descripcion: string | null
  semestre_id: number
}

interface SemanaTema {
  id: number
  materia_id: number
  numero_semana: number
  tema: string
  descripcion?: string | null
}

interface Recurso {
  id: number
  semana_tema_id: number
  tipo: "lectura" | "video" | "cuestionario"
  contenido_lectura?: string
  url_video?: string
  cuestionario_id?: number
  titulo: string
}

interface ProgresoRecurso {
  id?: number
  recurso_id: number
  estado: EstadoProgresoType
}

export default function TemasMateriaContent() {
  const params = useParams()
  const materiaId = params?.id as string

  const [materia, setMateria] = useState<Materia | null>(null)
  const [temas, setTemas] = useState<SemanaTema[]>([])
  const [recursos, setRecursos] = useState<Record<number, Recurso[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [, setProgresos] = useState<Record<number, ProgresoRecurso>>({}) // corregido: no se usa 'progresos'
  const [progresoGeneral, setProgresoGeneral] = useState(0)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isAuthenticated()) {
      toast({
        variant: "destructive",
        title: "Acceso restringido",
        description: "Debes iniciar sesión para acceder a los temas de la materia.",
      })
      router.push("/login")
      return
    }

    if (!materiaId) {
      setError("ID de materia no encontrado")
      setLoading(false)
      return
    }

    fetchData()
  }, [materiaId, router, toast])

  useEffect(() => {
    const cargarProgresos = async () => {
      try {
        const todosProgresos = await obtenerTodosLosProgresos()

        const progresosObj: Record<number, ProgresoRecurso> = {}
        todosProgresos.forEach((progreso) => {
          progresosObj[progreso.recurso_id] = progreso
        })

        setProgresos(progresosObj)
        calcularProgresoGeneral(progresosObj)
      } catch (error) {
        console.error("Error al cargar progresos:", error)
      }
    }

    if (!loading && Object.keys(recursos).length > 0) {
      cargarProgresos()
    }
  }, [loading, recursos])

  const fetchData = async () => {
    try {
      setLoading(true)
      const authClient = createAuthClient()

      const materiaResponse = await authClient.get(`/materias/${materiaId}`)
      setMateria(materiaResponse.data)

      const temasResponse = await authClient.get(`/semanas-temas?materia_id=${materiaId}`)
      const temasOrdenados = temasResponse.data.sort(
        (a: SemanaTema, b: SemanaTema) => a.numero_semana - b.numero_semana,
      )
      setTemas(temasOrdenados)

      const recursosPorTema: Record<number, Recurso[]> = {}
      temasOrdenados.forEach((tema: SemanaTema) => {
        recursosPorTema[tema.id] = []
      })

      for (const tema of temasOrdenados) {
        try {
          const recursosResponse = await authClient.get(`/recursos?semana_tema_id=${tema.id}`)
          if (recursosResponse.data && Array.isArray(recursosResponse.data)) {
            const recursosConTitulo = recursosResponse.data.map((recurso: Recurso) => {
              if (!recurso.titulo) {
                return {
                  ...recurso,
                  titulo: `${recurso.tipo.charAt(0).toUpperCase() + recurso.tipo.slice(1)} - Semana ${tema.numero_semana}`,
                }
              }
              return recurso
            })

            recursosPorTema[tema.id] = recursosConTitulo
          }
        } catch (err) {
          console.error(`Error al cargar recursos para el tema ${tema.id}:`, err)
        }
      }

      setRecursos(recursosPorTema)
      setError(null)
    } catch (err) {
      console.error("Error al cargar los datos:", err)
      setError("No se pudieron cargar los datos de la materia. Por favor, intenta de nuevo más tarde.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los datos de la materia.",
      })
    } finally {
      setLoading(false)
    }
  }

  const calcularProgresoGeneral = (progresosObj: Record<number, ProgresoRecurso>) => {
    let totalRecursos = 0
    let completados = 0
    let enProgreso = 0

    Object.values(recursos).forEach((temasRecursos) => {
      temasRecursos.forEach((recurso) => {
        totalRecursos++
        const progreso = progresosObj[recurso.id]
        if (progreso) {
          if (progreso.estado === EstadoProgreso.COMPLETADO) {
            completados++
          } else if (progreso.estado === EstadoProgreso.EN_PROGRESO) {
            enProgreso++
          }
        }
      })
    })

    if (totalRecursos === 0) {
      setProgresoGeneral(0)
      return
    }

    const porcentaje = Math.round(((completados * 100 + enProgreso * 50) / (totalRecursos * 100)) * 100)
    setProgresoGeneral(porcentaje)
  }

  const handleBack = () => {
    router.back()
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
        <p className="mt-6 text-lg text-gray-600 animate-pulse">Cargando temas de la materia...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center max-w-2xl mx-auto">
        <p className="text-red-600 text-lg">{error}</p>
        <div className="mt-6 flex justify-center space-x-4">
          <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Button onClick={() => fetchData()} className="bg-red-600 hover:bg-red-700 text-white">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (!materia) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No se encontró la materia solicitada.</p>
        <Button onClick={handleBack} variant="outline" className="mt-6 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al temario
        </Button>
      </div>
    )
  }

  const contarRecursosTotales = () => {
    let total = 0
    Object.values(recursos).forEach((temasRecursos) => {
      total += temasRecursos.length
    })
    return total
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Button onClick={handleBack} variant="outline" className="mb-4 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al temario
        </Button>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <BookOpen className="mr-3 h-8 w-8" />
            {materia.nombre}
          </h1>
          {materia.descripcion && <p className="text-blue-100 mt-2">{materia.descripcion}</p>}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center text-blue-100">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{temas.length} semanas de contenido</span>
            </div>

            <div className="bg-white/10 rounded-lg p-3 w-full sm:w-auto">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-white">Progreso general</span>
                <span className="text-sm font-medium text-white">{progresoGeneral}%</span>
              </div>
              <div className="h-2 w-full sm:w-48 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${progresoGeneral}%` }}></div>
              </div>
              <div className="mt-1 text-xs text-blue-100">{contarRecursosTotales()} recursos disponibles</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">Temas por Semana</h2>
        {temas.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No hay temas disponibles para esta materia.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {temas.map((tema, index) => (
              <TemaCard key={tema.id} tema={tema} recursos={recursos[tema.id] || []} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
