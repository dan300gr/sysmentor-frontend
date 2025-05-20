"use client"
import { BookOpen, Folder, FolderOpen, GraduationCap, Code, Database, Globe, Server, Cpu } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

interface Semestre {
  id: number
  nombre: string
}

interface Materia {
  id: number
  nombre: string
  descripcion: string | null
  semestre_id: number
}

interface SemestreAccordionProps {
  semestre: Semestre
  materias: Materia[]
  semestreNumero: number
}

// Función para determinar el icono de la materia basado en su nombre
const getMateriaIcon = (nombre: string) => {
  const nombreLower = nombre.toLowerCase()

  if (nombreLower.includes("programación") || nombreLower.includes("desarrollo") || nombreLower.includes("software")) {
    return <Code className="h-5 w-5 text-purple-500" />
  } else if (
    nombreLower.includes("datos") ||
    nombreLower.includes("base de datos") ||
    nombreLower.includes("información")
  ) {
    return <Database className="h-5 w-5 text-green-500" />
  } else if (nombreLower.includes("web") || nombreLower.includes("internet") || nombreLower.includes("red")) {
    return <Globe className="h-5 w-5 text-blue-500" />
  } else if (nombreLower.includes("sistema") || nombreLower.includes("operativo") || nombreLower.includes("servidor")) {
    return <Server className="h-5 w-5 text-orange-500" />
  } else if (
    nombreLower.includes("hardware") ||
    nombreLower.includes("arquitectura") ||
    nombreLower.includes("computadora")
  ) {
    return <Cpu className="h-5 w-5 text-red-500" />
  } else {
    return <BookOpen className="h-5 w-5 text-blue-500" />
  }
}

// Colores para los semestres según su número
const getSemestreColor = () => {
  // Usar un solo color para todos los semestres por estética y seriedad
  return "from-blue-600 to-blue-700"
}

export default function SemestreAccordion({ semestre, materias, semestreNumero }: SemestreAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const bgGradient = getSemestreColor()
  const router = useRouter()

  // Función para navegar a la página de temas de la materia
  const handleMateriaClick = (materiaId: number) => {
    router.push(`/materia/${materiaId}`)
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="rounded-xl overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300"
      onValueChange={(value) => setIsOpen(!!value)}
    >
      <AccordionItem value={`semestre-${semestre.id}`} className="border-0">
        <AccordionTrigger
          className={`px-6 py-4 bg-gradient-to-r ${bgGradient} hover:brightness-110 transition-all duration-300`}
        >
          <div className="flex items-center text-white">
            {isOpen ? <FolderOpen className="h-6 w-6 mr-3 animate-pulse" /> : <Folder className="h-6 w-6 mr-3" />}
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-xl font-bold">{semestre.nombre}</span>
              <div className="flex items-center sm:ml-3 mt-1 sm:mt-0">
                <GraduationCap className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">
                  {materias.length} {materias.length === 1 ? "materia" : "materias"}
                </span>
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="bg-white">
          <div className="p-6">
            {materias.length === 0 ? (
              <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                No hay materias disponibles para este semestre.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {materias.map((materia, index) => (
                  <motion.div
                    key={materia.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => handleMateriaClick(materia.id)}
                    className="cursor-pointer"
                  >
                    <Card className="overflow-hidden h-full hover:shadow-md transition-shadow border-l-4 hover:border-l-8 border-l-blue-500 hover:translate-x-1 duration-300">
                      <CardHeader className="bg-gradient-to-r from-gray-50 to-white pb-3">
                        <div className="flex items-start">
                          {getMateriaIcon(materia.nombre)}
                          <CardTitle className="text-lg ml-2">{materia.nombre}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {materia.descripcion ? (
                          <CardDescription className="text-gray-700">{materia.descripcion}</CardDescription>
                        ) : (
                          <CardDescription className="text-gray-500 italic">
                            No hay descripción disponible.
                          </CardDescription>
                        )}
                        <div className="mt-4 text-blue-600 text-sm font-medium flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          Ver temas semanales
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
