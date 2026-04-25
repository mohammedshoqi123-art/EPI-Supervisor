import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useSignIn, useAuth } from '@/hooks/useApi'
import { isConfigured } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const signIn = useSignIn()
  const { data: authData } = useAuth()

  if (authData?.session) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    signIn.mutate({ email, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #1e3a5f 30%, #0f172a 100%)' }}>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2l4 3.5-4 3z'/%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Gradient orbs */}
      <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-15"
        style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />

      <div className="relative w-full max-w-md">

        {/* ═══════════════════════════════════════
            LOGO & BRANDING — EPI Supervisor
        ═══════════════════════════════════════ */}
        <div className="text-center mb-8">
          {/* Official Partner Logos */}
          <div className="flex items-center justify-center gap-4 mb-6 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
            <img
              src={`${import.meta.env.BASE_URL}logo-who.jpeg`.replace(/\/+/g, '/')}
              alt="WHO"
              className="h-8 object-contain brightness-0 invert opacity-80"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <img
              src={`${import.meta.env.BASE_URL}logo-unicef.jpeg`.replace(/\/+/g, '/')}
              alt="UNICEF"
              className="h-8 object-contain brightness-0 invert opacity-80"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div className="w-px h-8 bg-white/20" />
            <img
              src={`${import.meta.env.BASE_URL}logo-moh-header.png`.replace(/\/+/g, '/')}
              alt="وزارة الصحة"
              className="h-10 object-contain brightness-0 invert opacity-90"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>

          {/* EPI Logo */}
          <div className="relative inline-block mb-5">
            <div className="w-28 h-28 rounded-3xl bg-white shadow-2xl shadow-blue-500/20 flex items-center justify-center overflow-hidden border border-blue-100/30 mx-auto relative">
              <img
                src={`${import.meta.env.BASE_URL}logo-epi-256.png`.replace(/\/+/g, '/')}
                alt="شعار برنامج التحصين الموسع"
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML = `
                    <div class="w-18 h-18 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center">
                      <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  `
                }}
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo, Tajawal, sans-serif' }}>
            نظام الإشراف الإلكتروني
          </h1>
          <p className="text-blue-200/80 text-sm leading-relaxed max-w-xs mx-auto" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            النظام الإلكتروني للإشراف على أنشطة وحملات برنامج التحصين الصحي الموسع
          </p>

          {/* Security badge */}
          <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-300">اتصال آمن ومشفّر</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            LOGIN CARD
        ═══════════════════════════════════════ */}
        <Card className="shadow-2xl shadow-black/20 border-0 bg-white/95 backdrop-blur-xl overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)' }} />

          <CardHeader className="text-center pb-4 pt-6">
            <CardTitle className="text-xl text-gray-900 flex items-center justify-center gap-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              <Lock className="w-5 h-5 text-blue-500" />
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              أدخل بيانات حساب المسؤول للوصول إلى لوحة التحكم
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {!isConfigured && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2.5" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Supabase غير مُعدّ</p>
                  <p className="text-xs mt-1 opacity-80">يرجى تعيين متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  className="text-left h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-blue-200 transition-all rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    className="text-left pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-blue-200 transition-all rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {signIn.isError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all text-white"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6, #6366f1)' }}
                disabled={signIn.isPending || !isConfigured}
              >
                {signIn.isPending ? (
                  <div className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <span style={{ fontFamily: 'Tajawal, sans-serif' }}>تسجيل الدخول</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-blue-300/50" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            وزارة الصحة العامة والسكان — برنامج التحصين الصحي الموسع
          </p>
          <p className="text-[10px] text-blue-400/30 mt-1">
            EPI Supervisor v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
