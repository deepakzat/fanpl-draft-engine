"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from './../lib/supabase'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if someone is already logged in when they hit the homepage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">Loading FanPL...</div>

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center">
      
      <div className="max-w-3xl space-y-8">
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter">
          Welcome to <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">FanPL Manager</span>
        </h1>
        
        <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
          The ultimate elite fantasy cricket draft experience. Build your franchise, dominate the auction block, and set match-winning tactics.
        </p>

        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <Link href="/team" className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-black py-4 px-10 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
              ENTER LOCKER ROOM
            </Link>
          ) : (
            <>
              <>
              {/* ✨ Added ?mode=register to the URL */}
              <Link href="/login?mode=register" className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-black py-4 px-10 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                REGISTER FRANCHISE
              </Link>
              
              {/* ✨ Added ?mode=login to the URL */}
              <Link href="/login?mode=login" className="bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold py-4 px-10 rounded-2xl border border-slate-700 transition-all">
                MANAGER LOGIN
              </Link>
            </>
            </>
          )}
        </div>
      </div>

    </div>
  )
}