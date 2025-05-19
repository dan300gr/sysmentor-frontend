"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createAuthClient } from "@/lib/auth"
import { Loader2, FileText, Video, HelpCircle, CheckCircle, XCircle, Heart } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import {
  EstadoProgreso,
  type EstadoProgresoType,
  obtenerProgresoRecurso,
  marcarEnProgreso,
  marcarComoCompletado,
} from "@/lib/progreso"

// Interfaces para los tipos de datos
interface Recurso {
  id: number
  semana_tema_id: number
  tipo: "lectura" | "video" | "cuestionario"
  contenido_lectura?: string
  url_video?: string
  cuestionario_id?: number
  titulo: string
}

interface Pregunta {
  id: number
  cuestionario_id: number
  texto: string
  opciones: Opcion[]
}

interface Opcion {
  id: number
  pregunta_id: number
  texto: string
  es_correcta: boolean
}

interface RecursoModalProps {
  recurso: Recurso
  isOpen: boolean
  onClose: () => void
  onProgresoActualizado?: () => void
}

function transformYouTubeUrl(url: string | undefined): string {
  if (!url) return ""

  // Handle YouTube URLs
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    // Extract video ID
    let videoId = ""

    if (url.includes("youtube.com/watch")) {
      const urlObj = new URL(url)
      videoId = urlObj.searchParams.get("v") || ""
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0]
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1].split("?")[0]
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
  }

  // If not a YouTube URL or couldn't extract ID, return original
  return url
}

// Componente para mostrar las vidas (corazones)
const VidasIndicator = ({ vidas }: { vidas: number }) => {
  return (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={i < vidas ? "text-red-500" : "text-gray-300"}
        >
          <Heart className={`h-5 w-5 ${i < vidas ? "fill-current" : ""}`} />
        </motion.div>
      ))}
    </div>
  )
}

