"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('mode') === 'register') setIsSignUp(true)
      if (params.get('mode') === 'login') setIsSignUp(false)
    }
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // 1. Create the secure account
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) throw error 

        if (data.user) {
          // 2. Save their email to our public profiles table
          const { error: profileError } = await supabase.from('profiles').insert([
            { id: data.user.id, email: data.user.email }
          ])
          
          if (profileError) throw profileError 

          alert("Registration successful! Waiting for Admin to assign your team.")
          router.push('/team') 
        }
      } else {
        // Log into an existing account
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        router.push('/team') 
      }
    } catch (err: any) {
      console.error("Authentication Crash:", err)
      alert(`ERROR: ${err.message || "Something went wrong!"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full">
        
        <h1 className="text-3xl font-black text-white mb-2 text-center">
          {isSignUp ? 'Claim Franchise' : 'Manager Access'}
        </h1>
        <p className="text-slate-400 text-center mb-8">
          {isSignUp ? 'Register to enter the draft.' : 'Welcome back to the war room.'}
        </p>

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 block">Email Address</label>
            <input
              type="email"
              placeholder="coach@team.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-900 border border-slate-600 text-white rounded-xl p-4 w-full outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Secure Password</label>
              
              {/* ✨ NEW: Forgot Password Link (Only shows during Login) */}
              {!isSignUp && (
                <Link href="/forgot-password" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot Password?
                </Link>
              )}
            </div>

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-slate-900 border border-slate-600 text-white rounded-xl p-4 w-full outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
          >
            {loading ? 'AUTHENTICATING...' : (isSignUp ? 'CREATE FRANCHISE ACCOUNT' : 'SECURE LOGIN')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-700 pt-6">
          <p className="text-slate-400 text-sm">
            {isSignUp ? 'Already own a franchise?' : 'New to the league?'}
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-blue-400 hover:text-blue-300 font-bold transition-colors"
            >
              {isSignUp ? 'Login here' : 'Register here'}
            </button>
          </p>
        </div>

      </div>
    </div>
  )
}