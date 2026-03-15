"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function LiveMatchPage() {
  const [nextMatch, setNextMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSimulating, setIsSimulating] = useState(false)
  
  const [liveData, setLiveData] = useState<any>(null)
  // ✨ NEW: Tracks how many updates have been revealed
  const [visibleUpdates, setVisibleUpdates] = useState<number>(0)
  
  // Auto-scroll reference to pull the screen down as new updates arrive
  const feedEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNextMatch()
  }, [])

  // ✨ NEW: The "Live Feed" Timer
  useEffect(() => {
    // If we have data, and we haven't shown all the updates yet...
    if (liveData && visibleUpdates < liveData.match_updates.length) {
      const timer = setTimeout(() => {
        setVisibleUpdates(prev => prev + 1)
      }, 4000) // ⏱️ Reveals a new update every 4 seconds!
      
      return () => clearTimeout(timer)
    }
  }, [liveData, visibleUpdates])

  // Auto-scroll to bottom whenever a new update is revealed
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleUpdates])

  const fetchNextMatch = async () => {
    setLoading(true)
    const { data: matchData } = await supabase.from('matches').select('*').eq('status', 'Scheduled').order('match_id', { ascending: true }).limit(1).single()
    
    if (matchData) {
      const { data: teamA } = await supabase.from('teams').select('team_name').eq('team_id', matchData.team_a_id).single()
      const { data: teamB } = await supabase.from('teams').select('team_name').eq('team_id', matchData.team_b_id).single()
      setNextMatch({ ...matchData, team_a_name: teamA?.team_name, team_b_name: teamB?.team_name })
    }
    setLoading(false)
  }

  const startLiveSimulation = async () => {
    setIsSimulating(true)
    setVisibleUpdates(0) // Reset the counter for a new match
    try {
      const res = await fetch('/api/simulate-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: nextMatch.match_id || nextMatch.id })
      })
      
      const data = await res.json()
      if (data.success) {
        setLiveData(data.result)
      } else {
        alert("Simulation Error.")
      }
    } catch (e) {
      alert("Network Error.")
    }
    setIsSimulating(false)
  }

  if (loading) return <div className="p-10 text-white text-center">Tuning into broadcast...</div>

  return (
    <div className="p-10 max-w-5xl mx-auto flex flex-col gap-8">
      
      {!nextMatch ? (
        <div className="bg-slate-800 p-10 rounded-3xl text-center text-slate-400 text-xl font-bold border border-slate-700">
          No scheduled matches available to broadcast.
        </div>
      ) : (
        <>
          {/* Pre-Match Header */}
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center flex flex-col items-center">
            <span className="bg-red-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full animate-pulse mb-6">Live Broadcast</span>
            <p className="text-slate-400 font-bold tracking-widest uppercase mb-2">📍 {nextMatch.venue}</p>
            <h1 className="text-5xl font-black text-white mb-8">{nextMatch.team_a_name} <span className="text-slate-600">vs</span> {nextMatch.team_b_name}</h1>
            
            {!liveData && (
              <button 
                onClick={startLiveSimulation} 
                disabled={isSimulating}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black py-4 px-12 rounded-xl text-xl shadow-[0_0_40px_rgba(37,99,235,0.4)] transition-all"
              >
                {isSimulating ? '📡 CONNECTING TO ENGINE...' : '▶ START MATCH'}
              </button>
            )}
          </div>

          {/* The Live Data Feed */}
          {liveData && (
            <div className="flex flex-col gap-10 mt-4 animate-fade-in">
              
              {/* Pitch Report: Shows immediately */}
              <div className="bg-slate-800 border-l-8 border-yellow-500 p-8 rounded-r-3xl shadow-xl">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                  🏟️ Pitch & Ground Report
                </h3>
                <div className="grid md:grid-cols-3 gap-8 text-sm">
                  <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 font-bold uppercase tracking-widest block mb-2 border-b border-slate-700 pb-2">Characteristics</span>
                    <p className="text-slate-200 leading-relaxed">{liveData.ground_conditions?.characteristics}</p>
                  </div>
                  <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 font-bold uppercase tracking-widest block mb-2 border-b border-slate-700 pb-2">Batting Physics</span>
                    <p className="text-slate-200 leading-relaxed">{liveData.ground_conditions?.batting}</p>
                  </div>
                  <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                    <span className="text-slate-400 font-bold uppercase tracking-widest block mb-2 border-b border-slate-700 pb-2">Bowling Physics</span>
                    <p className="text-slate-200 leading-relaxed">{liveData.ground_conditions?.bowling}</p>
                  </div>
                </div>
              </div>

              {/* Live Commentary Feed: Uses the slice() method to only show the revealed updates */}
              <div className="space-y-8">
                <h3 className="text-3xl font-black text-white border-b border-slate-700 pb-4 flex items-center gap-3">
                  <span className="text-red-500 animate-pulse">🔴</span> Live Match Timeline
                </h3>

                <div className="flex flex-col gap-6">
                  {liveData.match_updates.slice(0, visibleUpdates).map((update: any, index: number) => (
                    <div key={index} className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-fade-in-up">
                      
                      {/* Header */}
                      <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-600 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-md shadow-lg">
                            Innings {update.innings}
                          </span>
                          <span className="text-slate-300 font-bold text-sm uppercase tracking-widest">
                            {update.overs_completed} Overs Update
                          </span>
                        </div>
                        <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                          Win Prob: <span className="text-white">{update.win_probability}</span>
                        </span>
                      </div>

                      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                        {/* Score Block */}
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Live Score</p>
                          <h4 className="text-7xl font-black text-white mb-2 tracking-tighter">{update.live_score}</h4>
                          <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-bold bg-slate-900/50 inline-flex px-4 py-2 rounded-lg border border-slate-700">
                            <span className="text-slate-400">CRR: <span className="text-yellow-400">{update.crr}</span></span>
                            {update.rrr !== "N/A" && (
                              <>
                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                <span className="text-slate-400">RRR: <span className="text-red-400">{update.rrr}</span></span>
                              </>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mt-4 font-bold">Last 2 Overs: <span className="text-white bg-slate-700 px-2 py-1 rounded ml-1">{update.last_two_overs}</span></p>
                        </div>

                        {/* Middle Block: Batters */}
                        <div className="flex-1 w-full">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">🏏 At The Crease</p>
                          <div className="text-blue-100 text-sm font-mono whitespace-pre-line leading-loose bg-slate-900/80 p-5 rounded-2xl border border-blue-900/30 shadow-inner">
                            {update.current_batters}
                          </div>
                          <p className="text-slate-400 text-xs mt-3 font-bold px-2">Partnership: <span className="text-white">{update.partnership}</span></p>
                        </div>

                        {/* Right Block: Bowler & Wicket */}
                        <div className="flex-1 w-full flex flex-col gap-3">
                          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/50">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">🎯 Last Bowler</p>
                            <p className="text-white font-mono text-sm">{update.last_bowler_stats}</p>
                          </div>
                          {update.last_wicket !== "None" && update.last_wicket !== "N/A" && (
                            <div className="bg-red-900/20 p-5 rounded-2xl border border-red-900/30">
                              <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">❌ Last Wicket</p>
                              <p className="text-red-200 font-mono text-sm">{update.last_wicket}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Invisible element to auto-scroll to */}
                  <div ref={feedEndRef} />
                </div>
              </div>

              {/* ✨ NEW: End of Match Summary ONLY shows when all updates are finished */}
              {visibleUpdates === liveData.match_updates.length && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 rounded-3xl border border-slate-700 shadow-2xl mt-8 text-center relative overflow-hidden animate-fade-in-up">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-green-500"></div>
                  <h2 className="text-4xl font-black text-white mb-4">🏆 Match Result</h2>
                  <p className="text-3xl text-yellow-400 font-black mb-6 uppercase tracking-wider">{liveData.end_of_match_summary?.winner} <span className="text-white">{liveData.end_of_match_summary?.win_margin}</span></p>
                  
                  <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 mb-8 inline-block text-left max-w-2xl w-full">
                     <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 border-b border-slate-800 pb-2">Player of the Match</p>
                     <p className="text-white font-bold text-lg">{liveData.end_of_match_summary?.player_of_the_match}</p>
                  </div>

                  <p className="text-slate-300 italic max-w-4xl mx-auto leading-relaxed text-lg px-4 border-l-4 border-slate-600">
                    "{liveData.end_of_match_summary?.emotional_recap}"
                  </p>
                </div>
              )}

            </div>
          )}
        </>
      )}
    </div>
  )
}