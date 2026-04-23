import { useState, useRef, useEffect } from 'react'
import { Search, Plus, X, FileText, LayoutGrid, List, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { useForms, useFormSubmissionCounts } from '@/hooks/useApi'
import { formatNumber, cn } from '@/lib/utils'
import { useCampaign } from '@/lib/campaign-context'
import { FormCard } from './FormCard'
import { FormDialog } from './FormDialog'
import { FormPreviewDialog } from './FormPreviewDialog'
import { DeleteFormDialog } from './DeleteFormDialog'
import { FormDataDialog } from './FormDataDialog'
import type { Form } from '@/types/database'

export default function FormsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editForm, setEditForm] = useState<Form | null>(null)
  const [previewForm, setPreviewForm] = useState<Form | null>(null)
  const [deleteConfirmForm, setDeleteConfirmForm] = useState<Form | null>(null)
  const [manageDataForm, setManageDataForm] = useState<Form | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const { campaign, labelAr, isFiltered } = useCampaign()

  useEffect(() => {
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(searchTimer.current)
  }, [search])

  const { data: formsResult, isLoading, refetch } = useForms({ search: debouncedSearch || undefined, campaignType: campaign })
  const { data: submissionCounts } = useFormSubmissionCounts(campaign)

  const forms = formsResult?.data
  const totalCount = formsResult?.count || 0

  return (
    <div className="page-enter">
      <Header
        title="إدارة النماذج"
        subtitle={isFiltered ? `${formatNumber(totalCount)} نموذج — ${labelAr}` : `${formatNumber(totalCount)} نموذج`}
        onRefresh={() => refetch()}
      />

      <div className="p-6 space-y-5">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في النماذج..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 h-10"
            />
            {search && (
              <Button variant="ghost" size="icon-sm" className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearch('')}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon-sm"
                className="h-8 w-8" onClick={() => setViewMode('grid')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon-sm"
                className="h-8 w-8" onClick={() => setViewMode('list')}>
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button className="gap-2 h-10 px-5 font-medium" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4" />
              نموذج جديد
            </Button>
          </div>
        </div>

        {/* Forms Grid / List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-5"><Skeleton className="w-full h-52 rounded-xl" /></CardContent></Card>
                ))
              : forms?.map(form => (
                  <FormCard
                    key={form.id} form={form}
                    submissionCount={submissionCounts?.[form.id]}
                    onEdit={() => setEditForm(form)}
                    onPreview={() => setPreviewForm(form)}
                    onDelete={() => setDeleteConfirmForm(form)}
                    onManageData={() => setManageDataForm(form)}
                  />
                ))
            }
          </div>
        ) : (
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-16 rounded-xl" />
                ))
              : forms?.map(form => (
                  <FormListItem
                    key={form.id} form={form}
                    submissionCount={submissionCounts?.[form.id]}
                    onEdit={() => setEditForm(form)}
                    onPreview={() => setPreviewForm(form)}
                    onDelete={() => setDeleteConfirmForm(form)}
                    onManageData={() => setManageDataForm(form)}
                  />
                ))
            }
          </div>
        )}

        {/* Empty State */}
        {!isLoading && forms?.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FileText className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold mb-1">
              {debouncedSearch ? 'لا توجد نتائج' : 'لا توجد نماذج بعد'}
            </h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
              {debouncedSearch ? 'جرّب البحث بكلمات مختلفة' : 'ابدأ بإنشاء نموذج جديد لجمع البيانات من الميدان'}
            </p>
            {!debouncedSearch && (
              <Button className="gap-2 h-10 px-6" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4" /> إنشاء نموذج
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <FormDialog
        key="create"
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => { setShowCreateDialog(false); refetch() }}
      />

      {editForm && (
        <FormDialog
          key={editForm.id}
          open={!!editForm}
          onOpenChange={open => { if (!open) setEditForm(null) }}
          form={editForm}
          onSuccess={() => { setEditForm(null); refetch() }}
        />
      )}

      {previewForm && (
        <FormPreviewDialog
          open={!!previewForm}
          onOpenChange={open => { if (!open) setPreviewForm(null) }}
          form={previewForm}
        />
      )}

      {deleteConfirmForm && (
        <DeleteFormDialog
          open={!!deleteConfirmForm}
          onOpenChange={open => { if (!open) setDeleteConfirmForm(null) }}
          form={deleteConfirmForm}
          onSuccess={() => { setDeleteConfirmForm(null); refetch() }}
        />
      )}

      {manageDataForm && (
        <FormDataDialog
          open={!!manageDataForm}
          onOpenChange={open => { if (!open) setManageDataForm(null) }}
          form={manageDataForm}
        />
      )}
    </div>
  )
}

// ==================== List View Item ====================

interface FormListItemProps {
  form: Form
  submissionCount?: { total: number; submitted: number; draft: number }
  onEdit: () => void
  onPreview: () => void
  onDelete: () => void
  onManageData: () => void
}

function FormListItem({ form, submissionCount, onEdit, onPreview, onDelete, onManageData }: FormListItemProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer border shadow-sm"
      onClick={() => onEdit()}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          form.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm truncate">{form.title_ar}</h3>
          <p className="text-xs text-muted-foreground truncate" dir="ltr">{form.title_en}</p>
        </div>
        {submissionCount && submissionCount.total > 0 && (
          <Badge variant="secondary" className="text-xs shrink-0">{submissionCount.total} تقديم</Badge>
        )}
        <div className={cn('flex items-center gap-1 shrink-0 transition-opacity', showActions ? 'opacity-100' : 'opacity-0')}>
          <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={e => { e.stopPropagation(); onManageData() }}>
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={e => { e.stopPropagation(); onPreview() }}>
            <FileText className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-destructive" onClick={e => { e.stopPropagation(); onDelete() }}>
            <FileText className="w-4 h-4" />
          </Button>
        </div>
        <div className={cn(
          'w-2 h-2 rounded-full shrink-0',
          form.is_active ? 'bg-emerald-500' : 'bg-gray-400'
        )} />
      </CardContent>
    </Card>
  )
}
