"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const formatMoney = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount}`
}

export default function LiveAuctionRoom() {
  const [activePlayer, setActivePlayer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Track teams with their names AND current purses
  const [teams, setTeams] = useState<Record<string, { name: string, purse: number }>>({})
  const [myTeamId, setMyTeamId] = useState<string | null>(null)

  useEffect(() => {
    const loadAuctionRoom = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id

      if (session?.user?.email === 'deepakkannan113@gmail.com') {
        setIsAdmin(true)
      }

      // 1. Fetch all teams (now including the purse column)
      const fetchTeams = async () => {
        const { data: teamsData } = await supabase.from('teams').select('id, name, purse')
        const teamDict: Record<string, { name: string, purse: number }> = {}
        teamsData?.forEach(t => { teamDict[t.id] = { name: t.name, purse: t.purse } })
        setTeams(teamDict)
      }
      await fetchTeams()

      if (userId) {
        const { data: myTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('user_id', userId) // Check this matches your DB column (user_id / owner_id)
          .single()
        
        if (myTeam) setMyTeamId(myTeam.id)
      }

      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('auction_status', 'On Block')
        .single()
      
      setActivePlayer(playerData || null)
      setLoading(false)
    }

    loadAuctionRoom()

    // 2. Real-time listener for BOTH Players and Teams
    const channel = supabase.channel('live-auction-room')
      
      // Listen for bids and player changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        const updatedPlayer = payload.new as any
        if (updatedPlayer.auction_status === 'On Block') {
          setActivePlayer(updatedPlayer)
        } else if (activePlayer && updatedPlayer.player_id === activePlayer.player_id) {
          setActivePlayer(null)
        }
      })
      
      // Listen for purse deductions so the budget updates instantly for everyone!
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, (payload) => {
        const updatedTeam = payload.new as any
        setTeams(prev => ({
          ...prev,
          [updatedTeam.id]: { name: updatedTeam.name, purse: updatedTeam.purse }
        }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activePlayer])

  const getNextBid = (currentBid: number, basePrice: number) => {
    if (currentBid === 0) return basePrice
    if (currentBid < 20000000) return currentBid + 1000000
    if (currentBid < 50000000) return currentBid + 2500000
    if (currentBid < 100000000) return currentBid + 5000000
    return currentBid + 10000000
  }

  const handleBid = async () => {
    if (!activePlayer) return
    if (!myTeamId && !isAdmin) {
      alert("You cannot bid without an assigned team!")
      return
    }

    const nextAmount = getNextBid(activePlayer.sold_price, activePlayer.base_price)

    // ✨ NEW: Stop them if they don't have enough money in their purse!
    if (myTeamId && teams[myTeamId]?.purse < nextAmount) {
      alert("Insufficient funds in your purse for this bid!")
      return
    }

    const { error } = await supabase
      .from('players')
      .update({ sold_price: nextAmount, team_id: myTeamId }) 
      .eq('player_id', activePlayer.player_id)

    if (error) alert("Bid failed! Check console.")
  }

  // ✨ THE ADMIN HAMMER: Sell the player AND deduct the funds
  const handleSellPlayer = async () => {
    if (!activePlayer) return
    
    const isSold = activePlayer.sold_price > 0 && activePlayer.team_id
    const finalStatus = isSold ? 'Sold' : 'Unsold'

    // 1. Mark the player as Sold
    const { error: playerError } = await supabase
      .from('players')
      .update({ auction_status: finalStatus })
      .eq('player_id', activePlayer.player_id)

    if (playerError) {
      alert("Failed to update player status!")
      return
    }

    // 2. Deduct the money from the winning team's purse
    if (isSold) {
      const winningTeam = teams[activePlayer.team_id]
      const newPurseBalance = winningTeam.purse - activePlayer.sold_price

      const { error: teamError } = await supabase
        .from('teams')
        .update({ purse: newPurseBalance })
        .eq('id', activePlayer.team_id)

      if (teamError) {
        alert("Player sold, but failed to deduct purse! Check database.")
      }
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white font-bold tracking-widest uppercase">Loading War Room...</div>

  if (!activePlayer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {myTeamId && (
           <div className="absolute top-6 right-6 bg-slate-900 border border-slate-700 px-6 py-3 rounded-2xl shadow-lg">
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">My Remaining Purse</p>
             <p className="text-xl font-black text-green-400">{formatMoney(teams[myTeamId]?.purse || 0)}</p>
           </div>
        )}
        <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 text-center shadow-2xl">
          <h2 className="text-2xl font-black text-white">NO ACTIVE PLAYER</h2>
          <p className="text-slate-400 mt-2">Waiting for the Commissioner to bring a player to the block...</p>
        </div>
      </div>
    )
  }

  const currentBidDisplay = activePlayer.sold_price === 0 ? "NO BIDS YET" : formatMoney(activePlayer.sold_price)
  const nextBidAmount = getNextBid(activePlayer.sold_price, activePlayer.base_price)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      
      {/* ✨ MANAGER'S PURSE HUD */}
      {myTeamId && (
        <div className="absolute top-6 right-6 bg-slate-900 border border-slate-700 px-6 py-3 rounded-2xl shadow-lg animate-fade-in-down z-10">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{teams[myTeamId]?.name} Purse</p>
          <p className="text-xl font-black text-green-400">{formatMoney(teams[myTeamId]?.purse || 0)}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mt-16">
        
        {/* LEFT COLUMN: Player Card & Bid Button */}
        <div className="flex-1 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
          <div className="bg-slate-900 p-10 text-center border-b border-slate-700 flex-1 flex flex-col justify-center">
            <div>
              <span className="bg-blue-600 text-white text-xs font-black tracking-widest px-3 py-1 rounded-full uppercase mb-4 inline-block">
                {activePlayer.country} • {activePlayer.primary_role}
              </span>
              <h1 className="text-5xl font-black text-white mb-2">{activePlayer.full_name}</h1>
              <p className="text-slate-400 text-xl font-bold">Base Price: {formatMoney(activePlayer.base_price)}</p>
            </div>
          </div>

          <div className="p-10 text-center bg-slate-800">
            <button 
              onClick={handleBid}
              disabled={activePlayer.team_id === myTeamId}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:scale-100 active:scale-95 text-white font-black text-2xl py-6 rounded-2xl shadow-[0_0_40px_rgba(22,163,74,0.3)] disabled:shadow-none transition-all flex flex-col items-center justify-center mb-4"
            >
              <span>{activePlayer.team_id === myTeamId ? 'YOU HOLD THE BID' : 'PLACE BID'}</span>
              <span className="text-sm font-bold opacity-80 mt-1">for {formatMoney(nextBidAmount)}</span>
            </button>

            {isAdmin && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <button 
                  onClick={handleSellPlayer}
                  className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xl py-4 rounded-xl shadow-lg transition-all uppercase tracking-widest"
                >
                  🔨 Sell Player
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: The Highest Bidder Board */}
        <div className="w-full lg:w-1/3 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl p-10 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm uppercase tracking-widest text-slate-500 font-bold mb-8">Current Highest Bidder</h3>
          
          {activePlayer.team_id ? (
            <div className="animate-fade-in-up">
              <div className="w-32 h-32 bg-slate-900 border border-slate-700 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl shadow-inner">
                🏏
              </div>
              <h2 className="text-3xl font-black text-white leading-tight">
                {teams[activePlayer.team_id]?.name || 'Unknown Franchise'}
              </h2>
              <div className="mt-6 bg-slate-900 inline-block px-6 py-3 rounded-2xl border border-slate-700">
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Winning Bid</p>
                <p className="text-green-400 font-black text-3xl tracking-tighter drop-shadow-md">
                  {formatMoney(activePlayer.sold_price)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 font-medium">
              <div className="w-24 h-24 border-2 border-dashed border-slate-600 rounded-full mx-auto mb-4 flex items-center justify-center opacity-50">
                ⏳
              </div>
              Waiting for opening bid...
            </div>
          )}
        </div>

      </div>
    </div>
  )
}