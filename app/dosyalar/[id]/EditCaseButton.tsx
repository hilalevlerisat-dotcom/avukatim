'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import EditCaseDialog from '@/components/forms/EditCaseDialog'
import type { CaseCategory, CaseStatus } from '@/lib/database.types'

interface CaseData {
  id: string
  title: string
  category: CaseCategory
  status: CaseStatus
  case_number: string
  court_name: string
  opposing_party: string
  opposing_counsel?: string
  open_date: string
  priority: 1 | 2 | 3
  description: string
}

interface EditCaseButtonProps {
  caseData: CaseData
}

export default function EditCaseButton({ caseData }: EditCaseButtonProps) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(caseData)

  return (
    <>
      <Button
        id="edit-case-btn"
        variant="outline"
        size="sm"
        className="flex-shrink-0 gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Pencil className="w-3.5 h-3.5" />
        Düzenle
      </Button>

      <EditCaseDialog
        open={open}
        onClose={() => setOpen(false)}
        caseData={current}
        onUpdated={updated => {
          setCurrent(updated)
          // Supabase entegrasyonunda router.refresh() veya revalidatePath() eklenecek
        }}
      />
    </>
  )
}
