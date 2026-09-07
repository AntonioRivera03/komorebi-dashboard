import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('k-textarea', className)} {...rest} />
}
