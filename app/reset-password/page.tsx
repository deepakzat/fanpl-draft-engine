"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Update the authenticated user's password securely
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage("✅ Password updated successfully!")
      // Redirect them back to login or dashboard after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-white mb-2 text-center">New Password</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Secure your franchise account</p>

        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2 block">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm font-bold bg-red-950/30 p-3 rounded-lg border border-red-900">{error}</p>}
          {message && <p className="text-green-400 text-sm font-bold bg-green-950/30 p-3 rounded-lg border border-green-900">{message}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-black py-4 rounded-xl shadow-lg transition-all"
          >
            {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  )
}