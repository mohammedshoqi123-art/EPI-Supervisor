import { useState } from 'react'
import {
  Search, Plus, Filter, MoreVertical, UserCheck, UserX, Trash2,
  Edit, Eye, Download, ChevronDown, Mail, MapPin, AlertTriangle, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Header } from '@/components/layout/header'
import { useUsers, useCreateUser, useUpdateUserRole, useToggleUserActive, useDeleteUser, useUpdateUserProfile, useResetUserPassword, useGovernorates, useDistricts, useAuth } from '@/hooks/useApi'
import { ROLE_LABELS, ROLE_COLORS, type UserRole, type UserProfile } from '@/types/database'
import { formatRelativeTime, getInitials, cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserProfile | null>(null)
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null)
  const { data: authData } = useAuth()
  const canManageUsers = authData?.profile?.role === 'admin' || authData?.profile?.role === 'central'

  const { data: users, isLoading, isError, error, refetch } = useUsers({
    role: roleFilter !== 'all' ? (roleFilter as UserRole) : undefined,
    search: search || undefined,
  })

  return (
    <div className="page-enter">
      <Header title="إدارة المستخدمين" subtitle={`${users?.length || 0} مستخدم`} onRefresh={() => refetch()} />

      <div className="p-6 space-y-6">
        {/* Error State */}
        {isError && (
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-red-700 mb-1">حدث خطأ في تحميل المستخدمين</h3>
              <p className="text-sm text-red-600 mb-3">{(error as Error)?.message || 'تعذر الاتصال بالخادم'}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" /> إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="كل الأدوار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأدوار</SelectItem>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManageUsers && (
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة مستخدم
            </Button>
          )}
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="w-full h-32" /></CardContent></Card>
              ))
            : users?.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  canManage={canManageUsers}
                  onEdit={() => setEditUser(user)}
                  onDelete={() => setDeleteUser(user)}
                />
              ))
          }
        </div>

        {users?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">لا توجد نتائج</p>
            <p className="text-sm text-muted-foreground mt-1">جرّب تغيير الفلاتر أو البحث</p>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Edit User Dialog */}
      {editUser && (
        <EditUserDialog user={editUser} open={!!editUser} onOpenChange={() => setEditUser(null)} />
      )}

      {/* Delete Confirmation */}
      {deleteUser && (
        <DeleteUserDialog user={deleteUser} open={!!deleteUser} onOpenChange={() => setDeleteUser(null)} />
      )}
    </div>
  )
}