// Componente para mostrar el estado de progreso
const ProgresoIndicator = ({ estado }: { estado: EstadoProgresoType }) => {
  let color = "bg-gray-200"
  let text = "No iniciado"
  let value = 0

  switch (estado) {
    case EstadoProgreso.EN_PROGRESO:
      color = "bg-blue-500"
      text = "En progreso"
      value = 50
      break
    case EstadoProgreso.COMPLETADO:
      color = "bg-green-500"
      text = "Completado"
      value = 100
      break
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">{text}</span>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}

export default function RecursoModal({ recurso, isOpen, onClose, onProgresoActualizado }: RecursoModalProps) {
  const [loading, setLoading] = useState(false)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [respuestasUsuario, setRespuestasUsuario] = useState<Record<number, number>>({})
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [puntuacion, setPuntuacion] = useState({ correctas: 0, total: 0 })
  const [vidas, setVidas] = useState(5)
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [juegoTerminado, setJuegoTerminado] = useState(false)
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<number | null>(null)
  const [estadoProgreso, setEstadoProgreso] = useState<EstadoProgresoType>(EstadoProgreso.NO_INICIADO)
  const [cargandoProgreso, setCargandoProgreso] = useState(true)
  const [tiempoLectura, setTiempoLectura] = useState(0)
  const [tiempoVideo, setTiempoVideo] = useState(0)
  const { toast } = useToast()

  // Cargar el progreso del recurso
  useEffect(() => {
    if (isOpen && recurso.id) {
      const cargarProgreso = async () => {
        setCargandoProgreso(true)
        try {
          const progreso = await obtenerProgresoRecurso(recurso.id)
          if (progreso) {
            setEstadoProgreso(progreso.estado as EstadoProgresoType)
          } else {
            setEstadoProgreso(EstadoProgreso.NO_INICIADO)
          }
        } catch (error) {
          console.error("Error al cargar progreso:", error)
        } finally {
          setCargandoProgreso(false)
        }
      }

      cargarProgreso()
    }
  }, [isOpen, recurso.id])

  // Marcar como en progreso al abrir el recurso
  useEffect(() => {
    if (isOpen && recurso.id && !cargandoProgreso && estadoProgreso === EstadoProgreso.NO_INICIADO) {
      const iniciarProgreso = async () => {
        try {
          const progreso = await marcarEnProgreso(recurso.id)
          if (progreso) {
            setEstadoProgreso(EstadoProgreso.EN_PROGRESO)
            if (onProgresoActualizado) onProgresoActualizado()
          }
        } catch (error) {
          console.error("Error al iniciar progreso:", error)
          // Mostrar mensaje de error al usuario
          toast({
            variant: "destructive",
            title: "Error al iniciar progreso",
            description: "No se pudo registrar el inicio del progreso. Por favor, intenta de nuevo.",
          })
        }
      }

      iniciarProgreso()
    }
  }, [isOpen, recurso.id, cargandoProgreso, estadoProgreso, onProgresoActualizado, toast])

  // Temporizador para lecturas
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isOpen && recurso.tipo === "lectura" && estadoProgreso !== EstadoProgreso.COMPLETADO) {
      // Iniciar temporizador
      interval = setInterval(() => {
        setTiempoLectura((prev) => prev + 1)
      }, 1000)

      // Marcar como completado después de 30 segundos (ajustable)
      const timeout = setTimeout(async () => {
        if (estadoProgreso === EstadoProgreso.NO_INICIADO || estadoProgreso === EstadoProgreso.EN_PROGRESO) {
          try {
            const progreso = await marcarComoCompletado(recurso.id)
            if (progreso) {
              setEstadoProgreso(EstadoProgreso.COMPLETADO)
              if (onProgresoActualizado) onProgresoActualizado()

              toast({
                title: "Lectura completada",
                description: "Has completado esta lectura correctamente.",
              })
            }
          } catch (error) {
            console.error("Error al completar lectura:", error)
            toast({
              variant: "destructive",
              title: "Error al completar lectura",
              description: "No se pudo registrar la lectura como completada.",
            })
          }
        }
      }, 30000) // 30 segundos para marcar como completada

      return () => {
        if (interval) clearInterval(interval)
        clearTimeout(timeout)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isOpen, recurso.id, recurso.tipo, estadoProgreso, onProgresoActualizado, toast])

  // Temporizador para videos
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isOpen && recurso.tipo === "video" && estadoProgreso !== EstadoProgreso.COMPLETADO) {
      // Iniciar temporizador
      interval = setInterval(() => {
        setTiempoVideo((prev) => prev + 1)
      }, 1000)

      // Marcar como completado después de 60 segundos (ajustable)
      const timeout = setTimeout(async () => {
        if (estadoProgreso === EstadoProgreso.NO_INICIADO || estadoProgreso === EstadoProgreso.EN_PROGRESO) {
          try {
            const progreso = await marcarComoCompletado(recurso.id)
            if (progreso) {
              setEstadoProgreso(EstadoProgreso.COMPLETADO)
              if (onProgresoActualizado) onProgresoActualizado()

              toast({
                title: "Video completado",
                description: "Has completado este video correctamente.",
              })
            }
          } catch (error) {
            console.error("Error al completar video:", error)
            toast({
              variant: "destructive",
              title: "Error al completar video",
              description: "No se pudo registrar el video como completado.",
            })
          }
        }
      }, 60000) // 60 segundos para marcar como completado

      return () => {
        if (interval) clearInterval(interval)
        clearTimeout(timeout)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isOpen, recurso.id, recurso.tipo, estadoProgreso, onProgresoActualizado, toast])

  // Cargar preguntas si es un cuestionario
  useEffect(() => {
    if (recurso.tipo === "cuestionario" && recurso.cuestionario_id && isOpen) {
      const cargarPreguntas = async () => {
        try {
          setLoading(true)
          const authClient = createAuthClient()

          // Obtener preguntas del cuestionario
          const preguntasResponse = await authClient.get(`/cuestionarios/${recurso.cuestionario_id}/preguntas`)

          // Para cada pregunta, obtener sus opciones
          const preguntasConOpciones = await Promise.all(
            preguntasResponse.data.map(async (pregunta: Pregunta) => {
              const opcionesResponse = await authClient.get(`/preguntas/${pregunta.id}/opciones`)
              return {
                ...pregunta,
                opciones: opcionesResponse.data,
              }
            }),
          )

          // Mezclar las preguntas para hacerlo más dinámico
          const preguntasMezcladas = [...preguntasConOpciones].sort(() => Math.random() - 0.5)
          setPreguntas(preguntasMezcladas)

          // Reiniciar estados
          setRespuestasUsuario({})
          setMostrarResultados(false)
          setVidas(5)
          setPreguntaActual(0)
          setJuegoTerminado(false)
          setRespuestaSeleccionada(null)
        } catch (error) {
          console.error("Error al cargar las preguntas:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudieron cargar las preguntas del cuestionario.",
          })
        } finally {
          setLoading(false)
        }
      }

      cargarPreguntas()
    }
  }, [recurso, isOpen, toast])

  // Manejar selección de respuesta en modo dinámico
  const handleSeleccionarRespuestaDinamica = (opcionId: number) => {
    if (respuestaSeleccionada !== null || juegoTerminado) return

    setRespuestaSeleccionada(opcionId)

    const preguntaActualObj = preguntas[preguntaActual]
    const opcionSeleccionada = preguntaActualObj.opciones.find((o) => o.id === opcionId)
    const esCorrecta = opcionSeleccionada?.es_correcta || false

    // Actualizar respuestas del usuario
    setRespuestasUsuario((prev) => ({
      ...prev,
      [preguntaActualObj.id]: opcionId,
    }))

    // Esperar un momento para mostrar si la respuesta es correcta o no
    setTimeout(() => {
      if (!esCorrecta) {
        // Restar una vida si la respuesta es incorrecta
        const nuevasVidas = vidas - 1
        setVidas(nuevasVidas)

        if (nuevasVidas <= 0) {
          // Juego terminado por falta de vidas
          setJuegoTerminado(true)
          toast({
            variant: "destructive",
            title: "¡Te has quedado sin vidas!",
            description: "Inténtalo de nuevo para mejorar tu puntuación.",
          })
          return
        }

        toast({
          variant: "destructive",
          title: "Respuesta incorrecta",
          description: "Has perdido una vida. ¡Sigue intentando!",
        })
      } else {
        toast({
          title: "¡Respuesta correcta!",
          description: "¡Muy bien! Continúa con la siguiente pregunta.",
        })
      }

      // Pasar a la siguiente pregunta o terminar si es la última
      if (preguntaActual < preguntas.length - 1) {
        setPreguntaActual(preguntaActual + 1)
        setRespuestaSeleccionada(null)
      } else {
        // Calcular puntuación final
        let correctas = 0
        Object.entries(respuestasUsuario).forEach(([preguntaId, opcionId]) => {
          const pregunta = preguntas.find((p) => p.id === Number(preguntaId))
          const opcionCorrecta = pregunta?.opciones.find((o) => o.es_correcta)
          if (opcionCorrecta && opcionCorrecta.id === opcionId) {
            correctas++
          }
        })

        const puntuacionFinal = {
          correctas: correctas + (esCorrecta ? 1 : 0), // Añadir la última respuesta si es correcta
          total: preguntas.length,
        }

        setPuntuacion(puntuacionFinal)

        // Calcular calificación sobre 100
        const calificacion = Math.round((puntuacionFinal.correctas / puntuacionFinal.total) * 100)

        // Marcar como completado con la calificación
        const completarCuestionario = async () => {
          try {
            const progreso = await marcarComoCompletado(
              recurso.id,
              calificacion,
              `Completado con ${vidas} vidas restantes`,
            )

            if (progreso) {
              setEstadoProgreso(EstadoProgreso.COMPLETADO)
              if (onProgresoActualizado) onProgresoActualizado()
            }
          } catch (error) {
            console.error("Error al completar cuestionario:", error)
            toast({
              variant: "destructive",
              title: "Error al guardar resultados",
              description: "No se pudieron guardar los resultados del cuestionario.",
            })
          }
        }

        completarCuestionario()

        setJuegoTerminado(true)
        toast({
          title: "¡Cuestionario completado!",
          description: `Has completado el cuestionario con ${vidas} vidas restantes.`,
        })
      }
    }, 1500)
  }

  // Reiniciar cuestionario
  const reiniciarCuestionario = () => {
    setRespuestasUsuario({})
    setMostrarResultados(false)
    setVidas(5)
    setPreguntaActual(0)
    setJuegoTerminado(false)
    setRespuestaSeleccionada(null)

    // Mezclar las preguntas nuevamente
    setPreguntas((prev) => [...prev].sort(() => Math.random() - 0.5))
  }

  // Renderizar contenido según el tipo de recurso
  const renderContenido = () => {
    switch (recurso.tipo) {
      case "lectura":
        return (
          <div className="prose prose-blue max-w-none">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-green-600">
                <FileText className="mr-2 h-5 w-5" />
                <h3 className="text-lg font-medium">Lectura</h3>
              </div>
              <div className="text-sm text-gray-500">
                Tiempo de lectura: {Math.floor(tiempoLectura / 60)}:{(tiempoLectura % 60).toString().padStart(2, "0")}
              </div>
            </div>

            <div className="mb-4">
              <ProgresoIndicator estado={estadoProgreso} />
            </div>

            {recurso.contenido_lectura ? (
              <div
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: formatLecturaContent(recurso.contenido_lectura),
                }}
              />
            ) : (
              <p className="text-gray-500 italic">No hay contenido disponible para esta lectura.</p>
            )}
          </div>
        )

      case "video":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-red-600">
                <Video className="mr-2 h-5 w-5" />
                <h3 className="text-lg font-medium">Video</h3>
              </div>
              <div className="text-sm text-gray-500">
                Tiempo de visualización: {Math.floor(tiempoVideo / 60)}:{(tiempoVideo % 60).toString().padStart(2, "0")}
              </div>
            </div>

            <div className="mb-4">
              <ProgresoIndicator estado={estadoProgreso} />
            </div>

            {recurso.url_video ? (
              <div className="aspect-video">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={transformYouTubeUrl(recurso.url_video)}
                  title={recurso.titulo}
                  allowFullScreen
                  frameBorder="0"
                ></iframe>
              </div>
            ) : (
              <p className="text-gray-500 italic">No hay video disponible para este recurso.</p>
            )}
          </div>
        )

      case "cuestionario":
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-purple-600">
                <HelpCircle className="mr-2 h-5 w-5" />
                <h3 className="text-lg font-medium">Cuestionario</h3>
              </div>
              
            </div>

            <div className="mb-4">
              <ProgresoIndicator estado={estadoProgreso} />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : preguntas.length === 0 ? (
              <p className="text-gray-500 italic">No hay preguntas disponibles para este cuestionario.</p>
            ) : juegoTerminado ? (
              <div className="space-y-6">
                <div
                  className={`p-6 rounded-lg ${vidas > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                >
                  <h4 className="font-medium text-xl mb-3">Resultados finales:</h4>

                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-700 text-lg">
                      Puntuación: <span className="font-bold">{puntuacion.correctas}</span> de{" "}
                      <span className="font-bold">{puntuacion.total}</span> respuestas correctas
                    </p>
                    <div className="flex items-center">
                      <span className="mr-2">Vidas restantes:</span>
                      <VidasIndicator vidas={vidas} />
                    </div>
                  </div>

                  <div className="mt-4">
                    {vidas > 0 ? (
                      <p className="text-green-700 font-medium">
                        ¡Felicidades! Has completado el cuestionario con éxito.
                      </p>
                    ) : (
                      <p className="text-red-700 font-medium">Te has quedado sin vidas. ¡Inténtalo de nuevo!</p>
                    )}
                  </div>

                  <Button onClick={reiniciarCuestionario} className="mt-4">
                    Reintentar cuestionario
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
                  <span className="font-medium">
                    Pregunta {preguntaActual + 1} de {preguntas.length}
                  </span>
                  <div className="flex items-center">
                    <span className="mr-2">Vidas:</span>
                    <VidasIndicator vidas={vidas} />
                  </div>
                </div>

                <motion.div
                  key={preguntaActual}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="border rounded-lg p-5 bg-white">
                    <h4 className="font-medium text-lg mb-4">{preguntas[preguntaActual]?.texto}</h4>
                    <div className="space-y-3">
                      {preguntas[preguntaActual]?.opciones.map((opcion) => {
                        const isSelected = respuestaSeleccionada === opcion.id
                        const showResult = respuestaSeleccionada !== null
                        const isCorrect = opcion.es_correcta

                        let optionClass =
                          "border p-4 rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"

                        if (showResult) {
                          if (isCorrect) {
                            optionClass =
                              "border border-green-300 bg-green-50 p-4 rounded-md flex items-center justify-between"
                          } else if (isSelected) {
                            optionClass =
                              "border border-red-300 bg-red-50 p-4 rounded-md flex items-center justify-between"
                          }
                        } else if (isSelected) {
                          optionClass =
                            "border border-blue-300 bg-blue-50 p-4 rounded-md flex items-center justify-between"
                        }

                        return (
                          <motion.div
                            key={opcion.id}
                            className={optionClass}
                            onClick={() =>
                              respuestaSeleccionada === null && handleSeleccionarRespuestaDinamica(opcion.id)
                            }
                            whileHover={{ scale: respuestaSeleccionada === null ? 1.01 : 1 }}
                            whileTap={{ scale: respuestaSeleccionada === null ? 0.99 : 1 }}
                          >
                            <span className="flex-1">{opcion.texto}</span>
                            {showResult && (
                              <div className="ml-2">
                                {isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : isSelected ? (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                ) : null}
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )

      default:
        return <p className="text-gray-500 italic">Tipo de recurso no reconocido.</p>
    }
  }

  // Función para formatear el contenido de las lecturas
  const formatLecturaContent = (content: string): string => {
    if (!content) return ""

    // Asegurarse de que los párrafos estén correctamente separados
    let formattedContent = content

    // Reemplazar saltos de línea simples con párrafos HTML si no están ya en párrafos
    if (!formattedContent.includes("<p>")) {
      formattedContent = formattedContent
        .split("\n\n")
        .map((paragraph) => `<p>${paragraph}</p>`)
        .join("")
    }

    // Añadir clases para mejorar el estilo
    formattedContent = formattedContent
      .replace(/<h1/g, '<h1 class="text-2xl font-bold mb-4 mt-6 text-blue-800"')
      .replace(/<h2/g, '<h2 class="text-xl font-bold mb-3 mt-5 text-blue-700"')
      .replace(/<h3/g, '<h3 class="text-lg font-bold mb-2 mt-4 text-blue-600"')
      .replace(/<p>/g, '<p class="mb-4 text-gray-800">')
      .replace(/<ul>/g, '<ul class="list-disc pl-5 mb-4">')
      .replace(/<ol>/g, '<ol class="list-decimal pl-5 mb-4">')
      .replace(/<li>/g, '<li class="mb-1">')
      .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-blue-200 pl-4 italic text-gray-700 my-4">')
      .replace(/<code>/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">')
      .replace(/<pre>/g, '<pre class="bg-gray-100 p-3 rounded my-4 overflow-x-auto">')

    return formattedContent
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{recurso.titulo}</DialogTitle>

        </DialogHeader>

        <div className="mt-4">{renderContenido()}</div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

