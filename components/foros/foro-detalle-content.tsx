"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Loader2,
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  AlertTriangle,
  User,
  Clock,
  Share2,
  Bookmark,
  BookOpen,
  Eye,
  Heart,
  BarChart,
  Sparkles,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { isAuthenticated, getCurrentUser } from "@/lib/auth"
import {
  obtenerTema,
  obtenerComentarios,
  crearComentario,
  actualizarComentario,
  eliminarComentario,
  eliminarTema,
  reaccionar,
  type Foro,
  type Comentario,
  type TipoReaccion,
} from "@/lib/foros"
import { motion, AnimatePresence } from "framer-motion"
import EditarForoForm from "@/components/foros/editar-foro-form"

export default function ForoDetalleContent() {
  const params = useParams()
  const foroId = Number.parseInt(params?.id as string)

  const [tema, setTema] = useState<Foro | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [nuevoComentario, setNuevoComentario] = useState("")
  const [comentarioEditando, setComentarioEditando] = useState<{ id: number; texto: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mostrarDialogoEliminar, setMostrarDialogoEliminar] = useState(false)
  const [mostrarDialogoEliminarComentario, setMostrarDialogoEliminarComentario] = useState<number | null>(null)
  const [mostrarFormEditar, setMostrarFormEditar] = useState(false)
  const comentariosEndRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const { toast } = useToast()
  const usuario = getCurrentUser()

  // Verificar autenticación y cargar datos
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

    if (isNaN(foroId)) {
      setError("ID de tema inválido")
      setLoading(false)
      return
    }

    // Cargar el tema y sus comentarios
    cargarTema()
  }, [foroId, router, toast])

  // Función para cargar el tema y sus comentarios
  const cargarTema = async () => {
    try {
      setLoading(true)

      // Cargar tema
      const temaData = await obtenerTema(foroId)
      if (!temaData) {
        setError("El tema no existe o ha sido eliminado")
        return
      }
      setTema(temaData)

      // Cargar comentarios
      const comentariosData = await obtenerComentarios(foroId)
      setComentarios(comentariosData)

      setError(null)
    } catch (err) {
      console.error("Error al cargar tema:", err)
      setError("No se pudo cargar el tema. Por favor, intenta de nuevo más tarde.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el tema del foro.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para enviar un nuevo comentario
  const enviarComentario = async () => {
    if (!nuevoComentario.trim()) return

    try {
      setEnviandoComentario(true)

      const comentarioCreado = await crearComentario({
        foro_id: foroId,
        comentario: nuevoComentario,
      })

      if (comentarioCreado) {
        // Añadir información del usuario al comentario creado
        const comentarioConUsuario = {
          ...comentarioCreado,
          usuario: usuario
            ? {
                nombre: usuario.nombre,
                apellido_paterno: usuario.apellido_paterno,
                apellido_materno: usuario.apellido_materno,
              }
            : undefined,
        }

        setComentarios([...comentarios, comentarioConUsuario])
        setNuevoComentario("")

        // Scroll al final de los comentarios
        setTimeout(() => {
          comentariosEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)

        toast({
          title: "Comentario enviado",
          description: "Tu comentario ha sido publicado correctamente.",
        })
      }
    } catch (err) {
      console.error("Error al enviar comentario:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el comentario. Por favor, intenta de nuevo.",
      })
    } finally {
      setEnviandoComentario(false)
    }
  }

  // Función para actualizar un comentario
  const guardarEdicionComentario = async () => {
    if (!comentarioEditando) return

    try {
      const comentarioActualizado = await actualizarComentario(comentarioEditando.id, {
        comentario: comentarioEditando.texto,
      })

      if (comentarioActualizado) {
        // Actualizar el comentario en la lista
        setComentarios(
          comentarios.map((c) => (c.id === comentarioEditando.id ? { ...c, comentario: comentarioEditando.texto } : c)),
        )

        setComentarioEditando(null)

        toast({
          title: "Comentario actualizado",
          description: "Tu comentario ha sido actualizado correctamente.",
        })
      }
    } catch (err) {
      console.error("Error al actualizar comentario:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el comentario. Por favor, intenta de nuevo.",
      })
    }
  }

  // Función para eliminar un comentario
  const confirmarEliminarComentario = async () => {
    if (mostrarDialogoEliminarComentario === null) return

    try {
      const eliminado = await eliminarComentario(mostrarDialogoEliminarComentario)

      if (eliminado) {
        // Eliminar el comentario de la lista
        setComentarios(comentarios.filter((c) => c.id !== mostrarDialogoEliminarComentario))

        setMostrarDialogoEliminarComentario(null)

        toast({
          title: "Comentario eliminado",
          description: "El comentario ha sido eliminado correctamente.",
        })
      }
    } catch (err) {
      console.error("Error al eliminar comentario:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el comentario. Por favor, intenta de nuevo.",
      })
    }
  }

  // Función para eliminar el tema
  const confirmarEliminarTema = async () => {
    try {
      const eliminado = await eliminarTema(foroId)

      if (eliminado) {
        setMostrarDialogoEliminar(false)

        toast({
          title: "Tema eliminado",
          description: "El tema ha sido eliminado correctamente.",
        })

        // Redirigir a la lista de temas
        router.push("/foros")
      }
    } catch (err) {
      console.error("Error al eliminar tema:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el tema. Por favor, intenta de nuevo.",
      })
    }
  }

  // Función para reaccionar al tema
  const reaccionarAlTema = async (tipo: TipoReaccion) => {
    if (!tema) return

    try {
      await reaccionar(foroId, tipo)

      // Actualizar contadores localmente
      if (tipo === "like") {
        setTema({ ...tema, likes: tema.likes + 1 })
      } else {
        setTema({ ...tema, dislikes: tema.dislikes + 1 })
      }

      toast({
        title: "Reacción registrada",
        description: tipo === "like" ? "Has dado like al tema." : "Has dado dislike al tema.",
      })
    } catch (error: unknown) {
      console.error("Error al reaccionar:", error)

      // Mostrar mensaje de error más específico si está disponible
      const errorMessage =
        error instanceof Error && error.message.includes("Error al reaccionar:")
          ? error.message
          : "No se pudo registrar tu reacción. Por favor, intenta de nuevo."

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  // Función para formatear la fecha
  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    return fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Función para volver a la lista de temas
  const volverAForos = () => {
    router.push("/foros")
  }

  // Verificar si el usuario es el autor del tema
  const esAutorTema = tema && usuario && tema.matricula === usuario.matricula

  // Verificar si el usuario es el autor de un comentario
  const esAutorComentario = (comentario: Comentario) => {
    return usuario && comentario.matricula === usuario.matricula
  }

  // Calcular el sentimiento del tema basado en likes y dislikes
  const calcularSentimiento = () => {
    if (!tema) return 50
    const total = tema.likes + tema.dislikes
    if (total === 0) return 50
    return Math.round((tema.likes / total) * 100)
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
        <p className="mt-6 text-lg text-gray-600 animate-pulse">Cargando tema...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center max-w-2xl mx-auto">
        <p className="text-red-600 text-lg">{error}</p>
        <div className="mt-6 flex justify-center space-x-4">
          <Button onClick={volverAForos} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a foros
          </Button>
          {!error.includes("no existe") && (
            <Button onClick={cargarTema} className="bg-red-600 hover:bg-red-700 text-white">
              Reintentar
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!tema) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No se encontró el tema solicitado.</p>
        <Button onClick={volverAForos} variant="outline" className="mt-6 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver a foros
        </Button>
      </div>
    )
  }

  const sentimiento = calcularSentimiento()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Botón para volver */}
      <Button onClick={volverAForos} variant="outline" className="mb-6 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver a foros
      </Button>

      {/* Mostrar formulario de edición o el tema */}
      {mostrarFormEditar ? (
        <div className="mb-8">
          <EditarForoForm
            tema={tema}
            onCancel={() => setMostrarFormEditar(false)}
            onSuccess={(temaActualizado) => {
              setTema(temaActualizado)
              setMostrarFormEditar(false)
              toast({
                title: "Tema actualizado",
                description: "El tema ha sido actualizado correctamente.",
              })
            }}
          />
        </div>
      ) : (
        <div className="mb-8">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3"></div>
            <CardHeader className="relative">
              <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-blue-50 to-transparent opacity-50"></div>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold text-blue-800">{tema.titulo}</CardTitle>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <div className="bg-blue-100 p-1 rounded-full mr-2">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-medium">
                      {tema.usuario ? `${tema.usuario.nombre} ${tema.usuario.apellido_paterno}` : tema.matricula}
                    </span>
                    <span className="mx-2">•</span>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatearFecha(tema.fecha_publicacion)}</span>
                  </div>
                </div>
                {tema.materia && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {tema.materia.nombre}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{tema.contenido}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Visualizaciones</p>
                      <p className="font-semibold">{Math.floor(Math.random() * 100) + 10}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Comentarios</p>
                      <p className="font-semibold">{comentarios.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <BarChart className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Sentimiento</p>
                      <div className="w-24 mt-1">
                        <Progress value={sentimiento} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-green-600 hover:bg-green-50 hover:text-green-700"
                  onClick={() => reaccionarAlTema("like")}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span>{tema.likes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => reaccionarAlTema("dislike")}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  <span>{tema.dislikes}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  <span>Compartir</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                >
                  <Bookmark className="h-4 w-4 mr-1" />
                  <span>Guardar</span>
                </Button>
              </div>
              {esAutorTema && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => setMostrarFormEditar(true)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setMostrarDialogoEliminar(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span>Eliminar</span>
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Sección de comentarios */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          Comentarios ({comentarios.length})
        </h2>

        {comentarios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-100">
            <MessageSquare className="h-12 w-12 text-blue-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay comentarios aún. ¡Sé el primero en comentar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {comentarios.map((comentario, index) => (
                <motion.div
                  key={comentario.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-l-2 border-l-blue-300 hover:shadow-md transition-all duration-300">
                    <CardHeader className="py-3 bg-gradient-to-r from-blue-50 to-white">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">
                            {comentario.usuario ? comentario.usuario.nombre.charAt(0) : "U"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {comentario.usuario
                                ? `${comentario.usuario.nombre} ${comentario.usuario.apellido_paterno}`
                                : comentario.matricula}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatearFecha(comentario.fecha_comentario)}
                            </p>
                          </div>
                        </div>
                        {esAutorComentario(comentario) && (
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                              onClick={() =>
                                setComentarioEditando({
                                  id: comentario.id,
                                  texto: comentario.comentario,
                                })
                              }
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => setMostrarDialogoEliminarComentario(comentario.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="py-3">
                      {comentarioEditando && comentarioEditando.id === comentario.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={comentarioEditando.texto}
                            onChange={(e) =>
                              setComentarioEditando({
                                ...comentarioEditando,
                                texto: e.target.value,
                              })
                            }
                            className="min-h-[100px] border-blue-200 focus-visible:ring-blue-500"
                          />
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setComentarioEditando(null)}>
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={guardarEdicionComentario}
                            >
                              Guardar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-line">{comentario.comentario}</p>
                      )}
                    </CardContent>
                    <CardFooter className="py-2 text-xs text-gray-500 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:bg-blue-50">
                          <Heart className="h-3 w-3 mr-1" />
                          <span>Me gusta</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-blue-600 hover:bg-blue-50">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          <span>Responder</span>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={comentariosEndRef} />
          </div>
        )}
      </div>

      {/* Formulario para añadir comentario */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
            Añadir un comentario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Escribe tu comentario aquí..."
            value={nuevoComentario}
            onChange={(e) => setNuevoComentario(e.target.value)}
            className="min-h-[120px] border-blue-200 focus-visible:ring-blue-500"
          />
        </CardContent>
        <CardFooter className="flex justify-end bg-gray-50 border-t">
          <Button
            onClick={enviarComentario}
            disabled={!nuevoComentario.trim() || enviandoComentario}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {enviandoComentario ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Enviar comentario
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Diálogo para confirmar eliminación del tema */}
      <Dialog open={mostrarDialogoEliminar} onOpenChange={setMostrarDialogoEliminar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este tema? Esta acción no se puede deshacer y se eliminarán todos los
              comentarios asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogoEliminar(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarTema}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para confirmar eliminación de comentario */}
      <Dialog
        open={mostrarDialogoEliminarComentario !== null}
        onOpenChange={() => setMostrarDialogoEliminarComentario(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialogoEliminarComentario(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarEliminarComentario}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
