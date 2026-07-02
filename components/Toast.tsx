'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastMessage {
  id: string
  text: string
  type: 'success' | 'error'
}

interface ToastProps {
  messages: ToastMessage[]
  onDismiss: (id: string) => void
}

export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  function toast(text: string, type: 'success' | 'error' = 'success') {
    const id = Math.random().toString(36).slice(2)
    setMessages(prev => [...prev, { id, text, type }])
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 3500)
  }

  return { messages, toast, dismiss: (id: string) => setMessages(prev => prev.filter(m => m.id !== id)) }
}

export function ToastContainer({ messages, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-[12px] font-medium',
            msg.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-[#101820] text-white'
          )}
        >
          {msg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span className="flex-1">{msg.text}</span>
          <button onClick={() => onDismiss(msg.id)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
