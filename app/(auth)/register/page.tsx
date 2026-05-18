'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email, password,
      options: { data: { username: username.toLowerCase() } },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, username: username.toLowerCase() })
    }

    // Se email confirmation è disabilitata, vai direttamente alla dashboard
    if (data.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setStep('success')
    }
    setLoading(false)
  }

  if (step === 'success') return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={32} className="text-green-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Account creato!</h2>
      <p className="text-gray-500 text-sm mb-6">Controlla <strong>{email}</strong> per confermare l'account.</p>
      <Link href="/login" className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors">Vai al login</Link>
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Crea account</h1>
        <p className="text-gray-500 text-sm">Registrati e inizia a giocare al FantaMondiale</p>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, ''))}
            required minLength={3} maxLength={20} placeholder="il_tuo_username"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              required minLength={8} placeholder="Minimo 8 caratteri"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-2 flex gap-1">
            {[8, 12, 16].map((len, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${password.length >= len ? i === 0 ? 'bg-red-400' : i === 1 ? 'bg-yellow-400' : 'bg-green-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-2">
          {loading && <Loader2 size={16} className="animate-spin" />}Crea account
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Hai già un account?{' '}
        <Link href="/login" className="text-green-600 font-medium hover:underline">Accedi</Link>
      </p>
    </div>
  )
}
