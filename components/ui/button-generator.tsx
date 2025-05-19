"use client"

import type React from "react"

import { type ButtonHTMLAttributes, forwardRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GeneratorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  text?: string
}

const GeneratorButton = forwardRef<HTMLButtonElement, GeneratorButtonProps>(
  ({ className, variant = "default", size = "default", showIcon = true, text = "Generador IA", ...props }, ref) => {
    const router = useRouter()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      router.push("/chatbot")
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        onClick={handleClick}
        className={cn(
          "relative",
          variant === "default" &&
            "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
          className,
        )}
        {...props}
      >
        {showIcon && (
          <div className={cn(text ? "mr-2" : "")}>
            <Wand2 className="h-4 w-4" />
          </div>
        )}
        {text && <span>{text}</span>}
      </Button>
    )
  },
)

GeneratorButton.displayName = "GeneratorButton"

export { GeneratorButton }
