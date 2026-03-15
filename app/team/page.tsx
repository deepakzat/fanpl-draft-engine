"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function MyTeamPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [roster, setRoster] = useState<any[]>([])
  
  const [leagueRules, setLeagueRules] = useState<any>(null)
  // ✨ NEW: UI Indicator to assure users their session is safe
  const [sessionStatus, setSessionStatus] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [])

  // ✨ NEW: Real-time Auto-Saver to Browser Cache
  useEffect(() => {
    if (roster.length > 0 && team?.team_id) {
      sessionStorage.setItem(`roster_cache_${team.team_id}`, JSON.stringify(roster))
      setSessionStatus('Draft Auto-Saved ☁️')
      
      // Hide the text after a few seconds so it doesn't distract
      const timer = setTimeout(() => setSessionStatus(''), 2500)
      return () => clearTimeout(timer)
    }
  }, [roster, team])

  const fetchUserData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      setUser(session.user)
      
      const { data: rulesData } = await supabase.from('leagues').select('*').eq('league_name', 'FanPL Premier League').single()
      if (rulesData) setLeagueRules(rulesData)

      const { data: teamData } = await supabase.from('teams').select('*').eq('user_id', session.user.id).single()
        
      if (teamData) {
        setTeam(teamData)
        const { data: playerData } = await supabase.from('players').select('*').eq('team_id', teamData.team_id).eq('auction_status', 'Sold')
          
        if (playerData) {
          let sortedRoster = playerData.sort((a, b) => (a.full_name || a.name || '').localeCompare(b.full_name || b.name || ''))
          
          // ✨ AUTO-RESTORE LOGIC: On screen reload, intercept the DB data and merge any unsaved changes!
          const cachedSession = sessionStorage.getItem(`roster_cache_${teamData.team_id}`)
          if (cachedSession) {
            const parsedCache = JSON.parse(cachedSession)
            sortedRoster = sortedRoster.map(dbPlayer => {
              const cachedPlayer = parsedCache.find((cp: any) => cp.player_id === dbPlayer.player_id)
              // If they had unsaved tactics in the cache, overwrite the DB data with them
              return cachedPlayer ? { ...dbPlayer, ...cachedPlayer } : dbPlayer
            })
          }

          setRoster(sortedRoster)
        }
      }
    }
    setLoading(false)
  }

  // --- TACTICS HANDLERS ---
  const handleTogglePlaying = (playerId: number, isPlaying: boolean) => {
    const currentlyPlaying = roster.filter(p => p.is_playing).length
    if (isPlaying && currentlyPlaying >= 11) return alert("You can only select 11 players for the Match-Day squad!")
    
    setRoster(prev => prev.map(p => p.player_id === playerId ? { ...p, is_playing: isPlaying } : p))
  }

  const handleInputTactics = (playerId: number, field: string, value: any) => {
    setRoster(prev => prev.map(p => p.player_id === playerId ? { ...p, [field]: value } : p))
  }

  const toggleSpecialRole = (playerId: number, role: 'is_captain' | 'is_vice_captain' | 'is_wk') => {
    setRoster(prev => prev.map(p => {
      if (p.player_id === playerId) {
        const isCurrentlyRole = p[role]
        return { 
          ...p, 
          [role]: !isCurrentlyRole, 
          specific_overs: (role === 'is_wk' && !isCurrentlyRole) ? '' : p.specific_overs 
        }
      } else {
        return { ...p, [role]: false }
      }
    }))
  }

  const handleSaveTactics = async () => {
    setSaving(true)
    
    const playingCount = roster.filter(p => p.is_playing).length
    if (playingCount !== 11 && playingCount !== 0) {
      alert(`You have selected ${playingCount} players. A legal lineup must have exactly 11 players.`)
      setSaving(false)
      return
    }

    const playingXI = roster.filter(p => p.is_playing)

    if (leagueRules && playingCount === 11) {
      const playingOverseasCount = playingXI.filter(p => 
        p.country && 
        p.country.trim().toLowerCase() !== leagueRules.host_country.trim().toLowerCase()
      ).length

      if (playingOverseasCount > leagueRules.max_overseas_xi) {
        alert(`🚨 RULE VIOLATION: Your active format (${leagueRules.format}) only allows a maximum of ${leagueRules.max_overseas_xi} overseas players in the Match-Day XI. You currently have ${playingOverseasCount} selected.`)
        setSaving(false)
        return
      }

      if (leagueRules.format !== '100-ball') {
        for (const player of playingXI) {
          if (player.specific_overs && !player.is_wk) {
            const overs = player.specific_overs
              .split(',')
              .map((s: string) => parseInt(s.trim()))
              .filter((n: number) => !isNaN(n))
              .sort((a: number, b: number) => a - b)
            
            for (let i = 0; i < overs.length - 1; i++) {
              if (overs[i] + 1 === overs[i + 1]) {
                alert(`🚨 ILLEGAL SPELL: ${player.full_name || player.name} is scheduled to bowl consecutive overs (${overs[i]} & ${overs[i+1]}). In the ${leagueRules.format} format, a bowler cannot bowl continuous overs!`)
                setSaving(false)
                return
              }
            }
          }
        }
      }
    }

    try {
      const updatePromises = roster.map(player => 
        supabase.from('players').update({
          is_playing: player.is_playing || false,
          batting_order: player.batting_order || null,
          specific_overs: player.specific_overs || null,
          is_captain: player.is_captain || false,
          is_vice_captain: player.is_vice_captain || false,
          is_wk: player.is_wk || false
        }).eq('player_id', player.player_id)
      )

      await Promise.all(updatePromises)
      
      // Clear the local cache once it's officially locked into the DB
      sessionStorage.removeItem(`roster_cache_${team.team_id}`)
      
      alert("Match Tactics Saved Successfully! Your lineup is locked in.")
    } catch (error) {
      alert("Error saving tactics.")
    }
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-white text-center text-xl font-bold">Accessing Locker Room...</div>

  if (!user || !team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full text-center">
          <div className="text-6xl mb-6">{!user ? '🛑' : '⏳'}</div>
          <h2 className="text-3xl font-black text-white mb-4">{!user ? 'Access Denied' : 'Awaiting Franchise'}</h2>
          {!user && <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl w-full block">GO TO LOGIN</Link>}
        </div>
      </div>
    )
  }

  const playingXI = roster.filter(p => p.is_playing).sort((a, b) => (a.batting_order || 99) - (b.batting_order || 99))
  
  const hostCountryLower = leagueRules?.host_country?.trim().toLowerCase() || ''
  const overseasInSquad = roster.filter(p => p.country && p.country.trim().toLowerCase() !== hostCountryLower).length
  const overseasInXI = playingXI.filter(p => p.country && p.country.trim().toLowerCase() !== hostCountryLower).length

  return (
    <div className="p-10 max-w-7xl mx-auto flex flex-col gap-8">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-blue-400 font-bold tracking-widest uppercase text-xs mb-1">Franchise Locker Room</p>
          <h1 className="text-4xl font-black text-white">{team.team_name}</h1>
        </div>
        <div className="flex gap-4 items-center">
          
          {/* ✨ Subtly lets the manager know their progress is saved locally */}
          {sessionStatus && (
            <span className="text-xs font-bold text-slate-400 animate-pulse mr-2">
              {sessionStatus}
            </span>
          )}

          <div className="bg-slate-950/50 px-6 py-3 rounded-xl border border-slate-800 text-center shadow-inner">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Purse Remaining</p>
            <p className="text-2xl font-black text-green-400">₹{(team.available_purse / 10000000).toFixed(2)}Cr</p>
          </div>
          <button onClick={handleSaveTactics} disabled={saving} className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-black py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all">
            {saving ? '☁️ SYNCING...' : '✅ VALIDATE & LOCK XI'}
          </button>
        </div>
      </div>

      {/* SQUAD CONSTRAINTS DASHBOARD */}
      {leagueRules && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center justify-center text-center ${roster.length < leagueRules.min_squad_size ? 'border-red-500' : ''}`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Squad</span>
            <span className={`text-xl font-black ${roster.length < leagueRules.min_squad_size ? 'text-red-400' : 'text-white'}`}>
              {roster.length} <span className="text-sm font-bold text-slate-500">/ {leagueRules.max_squad_size}</span>
            </span>
            {roster.length < leagueRules.min_squad_size && <span className="text-[10px] text-red-400 font-bold mt-1">Needs {leagueRules.min_squad_size} Min</span>}
          </div>
          
          <div className={`bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center justify-center text-center ${overseasInSquad > leagueRules.max_overseas_squad ? 'border-red-500' : ''}`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Overseas (Squad)</span>
            <span className={`text-xl font-black ${overseasInSquad > leagueRules.max_overseas_squad ? 'text-red-400' : 'text-pink-400'}`}>
              {overseasInSquad} <span className="text-sm font-bold text-slate-500">/ {leagueRules.max_overseas_squad}</span>
            </span>
          </div>

          <div className={`bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center justify-center text-center ${playingXI.length !== 11 && playingXI.length !== 0 ? 'border-yellow-500' : ''}`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Match-Day XI</span>
            <span className={`text-xl font-black ${playingXI.length === 11 ? 'text-green-400' : 'text-yellow-400'}`}>
              {playingXI.length} <span className="text-sm font-bold text-slate-500">/ 11</span>
            </span>
          </div>

          <div className={`bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center justify-center text-center ${overseasInXI > leagueRules.max_overseas_xi ? 'border-red-500 bg-red-950/20' : ''}`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Overseas (In XI)</span>
            <span className={`text-xl font-black ${overseasInXI > leagueRules.max_overseas_xi ? 'text-red-400' : 'text-pink-400'}`}>
              {overseasInXI} <span className="text-sm font-bold text-slate-500">/ {leagueRules.max_overseas_xi}</span>
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* LEFT COLUMN: FULL SQUAD TABLE */}
        <div className="xl:col-span-1 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[800px]">
          <div className="p-6 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
            <h3 className="text-xl font-black text-white flex items-center gap-2">👥 Full Squad</h3>
            <span className="text-xs font-bold bg-slate-800 text-slate-300 py-1 px-3 rounded-md">{roster.length} Players</span>
          </div>
          
          <div className="overflow-y-auto p-4 flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-700">
                  <th className="pb-3 pl-2">In XI</th>
                  <th className="pb-3 pl-2">Player</th>
                  <th className="pb-3 text-right pr-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {roster.map(player => {
                  const isOverseas = Boolean(hostCountryLower && player.country && player.country.trim().toLowerCase() !== hostCountryLower);

                  return (
                    <tr key={player.player_id} className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${player.is_playing ? 'bg-blue-900/10' : ''}`}>
                      <td className="py-4 pl-2">
                        <input 
                          type="checkbox" 
                          checked={player.is_playing || false}
                          onChange={(e) => handleTogglePlaying(player.player_id, e.target.checked)}
                          className="w-5 h-5 rounded bg-slate-900 border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 pl-2 font-bold text-white text-sm">
                        <div className="flex items-center gap-1">
                          {player.full_name || player.player_name || player.name}
                          {isOverseas && <span className="text-[10px] shrink-0" title={`Overseas (${player.country})`}>✈️</span>}
                        </div>
                      </td>
                      <td className="py-4 pr-2 text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-900 text-slate-400 py-1 px-2 rounded">
                          {player.primary_role || player.role}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: PLAYING XI TACTICS BOARD */}
        <div className="xl:col-span-2 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
            <h3 className="text-xl font-black text-white flex items-center gap-2">📋 Match-Day Tactics</h3>
            <p className="text-sm font-bold text-slate-400">Selected: <span className={playingXI.length === 11 ? 'text-green-400' : 'text-yellow-400'}>{playingXI.length}/11</span></p>
          </div>

          <div className="p-6 overflow-x-auto">
            {playingXI.length === 0 ? (
              <div className="text-center py-20 text-slate-500 font-bold border-2 border-dashed border-slate-700 rounded-2xl">
                Select players from your squad to build the Match-Day XI.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-widest border-b border-slate-700">
                    <th className="pb-3 w-16 text-center">Bat</th>
                    <th className="pb-3 pl-4">Player</th>
                    <th className="pb-3 text-center">Leadership / WK</th>
                    <th className="pb-3 pr-4 text-right">Bowling Spells</th>
                  </tr>
                </thead>
                <tbody>
                  {playingXI.map(player => {
                    const isOverseas = Boolean(hostCountryLower && player.country && player.country.trim().toLowerCase() !== hostCountryLower);
                    
                    const bowlingPlaceholder = player.is_wk 
                      ? "WK Cannot Bowl" 
                      : (leagueRules?.format === '100-ball' ? "e.g. 1, 2, 18, 19" : "e.g. 1, 3, 17, 19");

                    return (
                      <tr key={player.player_id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                        
                        <td className="py-3 text-center">
                          <input 
                            type="number" 
                            min="1" max="11"
                            value={player.batting_order || ''}
                            onChange={(e) => handleInputTactics(player.player_id, 'batting_order', parseInt(e.target.value))}
                            className="bg-slate-900 border border-slate-600 text-white rounded w-12 text-center py-2 text-sm font-black outline-none focus:border-blue-500"
                          />
                        </td>

                        <td className="py-3 pl-4">
                          <div className="flex items-center gap-1 font-bold text-white text-base">
                            {player.full_name || player.player_name || player.name}
                            {isOverseas && <span className="text-xs shrink-0" title={`Overseas (${player.country})`}>✈️</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{player.primary_role || player.role}</p>
                        </td>

                        <td className="py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => toggleSpecialRole(player.player_id, 'is_captain')}
                              className={`w-8 h-8 rounded-full text-xs font-black transition-all ${player.is_captain ? 'bg-yellow-500 text-yellow-950 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-slate-900 text-slate-500 border border-slate-700 hover:text-white'}`}
                              title="Captain"
                            >C</button>
                            <button 
                              onClick={() => toggleSpecialRole(player.player_id, 'is_vice_captain')}
                              className={`w-8 h-8 rounded-full text-xs font-black transition-all ${player.is_vice_captain ? 'bg-blue-500 text-blue-950 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-900 text-slate-500 border border-slate-700 hover:text-white'}`}
                              title="Vice Captain"
                            >VC</button>
                            <button 
                              onClick={() => toggleSpecialRole(player.player_id, 'is_wk')}
                              className={`w-8 h-8 rounded-full text-xs font-black transition-all ${player.is_wk ? 'bg-green-500 text-green-950 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-900 text-slate-500 border border-slate-700 hover:text-white'}`}
                              title="Wicket Keeper"
                            >WK</button>
                          </div>
                        </td>

                        <td className="py-3 pr-4 text-right">
                          <input 
                            type="text" 
                            placeholder={bowlingPlaceholder}
                            disabled={player.is_wk}
                            value={player.specific_overs || ''}
                            onChange={(e) => handleInputTactics(player.player_id, 'specific_overs', e.target.value)}
                            className="bg-slate-900 border border-slate-600 text-white rounded w-full max-w-[180px] px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}