function UserCard({ user, canManage, onEdit, onDelete }: { user: UserProfile; canManage: boolean; onEdit: () => void; onDelete: () => void }) {
  const toggleActive = useToggleUserActive()
  const { toast } = useToast()

  return (
    <Card className={cn(
      'group hover:shadow-card-hover transition-all duration-200',
      !user.is_active && 'opacity-60'
    )}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className={cn(
              'text-sm font-bold',
              user.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{user.full_name}</h3>
              {!user.is_active && <Badge variant="outline" className="text-[10px]">معطّل</Badge>}
            </div>
            <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
            {(user.governorates?.name_ar || user.districts?.name_ar) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {[user.governorates?.name_ar, user.districts?.name_ar].filter(Boolean).join(' - ')}
              </p>
            )}
          </div>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 ml-2" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  toggleActive.mutate({ userId: user.id, isActive: !user.is_active }, {
                    onSuccess: () => toast({ title: user.is_active ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب', variant: 'success' })
                  })
                }}>
                  {user.is_active ? <UserX className="w-4 h-4 ml-2" /> : <UserCheck className="w-4 h-4 ml-2" />}
                  {user.is_active ? 'تعطيل' : 'تفعيل'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Badge className={cn('text-xs border', ROLE_COLORS[user.role])}>
            {ROLE_LABELS[user.role]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(user.created_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'data_entry' as UserRole,
    governorate_id: '', district_id: '',
  })
  const createUser = useCreateUser()
  const { data: governorates } = useGovernorates()
  const { data: districts } = useDistricts(form.governorate_id)
  const { toast } = useToast()

  const [passwordError, setPasswordError] = useState('')

  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    if (!/[A-Z]/.test(pwd)) return 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل'
    if (!/[a-z]/.test(pwd)) return 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل'
    if (!/[0-9]/.test(pwd)) return 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل'
    return ''
  }

  const handleSubmit = () => {
    if (!form.full_name || !form.email || !form.password) {
      toast({ title: 'جميع الحقول مطلوبة', variant: 'destructive' })
      return
    }

    // Password strength validation (matches Edge Function rules)
    const pwdErr = validatePassword(form.password)
    if (pwdErr) {
      setPasswordError(pwdErr)
      toast({ title: pwdErr, variant: 'destructive' })
      return
    }
    setPasswordError('')

    createUser.mutate(form, {
      onSuccess: () => {
        toast({ title: 'تم إضافة المستخدم بنجاح', variant: 'success' })
        onOpenChange(false)
        setForm({ full_name: '', email: '', password: '', role: 'data_entry', governorate_id: '', district_id: '' })
      },
      onError: () => toast({ title: 'فشل إضافة المستخدم', variant: 'destructive' }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          <DialogDescription>أدخل بيانات المستخدم الجديد</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>الاسم الكامل</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>كلمة المرور</Label>
            <Input
              type="password"
              dir="ltr"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value })
                if (passwordError) setPasswordError(validatePassword(e.target.value))
              }}
              className={passwordError ? 'border-red-400 focus:border-red-500' : ''}
            />
            {passwordError && (
              <p className="text-xs text-red-500 mt-1">{passwordError}</p>
            )}
            {form.password && !passwordError && (
              <p className="text-xs text-emerald-500 mt-1">✓ كلمة المرور قوية</p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              8 أحرف على الأقل — حرف كبير + حرف صغير + رقم
            </p>
          </div>
          <div className="space-y-2">
            <Label>الدور</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole, governorate_id: '', district_id: '' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.role !== 'admin' && form.role !== 'central' && (
            <div className="space-y-2">
              <Label>المحافظة</Label>
              <Select value={form.governorate_id} onValueChange={(v) => setForm({ ...form, governorate_id: v, district_id: '' })}>
                <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                <SelectContent>
                  {governorates?.map((g) => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {(form.role === 'district' || form.role === 'data_entry') && form.governorate_id && (
            <div className="space-y-2">
              <Label>المديرية</Label>
              <Select value={form.district_id} onValueChange={(v) => setForm({ ...form, district_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر المديرية" /></SelectTrigger>
                <SelectContent>
                  {districts?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={createUser.isPending}>
            {createUser.isPending ? 'جاري الإضافة...' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({ user, open, onOpenChange }: { user: UserProfile; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'role' | 'password'>('profile')
  const [fullName, setFullName] = useState(user.full_name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone || '')
  const [position, setPosition] = useState(user.position || '')
  const [role, setRole] = useState<UserRole>(user.role)
  const [govId, setGovId] = useState(user.governorate_id || '')
  const [districtId, setDistrictId] = useState(user.district_id || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const updateRole = useUpdateUserRole()
  const updateProfile = useUpdateUserProfile()
  const resetPassword = useResetUserPassword()
  const { data: governorates } = useGovernorates()
  const { data: districts } = useDistricts(govId)
  const { toast } = useToast()

  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) return '8 أحرف على الأقل'
    if (!/[A-Z]/.test(pwd)) return 'يحتاج حرف كبير'
    if (!/[a-z]/.test(pwd)) return 'يحتاج حرف صغير'
    if (!/[0-9]/.test(pwd)) return 'يحتاج رقم'
    return ''
  }

  const handleSaveProfile = () => {
    if (!fullName.trim()) { toast({ title: 'الاسم مطلوب', variant: 'destructive' }); return }
    updateProfile.mutate(
      { userId: user.id, full_name: fullName.trim(), email: email.trim(), phone: phone.trim() || undefined, position: position.trim() || undefined },
      {
        onSuccess: () => { toast({ title: 'تم تحديث الملف الشخصي', variant: 'success' }); onOpenChange(false) },
        onError: () => toast({ title: 'فشل التحديث', variant: 'destructive' }),
      }
    )
  }

  const handleSaveRole = () => {
    updateRole.mutate(
      { userId: user.id, role, governorate_id: govId, district_id: districtId },
      {
        onSuccess: () => { toast({ title: 'تم تحديث الدور', variant: 'success' }); onOpenChange(false) },
        onError: () => toast({ title: 'فشل التحديث', variant: 'destructive' }),
      }
    )
  }

  const handleResetPassword = () => {
    const err = validatePassword(newPassword)
    if (err) { setPasswordError(err); return }
    if (newPassword !== confirmPassword) { setPasswordError('كلمتا المرور غير متطابقتين'); return }
    setPasswordError('')
    resetPassword.mutate(
      { userId: user.id, newPassword },
      {
        onSuccess: () => { toast({ title: 'تم تغيير كلمة المرور بنجاح', variant: 'success' }); setNewPassword(''); setConfirmPassword(''); onOpenChange(false) },
        onError: () => toast({ title: 'فشل تغيير كلمة المرور', variant: 'destructive' }),
      }
    )
  }

  const isLoading = updateRole.isPending || updateProfile.isPending || resetPassword.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تعديل المستخدم: {user.full_name}</DialogTitle>
          <DialogDescription>{user.email} — {ROLE_LABELS[user.role]}</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button onClick={() => setActiveTab('profile')} className={cn('flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all', activeTab === 'profile' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>الملف الشخصي</button>
          <button onClick={() => setActiveTab('role')} className={cn('flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all', activeTab === 'role' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>الدور والصلاحية</button>
          <button onClick={() => setActiveTab('password')} className={cn('flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all', activeTab === 'password' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>كلمة المرور</button>
        </div>

        <div className="space-y-4 py-2">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل" />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>رقم الجوال</Label>
                <Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+967XXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>الصفة الوظيفية</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="مثال: مشرف التحصين بالمحافظة" />
              </div>
            </>
          )}

          {/* Role Tab */}
          {activeTab === 'role' && (
            <>
              <div className="space-y-2">
                <Label>الدور</Label>
                <Select value={role} onValueChange={(v) => { setRole(v as UserRole); setGovId(''); setDistrictId('') }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {role !== 'admin' && role !== 'central' && (
                <div className="space-y-2">
                  <Label>المحافظة</Label>
                  <Select value={govId} onValueChange={(v) => { setGovId(v === 'none' ? '' : v); setDistrictId('') }}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون</SelectItem>
                      {governorates?.map((g) => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(role === 'district' || role === 'data_entry') && govId && (
                <div className="space-y-2">
                  <Label>المديرية</Label>
                  <Select value={districtId} onValueChange={(v) => setDistrictId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون</SelectItem>
                      {districts?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                ⚠️ تغيير كلمة المرور سيؤثر فوراً على المستخدم. تأكد من إبلاغه بالكلمة الجديدة.
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور الجديدة</Label>
                <Input type="password" dir="ltr" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(validatePassword(e.target.value)) }} placeholder="8 أحرف على الأقل" className={passwordError ? 'border-red-400' : ''} />
                {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                {newPassword && !passwordError && <p className="text-xs text-emerald-500">✓ كلمة المرور قوية</p>}
              </div>
              <div className="space-y-2">
                <Label>تأكيد كلمة المرور</Label>
                <Input type="password" dir="ltr" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="أعد إدخال كلمة المرور" className={confirmPassword && newPassword !== confirmPassword ? 'border-red-400' : ''} />
                {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-red-500">كلمتا المرور غير متطابقتين</p>}
              </div>
              <p className="text-[10px] text-muted-foreground">8 أحرف على الأقل — حرف كبير + حرف صغير + رقم</p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          {activeTab === 'profile' && (
            <Button onClick={handleSaveProfile} disabled={isLoading}>
              {updateProfile.isPending ? 'جاري الحفظ...' : 'حفظ الملف الشخصي'}
            </Button>
          )}
          {activeTab === 'role' && (
            <Button onClick={handleSaveRole} disabled={isLoading}>
              {updateRole.isPending ? 'جاري الحفظ...' : 'حفظ الدور'}
            </Button>
          )}
          {activeTab === 'password' && (
            <Button onClick={handleResetPassword} disabled={isLoading || !newPassword || !confirmPassword} variant="destructive">
              {resetPassword.isPending ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserDialog({ user, open, onOpenChange }: { user: UserProfile; open: boolean; onOpenChange: (v: boolean) => void }) {
  const deleteUser = useDeleteUser()
  const { toast } = useToast()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">حذف المستخدم</DialogTitle>
          <DialogDescription>
            هل أنت متأكد من حذف "{user.full_name}"؟ هذا الإجراء لا يمكن التراجع عنه.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button variant="destructive" onClick={() => {
            deleteUser.mutate(user.id, {
              onSuccess: () => {
                toast({ title: 'تم حذف المستخدم', variant: 'success' })
                onOpenChange(false)
              },
              onError: () => toast({ title: 'فشل الحذف', variant: 'destructive' }),
            })
          }} disabled={deleteUser.isPending}>
            {deleteUser.isPending ? 'جاري الحذف...' : 'حذف'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
