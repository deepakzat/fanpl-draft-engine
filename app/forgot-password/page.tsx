"use client"

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // This is where Supabase sends them after they click the link in their email
      redirectTo: `${window.location.origin}/reset-password`, 
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage("✅ Password reset link sent! Please check your email inbox.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-white mb-2 text-center">Reset Password</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Enter your registered email address</p>

        <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              placeholder="manager@franchise.com"
            />
          </div>

          {error && <p className="text-red-400 text-sm font-bold bg-red-950/30 p-3 rounded-lg border border-red-900">{error}</p>}
          {message && <p className="text-green-400 text-sm font-bold bg-green-950/30 p-3 rounded-lg border border-green-900">{message}</p>}

          <button
            type="submit"
            disabled={loading || !email}
            className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black py-4 rounded-xl shadow-lg transition-all"
          >
            {loading ? 'SENDING...' : 'SEND RESET LINK'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-slate-400 hover:text-white text-sm font-bold transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}