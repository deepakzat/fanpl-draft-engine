"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

// 🧠 THE MASTER AI RULEBOOK
const LEAGUE_RULES: Record<string, any> = {
  'IPL': { format: 'T20', host_country: 'India', total_innings_overs: 20, total_match_balls: 120, balls_per_over: 6, max_overs_per_bowler: 4, max_overseas_xi: 4, min_squad_size: 18, max_squad_size: 25, max_overseas_squad: 8 },
  'WPL': { format: 'T20', host_country: 'India', total_innings_overs: 20, total_match_balls: 120, balls_per_over: 6, max_overs_per_bowler: 4, max_overseas_xi: 5, min_squad_size: 15, max_squad_size: 18, max_overseas_squad: 6 },
  'Mixed T20S': { format: 'T20', host_country: 'India', total_innings_overs: 20, total_match_balls: 120, balls_per_over: 6, max_overs_per_bowler: 4, max_overseas_xi: 4, min_squad_size: 15, max_squad_size: 20, max_overseas_squad: 8 },
  'The Hundred': { format: '100-ball', host_country: 'England', total_innings_overs: 20, total_match_balls: 100, balls_per_over: 5, max_overs_per_bowler: 4, max_overseas_xi: 3, min_squad_size: 15, max_squad_size: 16, max_overseas_squad: 4 },
  'ILT20': { format: 'T20', host_country: 'United Arab Emirates', total_innings_overs: 20, total_match_balls: 120, balls_per_over: 6, max_overs_per_bowler: 4, max_overseas_xi: 9, min_squad_size: 18, max_squad_size: 22, max_overseas_squad: 14 },
  'T10': { format: 'T10', host_country: 'United Arab Emirates', total_innings_overs: 10, total_match_balls: 60, balls_per_over: 6, max_overs_per_bowler: 2, max_overseas_xi: 4, min_squad_size: 15, max_squad_size: 20, max_overseas_squad: 8 },
  'SA20': { format: 'T20', host_country: 'South Africa', total_innings_overs: 20, total_match_balls: 120, balls_per_over: 6, max_overs_per_bowler: 4, max_overseas_xi: 4, min_squad_size: 17, max_squad_size: 19, max_overseas_squad: 7 }
}

