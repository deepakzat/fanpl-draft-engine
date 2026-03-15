"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function LiveAuctionHall() {
  const [player, setPlayer] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [currentBid, setCurrentBid] = useState(0)
  const [biddingTeam, setBiddingTeam] = useState('')
  const [loading, setLoading] = useState(true)
  
  // ✨ THE SECRET ADMIN TOKEN STATE ✨
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // 1. Check if they are logged in as Admin!
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('fanpl_admin')
      if (auth === 'true') setIsAdmin(true)
    }

    fetchCurrentPlayer()
    fetchTeams()

    // 2. Realtime Subscription so everyone sees the player pop up instantly!
    const channel = supabase
      .channel('public:players')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players' }, (payload) => {
         if (payload.new.auction_status === 'On Block') {
           setPlayer(payload.new)
           setCurrentBid(payload.new.base_price)
           setBiddingTeam('')
         } else if (payload.new.auction_status === 'Sold' || payload.new.auction_status === 'Available') {
           setPlayer((prev: any) => (prev && prev.player_id === payload.new.player_id ? null : prev))
         }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchCurrentPlayer = async () => {
    setLoading(true)
    const { data } = await supabase.from('players').select('*').eq('auction_status', 'On Block').limit(1).single()
    if (data) {
      setPlayer(data)
      setCurrentBid(data.base_price)
    } else {
      setPlayer(null)
    }
    setLoading(false)
  }

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*')
    if (data) setTeams(data)
  }

  const handleSellPlayer = async () => {
    if (!biddingTeam) return alert("Select a bidding team first!")
    if (!player) return
    
    const team = teams.find(t => t.team_id.toString() === biddingTeam)
    if (!team) return
    if (team.available_purse < currentBid) return alert("Not enough purse remaining!")

    await supabase.from('players').update({ auction_status: 'Sold', sold_price: currentBid, team_id: team.team_id }).eq('player_id', player.player_id)
    await supabase.from('teams').update({ available_purse: team.available_purse - currentBid }).eq('team_id', team.team_id)

    alert(`SOLD to ${team.team_name} for ₹${(currentBid / 10000000).toFixed(2)} Cr!`)
    setPlayer(null)
  }

  const handleUnsoldPlayer = async () => {
    if (!player) return
    await supabase.from('players').update({ auction_status: 'Available' }).eq('player_id', player.player_id)
    alert("Player passed as UNSOLD.")
    setPlayer(null)
  }

  if (loading) return <div className="p-10 text-white text-center text-2xl">Entering Auction Hall...</div>

  return (
    <div className="p-10 max-w-5xl mx-auto flex flex-col gap-8 text-center">
      
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <h1 className="text-4xl font-black text-white">🔨 Live Auction Hall</h1>
        <p className="text-slate-400 mt-2 text-lg">
          {isAdmin ? 'You are controlling the auction.' : 'Watch the live bidding happen!'}
        </p>
      </div>

      {!player ? (
        <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-3xl py-24 text-center shadow-xl">
           <p className="text-6xl mb-6">⏳</p>
           <h2 className="text-3xl font-bold text-white mb-2">Waiting for next player...</h2>
           <p className="text-slate-400 text-xl">The Admin is selecting the next player to bring to the block.</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-3xl border border-blue-900/50 shadow-2xl overflow-hidden animate-pulse-slow">
          
          <div className="p-10 flex flex-col items-center border-b border-slate-700">
             <div className="w-32 h-32 bg-slate-700 rounded-full flex items-center justify-center text-5xl shadow-inner mb-6">👤</div>
             <h2 className="text-5xl font-black text-white mb-4">{player.full_name || player.player_name || player.name}</h2>
             <span className="text-sm font-bold uppercase tracking-wider bg-slate-700 text-slate-300 py-2 px-6 rounded-full mb-6">
               {player.primary_role || player.role}
             </span>
             <p className="text-slate-400 text-lg uppercase tracking-widest font-bold">Base Price</p>
             <p className="text-3xl font-bold text-green-400">₹{((player.base_price || 0) / 10000000).toFixed(2)} Cr</p>
          </div>

          <div className="p-10 bg-slate-900 flex flex-col items-center">
            <p className="text-slate-400 text-lg uppercase tracking-widest font-bold mb-2">Current Bid</p>
            <p className="text-6xl font-black text-yellow-400 mb-8">₹{(currentBid / 10000000).toFixed(2)} Cr</p>

            {/* ✨ THIS IS THE WRAPPED ADMIN-ONLY CONSOLE ✨ */}
            {isAdmin && (
              <div className="w-full max-w-2xl bg-slate-800 p-6 rounded-2xl border border-slate-700">
                <p className="text-red-400 text-xs uppercase tracking-widest font-bold mb-4">Admin Override Controls</p>
                
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <button onClick={() => setCurrentBid(prev => prev + 1000000)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">+ ₹10L</button>
                  <button onClick={() => setCurrentBid(prev => prev + 2000000)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">+ ₹20L</button>
                  <button onClick={() => setCurrentBid(prev => prev + 5000000)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl">+ ₹50L</button>
                </div>

                <select 
                  value={biddingTeam}
                  onChange={(e) => setBiddingTeam(e.target.value)}
                  className="bg-slate-900 border border-slate-600 text-white rounded-xl p-4 w-full outline-none focus:ring-2 focus:ring-blue-500 font-bold cursor-pointer mb-6"
                >
                  <option value="">-- Select Highest Bidding Team --</option>
                  {teams.map(t => (
                    <option key={t.team_id} value={t.team_id}>
                      {t.team_name} (Purse: ₹{(t.available_purse / 10000000).toFixed(2)}Cr)
                    </option>
                  ))}
                </select>

                <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={handleSellPlayer} className="flex-2 bg-green-600 hover:bg-green-500 text-white font-black py-4 px-8 rounded-xl shadow-lg w-full">
                    🔨 SELL PLAYER
                  </button>
                  <button onClick={handleUnsoldPlayer} className="flex-1 bg-slate-900 hover:bg-slate-700 text-slate-300 font-bold py-4 px-8 rounded-xl shadow-lg border border-slate-700 w-full">
                    ❌ UNSOLD
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}