"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"
import axios from "axios"
import Link from "next/link"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-sysmentor.onrender.com"

// Interfaz para los semestres según la API real
interface Semestre {
  id: number
  nombre: string
}

const formSchema = z
  .object({
    matricula: z.string().regex(/^[Tt][Ii]\d{5}$/, {
      message: "La matrícula debe comenzar con TI seguido de 5 números (ejemplo: TI43086)",
    }),
    nombre: z.string().min(2, {
      message: "El nombre debe tener al menos 2 caracteres",
    }),
    apellido_paterno: z.string().min(2, {
      message: "El apellido paterno debe tener al menos 2 caracteres",
    }),
    apellido_materno: z.string().min(2, {
      message: "El apellido materno debe tener al menos 2 caracteres",
    }),
    correo: z.string().email({
      message: "Ingresa un correo electrónico válido",
    }),
    contrasena: z.string().min(6, {
      message: "La contraseña debe tener al menos 6 caracteres",
    }),
    confirmar_contrasena: z.string().min(6, {
      message: "La confirmación de contraseña debe tener al menos 6 caracteres",
    }),
    semestre_id: z.string({
      required_error: "Selecciona un semestre",
    }),
  })
  .refine((data) => data.contrasena === data.confirmar_contrasena, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar_contrasena"],
  })

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [semestres, setSemestres] = useState<Semestre[]>([])
  const [loadingSemestres, setLoadingSemestres] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Cargar los semestres al montar el componente
  useEffect(() => {
    const fetchSemestres = async () => {
      try {
        const response = await axios.get<Semestre[]>(`${API_URL}/api/semestres`)
        console.log("Semestres cargados:", response.data)
        setSemestres(response.data)
      } catch (error) {
        console.error("Error al cargar semestres:", error)
        // Si no podemos cargar los semestres, usamos algunos por defecto
        setSemestres([
          { id: 1, nombre: "Primer Semestre" },
          { id: 2, nombre: "Segundo Semestre" },
          { id: 3, nombre: "Tercer Semestre" },
          { id: 4, nombre: "Cuarto Semestre" },
          { id: 5, nombre: "Quinto Semestre" },
          { id: 6, nombre: "Sexto Semestre" },
          { id: 7, nombre: "Séptimo Semestre" },
          { id: 8, nombre: "Octavo Semestre" },
          { id: 9, nombre: "Noveno Semestre" },
        ])
      } finally {
        setLoadingSemestres(false)
      }
    }

    fetchSemestres()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matricula: "",
      nombre: "",
      apellido_paterno: "",
      apellido_materno: "",
      correo: "",
      contrasena: "",
      confirmar_contrasena: "",
      semestre_id: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Eliminar confirmar_contrasena antes de enviar
      const { confirmar_contrasena, ...userData } = values

      // Crear el objeto con los campos exactos que espera la API
      const apiData = {
        matricula: userData.matricula,
        nombre: userData.nombre,
        apellido_paterno: userData.apellido_paterno,
        apellido_materno: userData.apellido_materno,
        correo: userData.correo,
        contrasena: userData.contrasena,
        rol: "estudiante", // Por defecto es estudiante
        semestre_id: Number.parseInt(userData.semestre_id), // Convertir a número
      }

      console.log("Enviando datos de registro:", apiData)

      // Enviar como JSON
      const response = await axios.post(`${API_URL}/api/usuarios`, apiData, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("Respuesta del servidor:", response.data)

      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.",
      })

      // Redirigir al usuario a la página de inicio de sesión
      router.push("/login")
    } catch (error: any) {
      console.error("Error de registro:", error)

      // Mostrar detalles completos del error para depuración
      if (error.response) {
        console.error("Respuesta del servidor:", error.response.status, error.response.data)
      }

      let errorMessage = "Error al crear la cuenta. Por favor, intenta de nuevo."

      // Manejar errores específicos de la API
      if (error.response) {
        if (error.response.status === 400) {
          if (error.response.data.detail && typeof error.response.data.detail === "string") {
            if (error.response.data.detail.includes("matrícula")) {
              errorMessage = "La matrícula ya está registrada."
            } else if (error.response.data.detail.includes("correo")) {
              errorMessage = "El correo electrónico ya está registrado."
            } else {
              errorMessage = error.response.data.detail
            }
          }
        } else if (error.response.status === 422) {
          errorMessage = "Datos de registro inválidos. Verifica la información proporcionada."
          if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
            const firstError = error.response.data.detail[0]
            if (firstError && firstError.msg) {
              errorMessage = `${firstError.msg} (campo: ${firstError.loc ? firstError.loc.join(".") : "desconocido"})`
            }
          }
        }
      }

      toast({
        variant: "destructive",
        title: "Error de registro",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Juan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="apellido_paterno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido Paterno</FormLabel>
                <FormControl>
                  <Input placeholder="Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apellido_materno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido Materno</FormLabel>
                <FormControl>
                  <Input placeholder="García" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="correo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ejemplo@correo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="semestre_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semestre</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu semestre actual" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loadingSemestres ? (
                    <SelectItem value="loading" disabled>
                      Cargando semestres...
                    </SelectItem>
                  ) : (
                    semestres.map((semestre) => (
                      <SelectItem key={semestre.id} value={semestre.id.toString()}>
                        {semestre.nombre}
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
        <FormField
          control={form.control}
          name="confirmar_contrasena"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="******" {...field} />
                </FormControl>
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={toggleConfirmPasswordVisibility}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              Registrando...
            </>
          ) : (
            "Registrarse"
          )}
        </Button>
        <div className="text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </form>
    </Form>
  )
}
