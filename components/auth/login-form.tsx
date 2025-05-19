"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { loginUser } from "@/lib/auth"

const formSchema = z.object({
  matricula: z.string().regex(/^[Tt][Ii]\d{5}$/, {
    message: "La matrícula debe comenzar con TI seguido de 5 números (ejemplo: TI43086)",
  }),
  contrasena: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  }),
})

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matricula: "",
      contrasena: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const { token, user } = await loginUser(values.matricula, values.contrasena)

      // Guardar el token y la información del usuario en localStorage
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))

      // Disparar un evento para notificar cambios en localStorage
      window.dispatchEvent(new Event("storage"))

      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${user.nombre || "Usuario"}!`,
      })

      // Redirigir al usuario a la página principal
      router.push("/")
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error)

      let errorMessage = "Matrícula o contraseña incorrecta. Por favor, intenta de nuevo."

      // Si hay un mensaje de error más específico, mostrarlo
      if (error.message && error.message.includes("Error al iniciar sesión:")) {
        try {
          const errorData = JSON.parse(error.message.replace("Error al iniciar sesión:", "").trim())
          if (errorData.detail) {
            // Si detail es un array, mostrar solo el primer mensaje
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail[0].msg || errorMessage
            } else {
              errorMessage = errorData.detail
            }
          }
        } catch (e) {
          // Si no se puede parsear el mensaje, usar el mensaje genérico
        }
      }

      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="matricula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matrícula</FormLabel>
              <FormControl>
                <Input placeholder="TI43086" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                La matrícula debe comenzar con TI seguido de 5 números (ejemplo: TI43086)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contrasena"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showPassword ? "text" : "password"} placeholder="******" {...field} />
                </FormControl>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
      </form>
    </Form>
  )
}
