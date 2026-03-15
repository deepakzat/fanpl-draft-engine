"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// 🏏 Helper to format big numbers into Crores (Cr) and Lakhs (L)
const formatMoney = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount}`
}

export default function LiveAuctionRoom() {
  const [activePlayer, setActivePlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 1. Fetch the player currently "On Block"
  useEffect(() => {
    const fetchActivePlayer = async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('auction_status', 'On Block')
        .single()
      
      setActivePlayer(data || null)
      setLoading(false)
    }

    fetchActivePlayer()

    // 2. Listen for real-time bid updates from other managers!
    const channel = supabase
      .channel('live-auction')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        const updatedPlayer = payload.new as any
        if (updatedPlayer.auction_status === 'On Block') {
          setActivePlayer(updatedPlayer)
        } else if (activePlayer && updatedPlayer.player_id === activePlayer.player_id) {
          // If the player was sold or removed, clear the board
          setActivePlayer(null)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activePlayer])

  // ✨ THE MATH: Calculate the exact next bid increment
  const getNextBid = (currentBid: number, basePrice: number) => {
    // If no one has bid yet, the first bid is exactly the base price
    if (currentBid === 0) return basePrice

    // If Price is below 2Cr -> Increase by 10 Lakhs
    if (currentBid < 20000000) return currentBid + 1000000

    // If Price is between 2Cr and 5Cr -> Increase by 25 Lakhs
    if (currentBid < 50000000) return currentBid + 2500000

    // If Price is between 5Cr and 10Cr -> Increase by 50 Lakhs
    if (currentBid < 100000000) return currentBid + 5000000

    // If Price is 10Cr or above -> Increase by 1 Crore
    return currentBid + 10000000
  }

  // 3. Handle the Bid Button Click
  const handleBid = async () => {
    if (!activePlayer) return

    const nextAmount = getNextBid(activePlayer.sold_price, activePlayer.base_price)

    const { error } = await supabase
      .from('players')
      .update({ sold_price: nextAmount }) // Update the price in the database
      .eq('player_id', activePlayer.player_id)

    if (error) {
      console.error("Failed to place bid:", error.message)
      alert("Bid failed! Check console.")
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading War Room...</div>
  }

  if (!activePlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 text-center shadow-2xl">
          <h2 className="text-2xl font-black text-white">NO ACTIVE PLAYER</h2>
          <p className="text-slate-400 mt-2">Waiting for the Commissioner to bring a player to the block...</p>
        </div>
      </div>
    )
  }

  // Determine the display prices
  const currentBidDisplay = activePlayer.sold_price === 0 ? "NO BIDS YET" : formatMoney(activePlayer.sold_price)
  const nextBidAmount = getNextBid(activePlayer.sold_price, activePlayer.base_price)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-2xl overflow-hidden">
        
        {/* Player Header */}
        <div className="bg-slate-900 p-8 text-center border-b border-slate-700">
          <span className="bg-blue-600 text-white text-xs font-black tracking-widest px-3 py-1 rounded-full uppercase mb-4 inline-block">
            {activePlayer.country} • {activePlayer.primary_role}
          </span>
          <h1 className="text-5xl font-black text-white mb-2">{activePlayer.full_name}</h1>
          <p className="text-slate-400 text-lg font-bold">Base Price: {formatMoney(activePlayer.base_price)}</p>
        </div>

        {/* Bidding Zone */}
        <div className="p-8 text-center">
          <p className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-2">Current Bid</p>
          <div className="text-6xl font-black text-green-400 mb-8 tracking-tighter drop-shadow-lg">
            {currentBidDisplay}
          </div>

          {/* THE BID BUTTON */}
          <button 
            onClick={handleBid}
            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 active:scale-95 text-white font-black text-2xl py-6 rounded-2xl shadow-[0_0_40px_rgba(22,163,74,0.3)] transition-all flex flex-col items-center justify-center"
          >
            <span>PLACE BID</span>
            <span className="text-sm font-bold opacity-80 mt-1">
              for {formatMoney(nextBidAmount)}
            </span>
          </button>
        </div>

      </div>
    </div>
  )
}