import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDeleteForm } from '@/hooks/useApi'
import type { Form } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { parseFormSchema } from './types'

interface DeleteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form
  onSuccess: () => void
}

export function DeleteFormDialog({ open, onOpenChange, form, onSuccess }: DeleteFormDialogProps) {
  const deleteForm = useDeleteForm()
  const { toast } = useToast()
  const schema = parseFormSchema(form.schema)
  const fieldCount = schema.fields?.length || 0

  const handleDelete = () => {
    deleteForm.mutate(form.id, {
      onSuccess: () => {
        toast({ title: 'تم حذف النموذج بنجاح', variant: 'success' })
        onSuccess()
      },
      onError: () => {
        toast({ title: 'فشل حذف النموذج', variant: 'destructive' })
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            تأكيد الحذف
          </DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف هذا النموذج؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl space-y-2">
          <p className="font-bold text-sm">{form.title_ar}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">{form.title_en}</p>
          <div className="flex gap-3 text-xs text-muted-foreground pt-1">
            <span>{fieldCount} حقل</span>
            <span>v{form.version}</span>
            <span>{formatDate(form.created_at)}</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteForm.isPending}>
            إلغاء
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteForm.isPending} className="gap-2">
            {deleteForm.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {deleteForm.isPending ? 'جاري الحذف...' : (
              <><Trash2 className="w-4 h-4" /> حذف النموذج</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
