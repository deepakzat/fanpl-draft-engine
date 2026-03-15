"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from './../lib/supabase'


export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter() // ✨ Router Initialized
  
  const [isAuctionComplete, setIsAuctionComplete] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false) 

  useEffect(() => {
    fetchLeagueStatus()
    
    const checkUserStatus = async (sessionUser: any) => {
      setUser(sessionUser)
      if (sessionUser) {
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', sessionUser.id).single()
        setIsAdmin(data?.is_admin || false)
      } else {
        setIsAdmin(false)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserStatus(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserStatus(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  // ✨ Single, unified Logout Function
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/') // Redirects instantly after logout
  }

  const fetchLeagueStatus = async () => {
    const { data } = await supabase.from('leagues').select('auction_status').limit(1).single()
    if (data && data.auction_status === 'Completed') {
      setIsAuctionComplete(true)
    } else {
      setIsAuctionComplete(false)
    }
  }

  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-xl">
      <div className="max-w-[90rem] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Logo */}
        <div className="text-2xl font-black text-white tracking-widest flex items-center gap-2 mb-4 md:mb-0">
          🏏 FanPL <span className="text-blue-500">Manager</span>
        </div>

        {/* Dynamic Links */}
        <div className="flex flex-wrap justify-center items-center">
          
{!isAuctionComplete && (
            <>
              {/* ✨ NEW RULES LINK HERE */}
              <Link href="/rules" className={`mx-2 my-1 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${isActive('/rules')}`}>
                📜 Engine Rules
              </Link>
              
              <Link href="/players" className={`mx-2 my-1 px-5 py-2.5 rounded-xl font-bold transition-all ${isActive('/players')}`}>
                Player Pool
              </Link>
              <Link href="/auction" className={`mx-2 my-1 px-5 py-2.5 rounded-xl font-bold transition-all ${isActive('/auction')}`}>
                Live Auction
              </Link>
            </>
          )}
          <Link href="/team" className={`mx-2 my-1 px-5 py-2.5 rounded-xl font-bold transition-all ${isActive('/team')}`}>
            My Team
          </Link>

          {isAuctionComplete && (
            <>
              <div className="w-px h-8 bg-slate-700 mx-4 hidden md:block"></div>
              
              <Link href="/matches" className={`mx-2 my-1 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${isActive('/matches')}`}>
                📅 Schedule & Results
              </Link>

              <Link href="/live" className={`mx-2 my-1 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${isActive('/live')}`}>
                📡 Live Match
              </Link>
              
              <Link href="/standings" className={`mx-2 my-1 px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${isActive('/standings')}`}>
                🏆 Standings
              </Link>
            </>
          )}

        </div>

        {/* Admin Link & Auth Logic */}
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          
          {isAdmin && (
            <Link href="/admin" className={`px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-700 transition-all ${isActive('/admin')}`}>
              ⚙️ Admin
            </Link>
          )}
          
          {user ? (
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-bold text-sm px-4 transition-all">
              Logout
            </button>
          ) : (
            <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg">
              Login
            </Link>
          )}
        </div>

      </div>
    </nav>
  )
}