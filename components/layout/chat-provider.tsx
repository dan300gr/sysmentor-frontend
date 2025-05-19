"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import FloatingChat from "@/components/chatbot/floating-chat"

interface ChatContextType {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
}

const ChatContext = createContext<ChatContextType>({
  isOpen: false,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
})

export const useChat = () => useContext(ChatContext)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openChat = () => {
    console.log("Opening chat")
    setIsOpen(true)
  }

  const closeChat = () => {
    console.log("Closing chat")
    setIsOpen(false)
  }

  const toggleChat = () => {
    console.log("Toggling chat, current state:", !isOpen)
    setIsOpen((prev) => !prev)
  }

  return (
    <ChatContext.Provider value={{ isOpen, openChat, closeChat, toggleChat }}>
      {children}
      <FloatingChat isOpen={isOpen} setIsOpen={setIsOpen} />
    </ChatContext.Provider>
  )
}
