'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#07070f' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(217,70,239,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="sidebar-logo-icon w-14 h-14 text-2xl mb-3" style={{ width: 56, height: 56, fontSize: 24 }}>V</div>
          <p className="sidebar-logo-text text-[26px] font-black">VANTRA</p>
          <p className="text-[12px] text-muted mt-1">Sistema de gestión</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <h2 className="text-[16px] font-semibold text-center mb-0.5">Iniciar sesión</h2>
            <p className="text-[11px] text-muted text-center">Acceso exclusivo para administradores</p>
          </div>

          {error && (
            <div className="text-[12px] text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-center">
              {error}
            </div>
          )}

          <div className="field">
            <label className="label">Correo</label>
            <input
              className="input text-[13px]"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@vantra.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Contraseña</label>
            <div className="relative">
              <input
                className="input text-[13px] pr-10"
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-[13px]">
            <LogIn size={15} />
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-[11px] text-muted mt-4">
          Catálogo público disponible en{' '}
          <a href="/catalogo" className="text-brand hover:underline">/catalogo</a>
        </p>
      </div>
    </div>
  )
}
