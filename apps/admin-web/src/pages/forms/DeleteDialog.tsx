import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useDeleteForm } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'
import type { Form } from '@/types/database'

export function DeleteDialog({ open, onOpenChange, form, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form
  onSuccess: () => void
}) {
  const deleteForm = useDeleteForm()
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      await deleteForm.mutateAsync(form.id)
      toast({ title: 'تم الحذف', description: 'تم حذف النموذج بنجاح' })
      onSuccess()
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message || 'فشل حذف النموذج', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">حذف النموذج</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف <strong>{form.title_ar}</strong>؟
            <br />
            هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع البيانات المرتبطة.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteForm.isPending} className="gap-2">
            {deleteForm.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            حذف نهائي
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
