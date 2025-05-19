"use client"

import type React from "react"

import { type ButtonHTMLAttributes, forwardRef } from "react"
import { useChat } from "@/components/layout/chat-provider"
import { Button } from "@/components/ui/button"
import { BrainCircuit } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatbotButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showIcon?: boolean
  text?: string
}

const ChatbotButton = forwardRef<HTMLButtonElement, ChatbotButtonProps>(
  ({ className, variant = "default", size = "default", showIcon = true, text = "Asistente IA", ...props }, ref) => {
    const { openChat } = useChat()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("ChatbotButton clicked")
      openChat()
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
            <BrainCircuit className="h-4 w-4" />
          </div>
        )}
        {text && <span>{text}</span>}
      </Button>
    )
  },
)

ChatbotButton.displayName = "ChatbotButton"

export { ChatbotButton }
