"use client"

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from './../lib/supabase'

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // List the URLs that anyone is allowed to see without logging in
    const publicPaths = ['/', '/login']

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      // If they are NOT logged in, AND trying to access a private page...
      if (!session?.user && !publicPaths.includes(pathname)) {
        router.push('/') // Kick them to the homepage
      } else {
        // Otherwise, let them through
        setAuthorized(true)
      }
    }

    checkAuth()

    // Listen for logouts in real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user && !publicPaths.includes(pathname)) {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  // Prevent the page from flashing before the redirect happens
  if (!authorized) {
    return <div className="min-h-screen bg-slate-950"></div> 
  }

  return <>{children}</>
}