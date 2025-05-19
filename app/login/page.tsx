import LoginForm from "@/components/auth/login-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Iniciar Sesión | SysMentor",
  description: "Accede a tu cuenta de SysMentor para continuar tu aprendizaje",
}

export default function LoginPage() {
  return (
    <div className="container relative flex-col items-center justify-center min-h-screen grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-blue-600" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          SysMentor
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "SysMentor ha transformado mi experiencia de aprendizaje en Ingeniería en Sistemas. Los recursos
              interactivos y el chatbot me han ayudado a comprender conceptos complejos de manera sencilla."
            </p>
            <footer className="text-sm">Estudiante de Ingeniería en Sistemas</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Iniciar Sesión</h1>
            <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder a tu cuenta</p>
          </div>
          <LoginForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Al iniciar sesión, aceptas nuestros{" "}
            <a href="/terminos" className="underline underline-offset-4 hover:text-primary">
              Términos de servicio
            </a>{" "}
            y{" "}
            <a href="/privacidad" className="underline underline-offset-4 hover:text-primary">
              Política de privacidad
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
