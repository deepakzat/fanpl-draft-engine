"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from './../lib/supabase'

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // ✨ THE FIX: A much stronger check that ignores trailing slashes
    const isPublic = 
      pathname === '/' || 
      pathname.startsWith('/login') || 
      pathname.startsWith('/forgot-password') || 
      pathname.startsWith('/reset-password')

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user && !isPublic) {
        console.log("🚫 Bouncer blocked access to:", pathname)
        router.push('/')
      } else {
        setAuthorized(true)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user && !isPublic) {
        router.push('/')
      } else {
        setAuthorized(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  if (!authorized) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div> 
  }

  return <>{children}</>
}