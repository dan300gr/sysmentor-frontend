"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Code,
  FileQuestion,
  Lightbulb,
  Cpu,
  BrainCircuit,
  Dices,
  Wand2,
  Pause,
  Play,
  X,
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { isAuthenticated, getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"
import { sendChatbotMessage } from "@/lib/chatbot"
import { markdownToHtml, sanitizeHtml } from "@/lib/markdown"
import axios from "axios"

// Tipos de generación disponibles
const generationTypes = [
  {
    id: "exercise",
    name: "Ejercicio Práctico",
    icon: <Code className="h-5 w-5 text-blue-500" />,
    description: "Genera ejercicios prácticos de programación, algoritmos o cualquier tema técnico.",
    prompt: "Genera un ejercicio práctico sobre",
    placeholder: "Ej: Programación orientada a objetos en Java, algoritmos de ordenamiento, estructuras de datos, etc.",
  },
  {
    id: "quiz",
    name: "Cuestionario",
    icon: <FileQuestion className="h-5 w-5 text-purple-500" />,
    description: "Crea cuestionarios con preguntas y respuestas para evaluar conocimientos.",
    prompt: "Crea un cuestionario con preguntas y respuestas sobre",
    placeholder: "Ej: Bases de datos SQL, redes de computadoras, seguridad informática, etc.",
  },
  {
    id: "concept",
    name: "Explicación de Concepto",
    icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
    description: "Obtén explicaciones detalladas de conceptos técnicos con ejemplos.",
    prompt: "Explica detalladamente el concepto de",
    placeholder: "Ej: Virtualización, microservicios, computación en la nube, inteligencia artificial, etc.",
  },
  {
    id: "project",
    name: "Idea de Proyecto",
    icon: <Cpu className="h-5 w-5 text-green-500" />,
    description: "Genera ideas de proyectos con requisitos y pasos de implementación.",
    prompt: "Genera una idea de proyecto sobre",
    placeholder: "Ej: Aplicación web con React, sistema de gestión con Django, IoT con Arduino, etc.",
  },
]

// Niveles de dificultad
const difficultyLevels = [
  { id: "basic", name: "Básico", description: "Para principiantes o repaso de fundamentos" },
  { id: "intermediate", name: "Intermedio", description: "Para estudiantes con conocimientos previos" },
  { id: "advanced", name: "Avanzado", description: "Para estudiantes con experiencia en el tema" },
]

// Componente para mostrar el HTML de manera segura
const SafeHTML = ({ html }: { html: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} className="prose prose-blue max-w-none" />
}

export default function ChatbotGeneratorContent() {
  const [topic, setTopic] = useState("")
  const [generationType, setGenerationType] = useState(generationTypes[0].id)
  const [difficulty, setDifficulty] = useState("intermediate")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [displayContent, setDisplayContent] = useState("")
  const [formattedContent, setFormattedContent] = useState("")
  const [sessionId, setSessionId] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [randomPromptIdeas, setRandomPromptIdeas] = useState<string[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [typingSpeed] = useState(5) // Aumentado de 3 a 5 para mayor velocidad
  const [shouldStartTyping, setShouldStartTyping] = useState(false)
  const [hasCompletedTyping, setHasCompletedTyping] = useState(false)

  // Referencias para controlar la animación de escritura
  const contentRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentIndexRef = useRef<number>(0)
  const animationCompleteRef = useRef<boolean>(false)

  const router = useRouter()
  const { toast } = useToast()

  // Función para calcular la velocidad de escritura con variación natural
  const getTypingDelay = () => {
    const currentChar = generatedContent[currentIndexRef.current] || ""
    const isPunctuation = [".", ",", "!", "?", ";", ":"].includes(currentChar)

    // Pausa más larga después de puntuación
    if (isPunctuation && currentIndexRef.current > 0) {
      return 20 + Math.random() * 100 // Reducido para mayor velocidad
    }

    // Variación normal para el resto del texto
    return 20 + Math.random() * 20
  }

  // Función para manejar la animación de escritura
  const typeNextChunk = useCallback(() => {
    // Si ya completamos la animación o está pausada, no hacer nada
    if (!isTyping || isPaused || !generatedContent || animationCompleteRef.current) return

    if (currentIndexRef.current < generatedContent.length) {
      // Añadir entre 2-5 caracteres por vez para una escritura más rápida
      const charsToAdd = Math.max(2, Math.floor(Math.random() * typingSpeed))
      const nextIndex = Math.min(currentIndexRef.current + charsToAdd, generatedContent.length)
      const currentText = generatedContent.substring(0, nextIndex)

      setDisplayContent(currentText)
      setFormattedContent(markdownToHtml(currentText))

      currentIndexRef.current = nextIndex

      // Verificar si hemos llegado al final
      if (currentIndexRef.current >= generatedContent.length) {
        // Marcar como completado para evitar reiniciar
        animationCompleteRef.current = true
        setHasCompletedTyping(true)
        setIsTyping(false)
        setIsPaused(false)
        typingTimerRef.current = null
      } else {
        // Continuar la animación
        typingTimerRef.current = setTimeout(typeNextChunk, getTypingDelay())
      }
    } else {
      // Asegurarnos de que todo esté correctamente marcado como completado
      animationCompleteRef.current = true
      setHasCompletedTyping(true)
      setIsTyping(false)
      setIsPaused(false)
      typingTimerRef.current = null
    }
  }, [isTyping, isPaused, generatedContent, typingSpeed])

  // Función para generar ideas de prompts aleatorios
  const generateRandomPromptIdeas = useCallback(() => {
    const ideas: { [key: string]: string[] } = {
      exercise: [
        "Algoritmos de ordenamiento en Python",
        "Programación orientada a objetos en Java",
        "Estructuras de datos en C++",
        "Desarrollo web con React y Node.js",
        "Manipulación de archivos en Python",
      ],
      quiz: [
        "Fundamentos de bases de datos SQL",
        "Redes de computadoras y protocolos",
        "Seguridad informática y criptografía",
        "Sistemas operativos y gestión de procesos",
        "Arquitectura de computadoras",
      ],
      concept: [
        "Virtualización y contenedores",
        "Microservicios y arquitecturas distribuidas",
        "Computación en la nube",
        "Inteligencia artificial y aprendizaje automático",
        "Blockchain y criptomonedas",
      ],
      project: [
        "Aplicación web con React y Firebase",
        "Sistema de gestión con Django y PostgreSQL",
        "Aplicación IoT con Arduino y MQTT",
        "Aplicación móvil con React Native",
        "Sistema de recomendación con machine learning",
      ],
    }

    // Seleccionar 3 ideas aleatorias para el tipo actual
    const currentIdeas = ideas[generationType] || []
    const shuffled = [...currentIdeas].sort(() => 0.5 - Math.random())
    setRandomPromptIdeas(shuffled.slice(0, 3))
  }, [generationType])

  // Función para generar contenido
  const generateContent = async () => {
    if (!topic.trim()) {
      toast({
        variant: "destructive",
        title: "Tema requerido",
        description: "Por favor, especifica un tema para generar contenido.",
      })
      return
    }

    // Limpiar cualquier generación anterior
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
    }

    // Resetear todos los estados relacionados con la animación
    setIsGenerating(true)
    setIsTyping(false)
    setShouldStartTyping(false)
    setIsPaused(false)
    setHasCompletedTyping(false)
    setGeneratedContent("")
    setDisplayContent("")
    setFormattedContent("")
    currentIndexRef.current = 0
    animationCompleteRef.current = false

    try {
      const user = getCurrentUser()

      // Construir el prompt completo
      const selectedType = generationTypes.find((type) => type.id === generationType)
      const selectedDifficulty = difficultyLevels.find((level) => level.id === difficulty)

      let fullPrompt = `${selectedType?.prompt} ${topic}. `
      fullPrompt += `Nivel de dificultad: ${selectedDifficulty?.name}. `

      // Añadir instrucciones específicas según el tipo
      switch (generationType) {
        case "exercise":
          fullPrompt +=
            "Incluye descripción del problema, ejemplos de entrada/salida, pistas y solución. Usa formato markdown."
          break
        case "quiz":
          fullPrompt +=
            "Crea un cuestionario con al menos 5 preguntas de opción múltiple. Incluye las respuestas correctas al final. Usa formato markdown."
          break
        case "concept":
          fullPrompt +=
            "Explica el concepto de forma clara y detallada. Incluye definición, características principales, ejemplos prácticos y aplicaciones. Usa formato markdown."
          break
        case "project":
          fullPrompt +=
            "Genera una idea de proyecto completa con título, descripción, objetivos, tecnologías recomendadas, funcionalidades principales y pasos de implementación. Usa formato markdown."
          break
      }

      // Enviar al chatbot
      const response = await sendChatbotMessage(fullPrompt, sessionId, user?.matricula)

      // Guardar la respuesta
      setGeneratedContent(response.respuesta)

      // Activar la animación de escritura en el siguiente ciclo de renderizado
      setTimeout(() => {
        setShouldStartTyping(true)
      }, 0)

      // Hacer scroll al contenido generado
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollIntoView({ behavior: "smooth" })
        }
      }, 500)
    } catch (error) {
      console.error("Error al generar contenido:", error)

      // Mostrar un toast con información más detallada sobre el error
      let errorMessage = "No se pudo generar el contenido. Por favor, intenta de nuevo más tarde."

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          errorMessage = "La conexión con el servidor ha tardado demasiado. Intenta de nuevo o usa el modo offline."
        } else if (error.response) {
          errorMessage = `Error del servidor: ${error.response.status}. ${error.response.data?.message || ""}`
        } else if (error.request) {
          errorMessage = "No se pudo conectar con el servidor. Verifica tu conexión a internet."
        }
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })

      // Generar contenido offline como fallback
      try {
        const offlineResponse = {
          respuesta:
            "# Modo Offline Activado\n\n" +
            "No se pudo conectar con el servidor. Estoy funcionando en modo offline.\n\n" +
            `## Concepto sobre ${topic}\n\n` +
            "Para obtener contenido personalizado completo, por favor intenta nuevamente cuando " +
            "la conexión al servidor se restablezca.\n\n" +
            "### Mientras tanto, puedes:\n\n" +
            "- Revisar otros temas\n" +
            "- Intentar con un tema más específico\n" +
            "- Verificar tu conexión a internet",
          session_id: sessionId,
        }

        setGeneratedContent(offlineResponse.respuesta)

        // Activar la animación de escritura en el siguiente ciclo de renderizado
        setTimeout(() => {
          setShouldStartTyping(true)
        }, 0)
      } catch (offlineError) {
        console.error("Error al generar contenido offline:", offlineError)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Función para copiar el contenido generado
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    setIsCopied(true)
    toast({
      title: "Contenido copiado",
      description: "El contenido ha sido copiado al portapapeles.",
    })

    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  // Función para descargar el contenido generado
  const downloadContent = () => {
    const element = document.createElement("a")
    const selectedType = generationTypes.find((type) => type.id === generationType)
    const fileName = `${selectedType?.name.toLowerCase().replace(/\s+/g, "-")}-${topic.toLowerCase().replace(/\s+/g, "-")}.md`

    const file = new Blob([generatedContent], { type: "text/markdown" })
    element.href = URL.createObjectURL(file)
    element.download = fileName
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    toast({
      title: "Contenido descargado",
      description: `El archivo ${fileName} ha sido descargado.`,
    })
  }

  // Función para regenerar el contenido
  const regenerateContent = () => {
    generateContent()
  }

  // Función para cancelar la generación
  const cancelGeneration = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
    }

    // Mostrar el contenido completo inmediatamente
    setDisplayContent(generatedContent)
    setFormattedContent(markdownToHtml(generatedContent))

    // Marcar como completado
    animationCompleteRef.current = true
    setHasCompletedTyping(true)
    setIsGenerating(false)
    setIsTyping(false)
    setIsPaused(false)
    setShouldStartTyping(false)

    // Mostrar mensaje de cancelación
    toast({
      title: "Animación cancelada",
      description: "Se ha mostrado el contenido completo.",
    })
  }

  // Función para pausar/reanudar la generación
  const togglePause = () => {
    setIsPaused((prev) => !prev)
  }

  // Inicialización
  useEffect(() => {
    // Generar un nuevo sessionId si no existe
    if (!sessionId) {
      setSessionId(uuidv4())
    }

    // Verificar autenticación al cargar el componente
    if (!isAuthenticated()) {
      toast({
        variant: "destructive",
        title: "Acceso restringido",
        description: "Debes iniciar sesión para acceder al generador IA.",
      })
      router.push("/login")
      return
    }

    // Generar ideas de prompts aleatorios según el tipo seleccionado
    generateRandomPromptIdeas()

    // Limpieza al desmontar
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }
    }
  }, [router, toast, sessionId, generateRandomPromptIdeas])

  // Efecto para actualizar las ideas de prompts cuando cambia el tipo
  useEffect(() => {
    generateRandomPromptIdeas()
  }, [generationType, generateRandomPromptIdeas])

  // Efecto para iniciar la animación de escritura cuando shouldStartTyping cambia a true
  useEffect(() => {
    if (shouldStartTyping && generatedContent && !isTyping && !isPaused && !hasCompletedTyping) {
      currentIndexRef.current = 0
      animationCompleteRef.current = false
      setIsTyping(true)
    }
  }, [shouldStartTyping, generatedContent, isTyping, isPaused, hasCompletedTyping])

  // Efecto para manejar la animación de escritura
  useEffect(() => {
    // Limpiar cualquier temporizador existente
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
    }

    // Solo iniciar la animación si isTyping es true y no hemos completado la animación
    if (isTyping && !isPaused && generatedContent && !animationCompleteRef.current) {
      typeNextChunk()
    }

    // Limpieza
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = null
      }
    }
  }, [isTyping, isPaused, generatedContent, typeNextChunk])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel de configuración */}
      <div className="lg:col-span-1">
        <Card className="border-0 shadow-lg overflow-hidden h-full">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1"></div>
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white">
            <CardTitle className="text-lg flex items-center">
              <motion.div
                animate={{
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "mirror",
                }}
              >
                <Wand2 className="h-5 w-5 mr-2 text-blue-600" />
              </motion.div>
              Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Generación</label>
              <div className="grid grid-cols-2 gap-2">
                {generationTypes.map((type) => (
                  <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setGenerationType(type.id)}
                    className={`cursor-pointer p-3 rounded-lg border ${
                      generationType === type.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      {type.icon}
                      <span className="ml-2 text-sm font-medium">{type.name}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {generationTypes.find((type) => type.id === generationType)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Dificultad</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                {difficultyLevels.find((level) => level.id === difficulty)?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
              <Textarea
                ref={textareaRef}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={generationTypes.find((type) => type.id === generationType)?.placeholder}
                className="min-h-[80px] border-blue-200 focus-visible:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ideas de Temas</label>
              <div className="space-y-2">
                {randomPromptIdeas.map((idea, index) => (
                  <motion.div key={index} whileHover={{ scale: 1.02, x: 3 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="text-xs justify-start h-auto py-2 px-3 text-left w-full bg-gradient-to-r from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 border-blue-200"
                      onClick={() => setTopic(idea)}
                    >
                      {idea}
                    </Button>
                  </motion.div>
                ))}
              </div>
              <div className="mt-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={generateRandomPromptIdeas}
                >
                  <Dices className="h-3 w-3 mr-1" />
                  Generar más ideas
                </Button>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={generateContent}
                disabled={isGenerating || !topic.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar Contenido
                  </>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </div>

      {/* Área de contenido generado */}
      <div className="lg:col-span-2">
        <Card className="border-0 shadow-lg overflow-hidden h-full">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-1"></div>
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, 0, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "mirror",
                    }}
                  >
                    <BrainCircuit className="h-5 w-5 mr-2 text-blue-600" />
                  </motion.div>
                  <motion.div
                    className="absolute -inset-1 rounded-full bg-blue-400 opacity-20"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.2, 0.1, 0.2],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                </div>
                Generador IA
                <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  SysMentor
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={contentRef} className="min-h-[500px] p-6 bg-gradient-to-b from-gray-50 to-white">
              {!generatedContent && !isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <motion.div
                    className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full mb-4"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(79, 70, 229, 0.2)",
                        "0 0 0 15px rgba(79, 70, 229, 0)",
                        "0 0 0 0 rgba(79, 70, 229, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    <BrainCircuit className="h-10 w-10 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Generador Inteligente</h3>
                  <p className="text-gray-600 mb-6">
                    Configura los parámetros y genera contenido personalizado para reforzar tus conocimientos en
                    Ingeniería en Sistemas.
                  </p>
                  <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2 text-blue-600" />
                        Cómo usar el generador
                      </h4>
                      <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
                        <li>Selecciona el tipo de contenido que deseas generar</li>
                        <li>Elige el nivel de dificultad adecuado</li>
                        <li>Especifica el tema sobre el que quieres generar contenido</li>
                        <li>Haz clic en &quot;Generar Contenido&quot;</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {isGenerating && !displayContent ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-8 w-8 rounded-full bg-white"></div>
                        </div>
                      </div>
                      <p className="mt-6 text-lg text-gray-600 animate-pulse">Generando contenido personalizado...</p>
                      <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
                    </div>
                  ) : (
                    <div className="prose prose-blue max-w-none">
                      {formattedContent ? (
                        <div className="min-h-[400px]">
                          <SafeHTML html={formattedContent} />
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap min-h-[400px]">{displayContent}</div>
                      )}

                      {isTyping && (
                        <motion.span
                          className="inline-block w-1 h-4 bg-blue-500 ml-0.5"
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8 }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          {(displayContent || isGenerating) && (
            <CardFooter className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-wrap gap-2 w-full justify-between">
                <div className="flex gap-2">
                  {isTyping && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50"
                        onClick={togglePause}
                      >
                        {isPaused ? (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Reanudar
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={cancelGeneration}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {displayContent && !isTyping && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={regenerateContent}
                        disabled={isGenerating}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Regenerar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={copyToClipboard}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={downloadContent}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