export default function AdminControlPanel() {
  const [authLoading, setAuthLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [loading, setLoading] = useState(false)
  const [playerIdToNominate, setPlayerIdToNominate] = useState('')
  const [players, setPlayers] = useState<any[]>([])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [condition, setCondition] = useState('')
  
  const [selectedLeagueFormat, setSelectedLeagueFormat] = useState('')

  const [profiles, setProfiles] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')

  useEffect(() => {
    const verifyAdmin = async () => {
      setAuthLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
        
        if (data?.is_admin) {
          setIsAdmin(true)
          fetchAvailablePlayers()
          fetchProfilesAndTeams()
          fetchCurrentLeagueFormat()
        }
      }
      setAuthLoading(false)
    }

    verifyAdmin()
  }, [])

  // ✨ UPDATED: Now fetches the exact tournament name directly!
  const fetchCurrentLeagueFormat = async () => {
    const { data } = await supabase.from('leagues').select('tournament_name').eq('league_name', 'FanPL Premier League').single()
    if (data?.tournament_name) {
      setSelectedLeagueFormat(data.tournament_name)
    } else {
      setSelectedLeagueFormat('IPL') // Default fallback
    }
  }

  const fetchAvailablePlayers = async () => {
    const { data } = await supabase.from('players').select('*').neq('auction_status', 'Sold')
    if (data) {
      const sortedData = data.sort((a, b) => {
        const nameA = a.full_name || a.player_name || a.name || ''
        const nameB = b.full_name || b.player_name || b.name || ''
        return nameA.localeCompare(nameB)
      })
      setPlayers(sortedData)
    }
  }

  const fetchProfilesAndTeams = async () => {
    const { data: profileData } = await supabase.from('profiles').select('*')
    if (profileData) setProfiles(profileData)
    
    const { data: teamData } = await supabase.from('teams').select('*')
    if (teamData) setTeams(teamData)
  }

  const handleUpdateLeague = async (leagueKey: string) => {
    if (!leagueKey) return
    if (!confirm(`WARNING: Changing the ruleset to ${leagueKey} will instantly alter draft constraints. Proceed?`)) return
    
    setLoading(true)
    setSelectedLeagueFormat(leagueKey)
    const rules = LEAGUE_RULES[leagueKey]
    
    const { error } = await supabase
      .from('leagues')
      .update({ 
        tournament_name: leagueKey, // ✨ NEW: Stores the exact tournament name!
        format: rules.format,
        host_country: rules.host_country,
        total_innings_overs: rules.total_innings_overs,
        total_match_balls: rules.total_match_balls,
        balls_per_over: rules.balls_per_over,
        max_overs_per_bowler: rules.max_overs_per_bowler,
        max_overseas_xi: rules.max_overseas_xi,
        min_squad_size: rules.min_squad_size,
        max_squad_size: rules.max_squad_size,
        max_overseas_squad: rules.max_overseas_squad
      })
      .eq('league_name', 'FanPL Premier League')
      
    if (error) alert("Database Error: Failed to apply league constraints.")
    else alert(`🎯 RULESET ENGAGED! The AI Draft Engine is now calibrated for ${leagueKey}.`)
    
    setLoading(false)
  }

  const handleNominate = async () => {
    if (!playerIdToNominate) return alert("Please select a player from the list first!")
    setLoading(true)
    
    await supabase.from('players').update({ auction_status: 'Available' }).eq('auction_status', 'On Block')
    const { error } = await supabase.from('players').update({ auction_status: 'On Block' }).eq('player_id', playerIdToNominate)
    
    if (error) {
      alert("Error nominating player.")
    } else {
      const selected = players.find(p => (p.player_id || p.id).toString() === playerIdToNominate)
      const playerName = selected ? (selected.full_name || selected.player_name || selected.name) : 'The selected player'
      alert(`SUCCESS! ${playerName} is now live on the Auction Block!`)
      setPlayerIdToNominate('')
      fetchAvailablePlayers()
    }
    setLoading(false)
  }

  const handleEndAuction = async () => {
    if (confirm("Are you sure? This will officially close the auction!")) {
      setLoading(true)
      await supabase.from('leagues').update({ auction_status: 'Completed' }).eq('league_name', 'FanPL Premier League')
      alert("AUCTION OFFICIALLY CLOSED!")
      setLoading(false)
    }
  }

  const handleReopenAuction = async () => {
    if (confirm("Are you sure? This will RE-OPEN the auction!")) {
      setLoading(true)
      await supabase.from('leagues').update({ auction_status: 'Live' }).eq('league_name', 'FanPL Premier League')
      alert("AUCTION IS LIVE AGAIN!")
      setLoading(false)
    }
  }

  const handleAssignTeam = async () => {
    if (!selectedProfile || !selectedTeam) return alert("Select both a user and a team!")
    
    setLoading(true)
    const { error } = await supabase.from('teams').update({ user_id: selectedProfile }).eq('team_id', selectedTeam)
      
    if (error) alert("Error assigning team.")
    else {
      alert("Franchise successfully awarded to user!")
      fetchProfilesAndTeams() 
    }
    
    setSelectedProfile('')
    setSelectedTeam('')
    setLoading(false)
  }

  // ✨ UPDATED: Adding Gender Filter to the Admin Nomination Ledger
  const filteredPlayers = players.filter(p => {
    const nameMatch = (p.full_name || p.player_name || p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    let conditionMatch = true
    const role = p.primary_role || p.role || ''
    const bowlStyle = (p.bowling_style || '').toLowerCase()

    if (condition === 'Spin Paradise') conditionMatch = bowlStyle.includes('break') || bowlStyle.includes('orthodox') || bowlStyle.includes('spin')
    else if (condition === 'Green Top') conditionMatch = bowlStyle.includes('fast') || bowlStyle.includes('medium fast') || bowlStyle.includes('pace')
    else if (condition === 'Flat Track') conditionMatch = ['Batter', 'Wicket Keeper'].includes(role)
    else if (condition === 'Slow Pitch') conditionMatch = bowlStyle.includes('medium') && !bowlStyle.includes('fast')

    // Gender Logic
    const playerGender = p.gender || 'Male'
    let genderMatch = true
    if (selectedLeagueFormat === 'WPL') {
      genderMatch = playerGender === 'Female'
    } else if (selectedLeagueFormat === 'Mixed T20S') {
      genderMatch = true // Show everyone
    } else {
      genderMatch = playerGender === 'Male'
    }

    return nameMatch && conditionMatch && genderMatch
  })

  const activeHostCountry = LEAGUE_RULES[selectedLeagueFormat]?.host_country || 'India'

  if (authLoading) return <div className="p-10 text-white text-center text-xl font-bold flex flex-col items-center justify-center min-h-[70vh]">Verifying Credentials...</div>

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full text-center">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-3xl font-black text-white mb-2">Access Restricted</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">You do not have Commissioner privileges.</p>
          <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all w-full block">GO TO SECURE LOGIN</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-10 max-w-6xl mx-auto flex flex-col gap-8">
      
      {/* Header */}
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-4">⚙️ Commissioner Console</h1>
          <p className="text-slate-400 mt-2 text-lg">Master override for the FanPL Database</p>
        </div>
        <div className="bg-slate-900 px-6 py-3 rounded-xl border border-slate-600 shadow-inner text-right">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Active Ruleset</p>
          <p className="text-xl font-black text-cyan-400">{selectedLeagueFormat || 'Loading...'}</p>
        </div>
      </div>

      {/* GLOBAL LEAGUE SETTINGS */}
      <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-3">🌍 Global League Configuration</h2>
        <div className="flex flex-wrap gap-3">
          {Object.keys(LEAGUE_RULES).map((leagueName) => (
            <button
              key={leagueName}
              onClick={() => handleUpdateLeague(leagueName)}
              className={`px-6 py-3 rounded-lg font-black text-xs uppercase tracking-wider transition-all shadow-lg ${
                selectedLeagueFormat === leagueName 
                  ? 'bg-cyan-600 text-white border-2 border-cyan-400' 
                  : 'bg-slate-900 text-slate-400 border border-slate-600 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {leagueName}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: COMPACT NOMINATION LEDGER */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <h2 className="text-xl font-bold text-white">Live Auction Control</h2>
            <span className="bg-slate-900 text-blue-400 text-xs font-bold px-3 py-1 rounded border border-slate-600">
              {filteredPlayers.length} Available
            </span>
          </div>
          
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="🔍 Search names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
            />
            <select 
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-40 bg-slate-900 border border-slate-600 text-purple-400 rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-xs cursor-pointer"
            >
              <option value="">🌍 All Pitches</option>
              <option value="Flat Track">Flat Track</option>
              <option value="Green Top">Green Top</option>
              <option value="Spin Paradise">Spin</option>
              <option value="Slow Pitch">Slow</option>
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-600 rounded-lg h-80 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredPlayers.length === 0 ? (
              <p className="text-slate-500 p-4 text-center text-sm font-bold mt-10">No players match these parameters.</p>
            ) : (
              filteredPlayers.map(p => {
                const isOverseas = Boolean(p.country && p.country.trim().toLowerCase() !== activeHostCountry.trim().toLowerCase());
                const isSelected = playerIdToNominate === (p.player_id || p.id);

                return (
                  <button
                    key={p.player_id || p.id}
                    onClick={() => setPlayerIdToNominate(p.player_id || p.id)}
                    className={`w-full text-left px-3 py-2 rounded mb-1 transition-all flex justify-between items-center border ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden pr-2">
                      <span className="font-bold text-sm truncate">{p.full_name || p.player_name || p.name}</span>
                      {isOverseas && <span className="text-[10px] shrink-0">✈️</span>}
                      <span className={`text-[10px] uppercase tracking-wider hidden sm:inline-block shrink-0 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                        • {p.primary_role === 'Wicket Keeper' ? 'WK' : p.primary_role}
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className={`text-[9px] uppercase font-bold tracking-widest ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>Base</span>
                      <span className="text-xs text-yellow-400 font-black">
                        {(p.base_price / 100000).toFixed(0)}L
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <button onClick={handleNominate} disabled={loading || !playerIdToNominate} className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all w-full mt-1">
            {loading ? 'Sending...' : 'Send to Auction Block'}
          </button>
        </div>

        {/* RIGHT COLUMN: Overrides & Allocation */}
        <div className="flex flex-col gap-8">
          
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-3">System Overrides</h2>
            <div className="flex gap-4">
              <button onClick={handleReopenAuction} disabled={loading} className="flex-1 bg-yellow-600/80 hover:bg-yellow-500 text-white font-bold py-3 text-sm rounded-xl shadow-lg border border-yellow-500 transition-all">
                ⏪ Re-Open
              </button>
              <button onClick={handleEndAuction} disabled={loading} className="flex-1 bg-red-900/80 hover:bg-red-700 text-red-100 font-bold py-3 text-sm rounded-xl shadow-lg border border-red-700 transition-all">
                🛑 Close Auction
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-2xl flex flex-col gap-4">
            <h2 className="text-xl font-bold text-white border-b border-slate-700 pb-3">🤝 Franchise Allocation</h2>
            <div className="flex flex-col gap-3">
              <select 
                value={selectedProfile}
                onChange={(e) => setSelectedProfile(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm cursor-pointer"
              >
                <option value="">-- Select Registered Manager --</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.email}</option>)}
              </select>

              <select 
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 w-full outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm cursor-pointer"
              >
                <option value="">-- Assign to Franchise --</option>
                {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.team_name} {t.user_id ? '(Owned)' : ''}</option>)}
              </select>

              <button 
                onClick={handleAssignTeam} 
                disabled={loading || !selectedProfile || !selectedTeam} 
                className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-black tracking-widest uppercase py-4 rounded-xl shadow-lg transition-all w-full mt-1"
              >
                Assign Owner
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}