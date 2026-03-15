import React from 'react' // ✨ Fixes the ReactNode error
import './globals.css'
import Navigation from '././navigation' // ✨ Capital 'N' to match your file
import RouteGuard from './RouteGuard'


export const metadata = {
  title: 'FanPL Manager',
  description: 'Elite Fantasy Cricket Draft',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 min-h-screen">
        <Navigation />
        {/* ✨ The Bouncer is now on duty! */}
        <RouteGuard>
          {children}
        </RouteGuard>
      </body>
    </html>
  )
}

