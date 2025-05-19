"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, X } from "lucide-react"
import { actualizarTema, type Foro } from "@/lib/foros"

// Esquema de validación
const formSchema = z.object({
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

interface EditarForoFormProps {
  tema: Foro
  onCancel: () => void
  onSuccess: (temaActualizado: Foro) => void
}

export default function EditarForoForm({ tema, onCancel, onSuccess }: EditarForoFormProps) {
  const [enviando, setEnviando] = useState(false)
  const { toast } = useToast()

  // Formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: tema.titulo,
      contenido: tema.contenido,
    },
  })

  // Función para enviar el formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setEnviando(true)

      const temaActualizado = await actualizarTema(tema.id, {
        titulo: values.titulo,
        contenido: values.contenido,
      })

      if (temaActualizado) {
        toast({
          title: "Tema actualizado",
          description: "Tu tema ha sido actualizado correctamente.",
        })

        onSuccess(temaActualizado)
      }
    } catch (error) {
      console.error("Error al actualizar tema:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el tema. Por favor, intenta de nuevo.",
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar tema</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
