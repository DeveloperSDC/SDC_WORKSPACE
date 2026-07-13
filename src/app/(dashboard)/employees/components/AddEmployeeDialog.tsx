'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'

import { EmployeeForm } from './EmployeeForm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface AddEmployeeDialogProps {
  departments: { id: string; name: string }[]
  designations: { id: string; name: string }[]
}

export function AddEmployeeDialog({ departments, designations }: AddEmployeeDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>

          <DialogDescription>Create a new employee account for SDC Workspace.</DialogDescription>
        </DialogHeader>

        <EmployeeForm
          departments={departments}
          designations={designations}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
