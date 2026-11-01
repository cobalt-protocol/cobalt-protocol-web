"use client"

import React, { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, Bot, User } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

interface Message {
  sender: "user" | "bot"
  text: string
}

export function CompetitionChatbot({ competitionId, competitionTitle }: { competitionId: string; competitionTitle?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: `Halo! Saya AI Assistant untuk kompetisi ${competitionTitle || "ini"}. Ada yang bisa saya bantu?`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }])
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `Pertanyaan Anda mengenai ${competitionTitle || "kompetisi ini"} telah diterima. AI RAG engine aktif untuk kompetisi ID: ${competitionId}.`,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-white shadow-lg hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Open AI Assistant Chat"
        >
          <MessageSquare size={20} />
          <span className="text-sm font-semibold">AI Assistant</span>
        </button>
      ) : (
        <div className="flex flex-col w-[350px] sm:w-[380px] h-[500px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/10 rounded-lg"><Bot size={18} /></span>
              <div>
                <h3 className="text-sm font-bold">AI Assistant</h3>
                <p className="text-[10px] text-white/80">Online · RAG Enabled</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors" aria-label="Close Chat">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-blue-100 text-blue-700"}`}>
                  {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${msg.sender === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white border border-border/70 text-foreground rounded-tl-none shadow-sm"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2.5 mr-auto max-w-[85%] items-center">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Bot size={14} /></div>
                <div className="rounded-2xl px-4 py-3 bg-white border border-border/70 text-xs rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <span className="size-1.5 bg-primary rounded-full animate-bounce"></span>
                  <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-border flex items-center gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanyakan sesuatu..." className="flex-1 rounded-xl border border-input bg-secondary/30 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
            <Button type="submit" size="sm" disabled={!input.trim() || isLoading} className="h-auto py-2 px-3 text-xs"><Send size={14} /></Button>
          </form>
        </div>
      )}
    </div>
  )
}
