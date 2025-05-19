"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send, X, BookOpen, Sparkles, Lightbulb, HelpCircle, MessageSquare } from "lucide-react"
import { isAuthenticated, createAuthClient } from "@/lib/auth"
import { crearTema } from "@/lib/foros"

// Interfaz para materias
interface Materia {
  id: number
  nombre: string
}

// Esquema de validación
const formSchema = z.object({
  materia_id: z.string({
    required_error: "Debes seleccionar una materia",
  }),
  titulo: z
    .string()
    .min(5, {
      message: "El título debe tener al menos 5 caracteres",
    })
    .max(255, {
      message: "El título no puede tener más de 255 caracteres",
    }),
  contenido: z.string().min(10, {
    message: "El contenido debe tener al menos 10 caracteres",
  }),
})

export default function NuevoForoForm() {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [cargandoMaterias, setCargandoMaterias] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materia_id: "",
      titulo: "",
      contenido: "",
    },
  })

  // Verificar autenticación y cargar materias
  useEffect(() => {
    if (!isAuthenticated()) {
      toast({
        variant: "destructive",
        title: "Acceso restringido",
        description: "Debes iniciar sesión para crear un tema en el foro.",
      })
      router.push("/login")
      return
    }

    // Cargar materias
    const cargarMaterias = async () => {
      try {
        setCargandoMaterias(true)
        const authClient = createAuthClient()
        const response = await authClient.get("/materias")
        setMaterias(response.data)
      } catch (error) {
        console.error("Error al cargar materias:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las materias. Por favor, intenta de nuevo.",
        })
      } finally {
        setCargandoMaterias(false)
      }
    }

    cargarMaterias()
  }, [router, toast])

  // Función para enviar el formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setEnviando(true)

      const temaCreado = await crearTema({
        materia_id: Number.parseInt(values.materia_id),
        titulo: values.titulo,
        contenido: values.contenido,
      })

      if (temaCreado) {
        toast({
          title: "Tema creado",
          description: "Tu tema ha sido publicado correctamente.",
        })

        // Redirigir al detalle del tema creado
        router.push(`/foros/${temaCreado.id}`)
      }
    } catch (error) {
      console.error("Error al crear tema:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el tema. Por favor, intenta de nuevo.",
      })
    } finally {
      setEnviando(false)
    }
  }

  // Función para cancelar y volver a la lista de temas
  const cancelar = () => {
    router.push("/foros")
  }

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3"></div>
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold flex items-center text-blue-800">
          <Sparkles className="h-6 w-6 mr-2 text-blue-600" />
          Crear nuevo tema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg flex items-start">
            <Lightbulb className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Comparte conocimiento</h3>
              <p className="text-xs text-gray-600 mt-1">
                Ayuda a otros estudiantes compartiendo tus conocimientos y experiencias.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex items-start">
            <HelpCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Resuelve dudas</h3>
              <p className="text-xs text-gray-600 mt-1">
                Plantea tus preguntas de forma clara para obtener mejores respuestas.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex items-start">
            <MessageSquare className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Participa activamente</h3>
              <p className="text-xs text-gray-600 mt-1">Comenta en otros temas y mantén viva la comunidad académica.</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="materia_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-800 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                    Materia
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-blue-200 focus:ring-blue-500">
                        <SelectValue placeholder="Selecciona una materia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cargandoMaterias ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Cargando materias...
                          </div>
                        </SelectItem>
                      ) : (
                        materias.map((materia) => (
                          <SelectItem key={materia.id} value={materia.id.toString()}>
                            {materia.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-800">Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Escribe un título descriptivo para tu tema"
                      {...field}
                      className="border-blue-200 focus-visible:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contenido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-800">Contenido</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe tu tema, pregunta o aporte en detalle..."
                      className="min-h-[200px] border-blue-200 focus-visible:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-4 bg-gray-50 border-t">
        <Button type="button" variant="outline" onClick={cancelar} className="border-gray-300">
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          disabled={enviando}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {enviando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publicando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Publicar tema
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
