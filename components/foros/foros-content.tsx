"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Plus,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Search,
  Tag,
  RefreshCw,
  Zap,
  TrendingUp,
  Clock,
  BookOpen,
  Users,
  Sparkles,
  Code,
  Database,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { isAuthenticated } from "@/lib/auth"
import { obtenerTemas, type Foro } from "@/lib/foros"
import { motion } from "framer-motion"

export default function ForosContent() {
  const [temas, setTemas] = useState<Foro[]>([])
  const [materias, setMaterias] = useState<{ id: number; nombre: string }[]>([])
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string>("todas")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("recientes")
  const router = useRouter()
  const { toast } = useToast()

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    if (!isAuthenticated()) {
      toast({
        variant: "destructive",
        title: "Acceso restringido",
        description: "Debes iniciar sesión para acceder a los foros.",
      })
      router.push("/login")
      return
    }

    // Cargar los temas del foro
    cargarTemas()
  }, [router, toast])

  // Cargar temas cuando cambia la materia seleccionada o la pestaña activa
  useEffect(() => {
    if (isAuthenticated()) {
      cargarTemas()
    }
  }, [materiaSeleccionada, activeTab])

  // Función para cargar los temas del foro
  const cargarTemas = async () => {
    try {
      setLoading(true)
      const materiaId = materiaSeleccionada !== "todas" ? Number.parseInt(materiaSeleccionada) : undefined
      const temasData = await obtenerTemas(materiaId)

      // Ordenar según la pestaña activa
      const temasFiltrados = [...temasData]

      if (activeTab === "recientes") {
        temasFiltrados.sort((a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime())
      } else if (activeTab === "populares") {
        temasFiltrados.sort((a, b) => b.likes - b.dislikes - (a.likes - a.dislikes))
      } else if (activeTab === "activos") {
        // Aquí podríamos ordenar por actividad reciente si tuviéramos esa información
        // Por ahora, simplemente ordenamos por fecha
        temasFiltrados.sort((a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime())
      }

      setTemas(temasFiltrados)

      // Extraer materias únicas para el filtro
      const materiasUnicas = new Map<number, string>()
      temasData.forEach((tema) => {
        if (tema.materia && tema.materia_id) {
          materiasUnicas.set(tema.materia_id, tema.materia.nombre)
        }
      })

      const materiasArray = Array.from(materiasUnicas).map(([id, nombre]) => ({ id, nombre }))
      setMaterias(materiasArray)

      setError(null)
    } catch (err) {
      console.error("Error al cargar temas:", err)
      setError("No se pudieron cargar los temas del foro. Por favor, intenta de nuevo más tarde.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los temas del foro.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar temas según la búsqueda
  const temasFiltrados = temas.filter(
    (tema) =>
      tema.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tema.contenido.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Función para formatear la fecha
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Función para navegar al detalle de un tema
  const verDetalleTema = (id: number) => {
    router.push(`/foros/${id}`)
  }

  // Función para crear un nuevo tema
  const crearNuevoTema = () => {
    router.push("/foros/nuevo")
  }

  // Función para obtener el icono de la materia
  const getMateriaIcon = (nombreMateria: string) => {
    const nombre = nombreMateria.toLowerCase()
    if (nombre.includes("programación") || nombre.includes("desarrollo")) {
      return <Code className="h-4 w-4" />
    } else if (nombre.includes("datos") || nombre.includes("base")) {
      return <Database className="h-4 w-4" />
    } else if (nombre.includes("web") || nombre.includes("internet")) {
      return <Globe className="h-4 w-4" />
    } else {
      return <BookOpen className="h-4 w-4" />
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
        <p className="mt-6 text-lg text-gray-600 animate-pulse">Cargando temas del foro...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center max-w-2xl mx-auto">
        <p className="text-red-600 text-lg">{error}</p>
        <Button onClick={cargarTemas} className="mt-6 bg-red-600 hover:bg-red-700 text-white">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabecera con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Total de temas</p>
              <p className="text-3xl font-bold">{temas.length}</p>
            </div>
            <MessageSquare className="h-10 w-10 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Materias activas</p>
              <p className="text-3xl font-bold">{materias.length}</p>
            </div>
            <BookOpen className="h-10 w-10 opacity-80" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">Comunidad</p>
              <p className="text-3xl font-bold">Activa</p>
            </div>
            <Users className="h-10 w-10 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Barra de acciones */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button onClick={crearNuevoTema} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Crear nuevo tema
            </Button>

            <Button variant="outline" onClick={cargarTemas} className="w-10 p-0 md:w-10">
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Actualizar</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar temas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-[300px]"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Tabs defaultValue="recientes" className="w-full" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
              <TabsTrigger value="recientes" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Recientes</span>
              </TabsTrigger>
              <TabsTrigger value="populares" className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Populares</span>
              </TabsTrigger>
              <TabsTrigger value="activos" className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                <span>Activos</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Tag className="h-4 w-4 text-gray-500" />
            <Select value={materiaSeleccionada} onValueChange={(value) => setMateriaSeleccionada(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por materia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las materias</SelectItem>
                {materias.map((materia) => (
                  <SelectItem key={materia.id} value={materia.id.toString()}>
                    {materia.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de temas */}
      {temasFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-100">
          <MessageSquare className="h-12 w-12 text-blue-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No hay temas disponibles en el foro.</p>
          <Button onClick={crearNuevoTema} className="bg-blue-600 hover:bg-blue-700">
            <Sparkles className="mr-2 h-4 w-4" />
            Crear el primer tema
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {temasFiltrados.map((tema, index) => (
            <motion.div
              key={tema.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="cursor-pointer"
              onClick={() => verDetalleTema(tema.id)}
            >
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-white overflow-hidden">
                <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-blue-50 to-transparent opacity-50"></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl hover:text-blue-600 transition-colors flex items-center">
                        {tema.titulo}
                        {index < 3 && (
                          <Badge className="ml-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white border-0">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Destacado
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <span className="font-medium">
                          {tema.usuario ? `${tema.usuario.nombre} ${tema.usuario.apellido_paterno}` : tema.matricula}
                        </span>
                        <span className="mx-2">•</span>
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatearFecha(tema.fecha_publicacion)}</span>
                      </div>
                    </div>
                    {tema.materia && (
                      <Badge variant="outline" className="bg-blue-50 flex items-center gap-1">
                        {getMateriaIcon(tema.materia.nombre)}
                        {tema.materia.nombre}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-gray-700 line-clamp-2">{tema.contenido}</p>
                </CardContent>
                <CardFooter className="pt-2 text-sm text-gray-500 flex justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <ThumbsUp className="h-4 w-4 mr-1 text-green-500" />
                      <span>{tema.likes}</span>
                    </div>
                    <div className="flex items-center">
                      <ThumbsDown className="h-4 w-4 mr-1 text-red-500" />
                      <span>{tema.dislikes}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-1 text-blue-500" />
                    <span>Ver comentarios</span>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
