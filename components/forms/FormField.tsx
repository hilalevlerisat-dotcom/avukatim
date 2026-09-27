'use client'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FieldProps {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function Field({ label, required, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs font-semibold text-foreground/80">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

// Stil tutarlılığı için yeniden ihraç
export { Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
