import { useState, useEffect } from 'react'
import {
  Plus, Search, X, FileText, Database,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { useForms, useFormSubmissionCounts, useAuth } from '@/hooks/useApi'
import { useCampaign } from '@/lib/campaign-context'
import { FormCard } from './FormCard'
import { FormEditorDialog } from './FormEditorDialog'
import { DeleteDialog } from './DeleteDialog'
import { FormDataDialog } from './FormDataDialog'
import type { Form } from '@/types/database'

export default function FormsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [editForm, setEditForm] = useState<Form | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteForm, setDeleteForm] = useState<Form | null>(null)
  const [dataForm, setDataForm] = useState<Form | null>(null)
  const { campaign, labelAr, isFiltered } = useCampaign()
  const { data: authData } = useAuth()
  const userRole = authData?.profile?.role
  const canManageForms = userRole === 'admin'

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: formsResult, isLoading, refetch } = useForms({ search: debouncedSearch || undefined, campaignType: campaign })
  const { data: submissionCounts } = useFormSubmissionCounts(campaign)

  const forms = formsResult?.data || []
  const totalCount = formsResult?.count || 0

  return (
    <div className="page-enter">
      <Header
        title="إدارة النماذج"
        subtitle={isFiltered ? `${totalCount} نموذج — ${labelAr}` : `${totalCount} نموذج`}
        onRefresh={() => refetch()}
      />

      <div className="p-6 space-y-5">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث في النماذج..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-10" />
            {search && (
              <Button variant="ghost" size="icon-sm" className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setSearch('')}>
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          {canManageForms && (
            <Button className="gap-2 h-10 px-5 font-medium" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              نموذج جديد
            </Button>
          )}
        </div>

        {/* Forms Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : forms.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <h3 className="text-lg font-medium mb-1">{search ? 'لا توجد نتائج' : 'لا توجد نماذج'}</h3>
              <p className="text-sm text-muted-foreground">
                {search ? 'جرّب كلمة بحث مختلفة' : canManageForms ? 'أنشئ نموذجك الأول لبدء جمع البيانات' : 'لا توجد نماذج متاحة'}
              </p>
              {canManageForms && !search && (
                <Button className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4" /> نموذج جديد
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {forms.map(form => (
              <FormCard
                key={form.id}
                form={form}
                submissionCount={submissionCounts?.[form.id]}
                onEdit={canManageForms ? () => setEditForm(form) : undefined}
                onDelete={canManageForms ? () => setDeleteForm(form) : undefined}
                onData={() => setDataForm(form)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showCreate && (
        <FormEditorDialog open={showCreate} onOpenChange={setShowCreate} onSuccess={() => { setShowCreate(false); refetch() }} />
      )}
      {editForm && (
        <FormEditorDialog open={!!editForm} onOpenChange={(open) => { if (!open) setEditForm(null) }} form={editForm} onSuccess={() => { setEditForm(null); refetch() }} />
      )}
      {deleteForm && (
        <DeleteDialog open={!!deleteForm} onOpenChange={(open) => { if (!open) setDeleteForm(null) }} form={deleteForm} onSuccess={() => { setDeleteForm(null); refetch() }} />
      )}
      {dataForm && (
        <FormDataDialog open={!!dataForm} onOpenChange={(open) => { if (!open) setDataForm(null) }} form={dataForm} />
      )}
    </div>
  )
}
