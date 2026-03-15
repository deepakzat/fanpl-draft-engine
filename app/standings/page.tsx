"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function StandingsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStandings()
  }, [])

  const fetchStandings = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('teams').select('*')
    
    if (data) {
      // Sort first by Points (descending), then by NRR (descending)
      const sortedTeams = data.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points
        }
        return b.net_run_rate - a.net_run_rate
      })
      setTeams(sortedTeams)
    } else if (error) {
      console.error("Error fetching standings:", error)
    }
    setLoading(false)
  }

  // Helper function to format NRR with a plus sign and exactly 3 decimal places
  const formatNRR = (nrr: number) => {
    if (!nrr) return "0.000"
    const formatted = nrr.toFixed(3)
    return nrr > 0 ? `+${formatted}` : formatted
  }

  if (loading) return <div className="p-10 text-white text-center text-xl font-bold">Loading Leaderboard...</div>

  return (
    <div className="p-10 max-w-6xl mx-auto flex flex-col gap-8">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-10 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-amber-600"></div>
        <div className="text-center">
          <h1 className="text-5xl font-black text-white mb-2 flex justify-center items-center gap-4">
            🏆 League Standings
          </h1>
          <p className="text-slate-400 uppercase tracking-widest font-bold text-sm">Official Franchise Leaderboard</p>
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-widest font-bold">
                <th className="py-5 pl-8 w-16 text-center">Pos</th>
                <th className="py-5 pl-4">Franchise</th>
                <th className="py-5 text-center">Played</th>
                <th className="py-5 text-center">Won</th>
                <th className="py-5 text-center">Lost</th>
                <th className="py-5 text-center">NRR</th>
                <th className="py-5 pr-8 text-center text-yellow-400">Points</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => {
                const isPlayoffPosition = index < 4; // Top 4 qualify
                
                return (
                  <tr 
                    key={team.team_id} 
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${isPlayoffPosition ? 'bg-green-900/10' : ''}`}
                  >
                    {/* Position */}
                    <td className="py-5 pl-8 text-center">
                      <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center font-black text-sm ${isPlayoffPosition ? 'bg-green-600 text-white shadow-[0_0_10px_rgba(22,163,74,0.5)]' : 'bg-slate-700 text-slate-400'}`}>
                        {index + 1}
                      </div>
                    </td>
                    
                    {/* ✨ UPDATED: Franchise Name & Logo Section */}
                    <td className="py-5 pl-4">
                      <div className="flex items-center gap-4">
                        {team.logo_url ? (
                          <img 
                            src={team.logo_url} 
                            alt={`${team.team_name} Logo`} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-600 shadow-md bg-slate-900 shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-900 border border-dashed border-slate-600 flex items-center justify-center text-sm shrink-0">
                            🛡️
                          </div>
                        )}
                        <div>
                          <p className="font-black text-white text-lg leading-tight">{team.team_name}</p>
                          {isPlayoffPosition && index === 0 && (
                            <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mt-1">League Leaders</p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Stats */}
                    <td className="py-5 text-center font-bold text-slate-300">{team.matches_played || 0}</td>
                    <td className="py-5 text-center font-black text-green-400">{team.matches_won || 0}</td>
                    <td className="py-5 text-center font-black text-red-400">{team.matches_lost || 0}</td>
                    
                    {/* NRR */}
                    <td className="py-5 text-center font-mono font-bold text-slate-300">
                      {formatNRR(team.net_run_rate)}
                    </td>
                    
                    {/* Points */}
                    <td className="py-5 pr-8 text-center">
                      <span className="text-2xl font-black text-white bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 shadow-inner inline-block min-w-[60px]">
                        {team.points || 0}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Playoff Key Footer */}
        <div className="bg-slate-900 p-4 border-t border-slate-700 flex justify-center items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-600"></span>
            Top 4 Qualify for Playoffs
          </div>
        </div>
      </div>

    </div>
  )
}