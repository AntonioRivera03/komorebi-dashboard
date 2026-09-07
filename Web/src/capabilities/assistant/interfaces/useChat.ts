import { useCallback, useEffect, useState } from 'react'
import { newId } from '../../../shared/api/mock'
import { getThreadMessages, sendMessage } from './assistantApi'
import type { ChatMessage } from './types'

/** Loads a thread's canonical messages and appends new ones with stable client IDs. */
export function useChat(threadId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!threadId) {
      setMessages([])
      return
    }
    let active = true
    setLoading(true)
    getThreadMessages(threadId).then((value) => {
      if (active) {
        setMessages(value)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [threadId])

  const send = useCallback(
    async (text: string) => {
      if (!threadId || !text.trim()) return
      const clientMessageId = newId('cmsg')
      setSending(true)
      setMessages((current) => [...current, { id: clientMessageId, clientMessageId, role: 'user', text, at: new Date().toISOString() }])
      const result = await sendMessage(threadId, text, clientMessageId)
      setSending(false)
      if (result.status === 'completed') setMessages(result.value)
      else setMessages((current) => [...current, { id: newId('msg'), role: 'assistant', text: '', at: new Date().toISOString(), runState: 'failed', limitation: 'The model request failed. Your message was saved.' }])
    },
    [threadId],
  )

  const replaceMessage = useCallback((message: ChatMessage) => setMessages((current) => current.map((item) => (item.id === message.id ? message : item))), [])

  return { messages, loading, sending, send, replaceMessage }
}
