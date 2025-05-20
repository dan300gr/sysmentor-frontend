"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Video, HelpCircle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import RecursoModal from "@/components/recursos/recurso-modal"
import { EstadoProgreso, type EstadoProgresoType, obtenerProgresoRecurso } from "@/lib/progreso"

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

interface TemaCardProps {
  tema: SemanaTema
  recursos: Recurso[]
  index: number
}

export default function TemaCard({ tema, recursos, index }: TemaCardProps) {
  const [selectedRecurso, setSelectedRecurso] = useState<Recurso | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [progresos, setProgresos] = useState<Record<number, EstadoProgresoType>>({})
  const [cargandoProgresos, setCargandoProgresos] = useState(true)

  // Cargar progresos de los recursos
  useEffect(() => {
    const cargarProgresos = async () => {
      if (recursos.length === 0) return

      setCargandoProgresos(true)
      const nuevosProgresos: Record<number, EstadoProgresoType> = {}

      for (const recurso of recursos) {
        try {
          const progreso = await obtenerProgresoRecurso(recurso.id)
          if (progreso) {
            nuevosProgresos[recurso.id] = progreso.estado as EstadoProgresoType
          } else {
            nuevosProgresos[recurso.id] = EstadoProgreso.NO_INICIADO
          }
        } catch (error) {
          console.error(`Error al cargar progreso para recurso ${recurso.id}:`, error)
          nuevosProgresos[recurso.id] = EstadoProgreso.NO_INICIADO
        }
      }

      setProgresos(nuevosProgresos)
      setCargandoProgresos(false)
    }

    cargarProgresos()
  }, [recursos])

  // Función para abrir el modal con el recurso seleccionado
  const handleOpenRecurso = (recurso: Recurso) => {
    setSelectedRecurso(recurso)
    setIsModalOpen(true)
  }

  // Función para cerrar el modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRecurso(null)
  }

  // Función para actualizar los progresos después de interactuar con un recurso
  const handleProgresoActualizado = async () => {
    if (selectedRecurso) {
      try {
        const progreso = await obtenerProgresoRecurso(selectedRecurso.id)
        if (progreso) {
          setProgresos((prev) => ({
            ...prev,
            [selectedRecurso.id]: progreso.estado as EstadoProgresoType,
          }))
        }
      } catch (error) {
        console.error(`Error al actualizar progreso para recurso ${selectedRecurso.id}:`, error)
      }
    }
  }

  // Función para obtener el icono según el tipo de recurso
  const getRecursoIcon = (tipo: string) => {
    switch (tipo) {
      case "video":
        return <Video className="h-5 w-5 text-red-500" />
      case "lectura":
        return <FileText className="h-5 w-5 text-green-500" />
      case "cuestionario":
        return <HelpCircle className="h-5 w-5 text-purple-500" />
      default:
        return <FileText className="h-5 w-5 text-blue-500" />
    }
  }

  // Calcular el progreso general del tema
  const calcularProgresoTema = (): number => {
    if (recursos.length === 0) return 0

    let completados = 0
    let enProgreso = 0

    Object.values(progresos).forEach((estado) => {
      if (estado === EstadoProgreso.COMPLETADO) {
        completados++
      } else if (estado === EstadoProgreso.EN_PROGRESO) {
        enProgreso++
      }
    })

    // Calcular porcentaje: completados valen 100%, en progreso valen 50%
    return Math.round(((completados * 100 + enProgreso * 50) / (recursos.length * 100)) * 100)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500">
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">
                {tema.numero_semana}
              </div>
              <CardTitle className="text-lg">{tema.tema}</CardTitle>
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>Semana {tema.numero_semana}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex justify-between items-center">
            <div className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium">
              Semana {tema.numero_semana} de 18
            </div>

            {recursos.length > 0 && !cargandoProgresos && (
              <div className="text-sm text-gray-600 flex items-center">
                <span className="mr-2">Progreso:</span>
                <span className="font-medium">{calcularProgresoTema()}%</span>
              </div>
            )}
          </div>



          {/* Sección de recursos */}
          {recursos && recursos.length > 0 ? (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Recursos disponibles:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recursos.map((recurso) => {
                  const estado = progresos[recurso.id] || EstadoProgreso.NO_INICIADO
                  let statusColor = "bg-gray-100"
                  let statusText = ""

                  if (estado === EstadoProgreso.EN_PROGRESO) {
                    statusColor = "bg-blue-100"
                    statusText = "En progreso"
                  } else if (estado === EstadoProgreso.COMPLETADO) {
                    statusColor = "bg-green-100"
                    statusText = "Completado"
                  }

                  return (
                    <Button
                      key={recurso.id}
                      variant="outline"
                      className={`justify-start text-left h-auto py-2 ${estado === EstadoProgreso.COMPLETADO ? "border-green-300" : ""}`}
                      onClick={() => handleOpenRecurso(recurso)}
                    >
                      <div className="flex items-center w-full">
                        <div className="flex items-center flex-1">
                          {getRecursoIcon(recurso.tipo)}
                          <div className="ml-2">
                            <div className="font-medium">
                              {recurso.titulo || `${recurso.tipo.charAt(0).toUpperCase() + recurso.tipo.slice(1)}`}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">{recurso.tipo}</div>
                          </div>
                        </div>

                        {estado === EstadoProgreso.COMPLETADO && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                        )}

                        {statusText && (
                          <span className={`text-xs px-2 py-1 rounded-full ml-2 ${statusColor}`}>{statusText}</span>
                        )}
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic mt-4">No hay recursos disponibles para este tema.</p>
          )}
        </CardContent>
      </Card>

      {/* Modal para mostrar el recurso seleccionado */}
      {selectedRecurso && (
        <RecursoModal
          recurso={selectedRecurso}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onProgresoActualizado={handleProgresoActualizado}
        />
      )}
    </motion.div>
  )
}