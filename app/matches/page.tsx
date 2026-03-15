"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: teamData } = await supabase.from('teams').select('*')
    if (teamData) setTeams(teamData)

    const { data: matchData, error } = await supabase.from('matches').select('*').order('match_id', { ascending: true })
    if (error) console.error("Error fetching matches:", error)

    if (matchData && teamData) {
      const mergedMatches = matchData.map(match => ({
        ...match,
        team_a: teamData.find(t => t.team_id === match.team_a_id) || { team_name: 'Unknown' },
        team_b: teamData.find(t => t.team_id === match.team_b_id) || { team_name: 'Unknown' },
        winner: teamData.find(t => t.team_id === match.winner_id) || null
      }))
      setMatches(mergedMatches)
    }
    setLoading(false)
  }

  const generateSchedule = async () => {
    setIsGenerating(true)
    if (teams.length < 2) {
      alert("You need at least 2 teams to generate a schedule!")
      setIsGenerating(false); return;
    }

    const newMatches = []
    const venues = ["Edgbaston, Birmingham", "Wankhede Stadium, Mumbai", "Chepauk Stadium, Chennai", "Lords, London"]

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const randomVenue = venues[Math.floor(Math.random() * venues.length)]
        newMatches.push({
          league_id: teams[0].league_id,
          team_a_id: teams[i].team_id,
          team_b_id: teams[j].team_id,
          status: 'Scheduled',
          venue: randomVenue
        })
      }
    }

    await supabase.from('matches').insert(newMatches)
    await fetchData()
    setIsGenerating(false)
  }

  if (loading) return <div className="p-10 text-white text-center text-2xl">Loading Calendar...</div>

  return (
    <div className="p-10 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <h1 className="text-4xl font-black text-white">📅 Schedule & Results</h1>
        <p className="text-slate-400 mt-2 text-lg">Past scorecards and upcoming fixtures</p>
      </div>

      {matches.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-3xl py-20 text-center shadow-xl">
          <p className="text-6xl mb-6">📅</p>
          <h2 className="text-3xl font-bold text-white mb-4">No Matches Scheduled</h2>
          <button onClick={generateSchedule} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-xl text-xl shadow-lg transition-all">
            {isGenerating ? 'GENERATING...' : '⚙️ AUTO-GENERATE SCHEDULE'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {matches.map((match, index) => (
            <div key={match.match_id || match.id || index} className={`rounded-3xl border shadow-xl overflow-hidden bg-slate-800 ${match.status === 'Completed' ? 'border-slate-700 opacity-80' : 'border-blue-900/50'}`}>
              <div className="bg-slate-900 px-6 py-3 border-b border-slate-700 flex justify-between items-center">
                <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">Match {index + 1} • {match.venue}</p>
                <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${match.status === 'Completed' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'}`}>
                  {match.status}
                </span>
              </div>

              <div className="p-8 flex items-center justify-between gap-8">
                
                {/* ✨ UPDATED: TEAM A (Left Side, aligned right) */}
                <div className="flex-1 flex flex-col items-end w-full">
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black text-white">{match.team_a?.team_name}</h3>
                    {match.team_a?.logo_url ? (
                      <img src={match.team_a.logo_url} alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 bg-slate-900 shadow-md" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-dashed border-slate-600 flex items-center justify-center text-xl">🛡️</div>
                    )}
                  </div>
                  {match.status === 'Completed' && (
                    <p className="text-slate-300 text-xl font-bold mt-2 mr-16">{match.team_a_runs}/{match.team_a_wickets} <span className="text-sm text-slate-500">({match.team_a_overs} ov)</span></p>
                  )}
                </div>

                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center font-black text-slate-500 border-2 border-slate-800 shrink-0">VS</div>

                {/* ✨ UPDATED: TEAM B (Right Side, aligned left) */}
                <div className="flex-1 flex flex-col items-start w-full">
                  <div className="flex items-center gap-4">
                    {match.team_b?.logo_url ? (
                      <img src={match.team_b.logo_url} alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 bg-slate-900 shadow-md" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-dashed border-slate-600 flex items-center justify-center text-xl">🛡️</div>
                    )}
                    <h3 className="text-2xl font-black text-white">{match.team_b?.team_name}</h3>
                  </div>
                  {match.status === 'Completed' && (
                    <p className="text-slate-300 text-xl font-bold mt-2 ml-16">{match.team_b_runs}/{match.team_b_wickets} <span className="text-sm text-slate-500">({match.team_b_overs} ov)</span></p>
                  )}
                </div>

              </div>
              
              {/* ✨ UPDATED: Winner Banner with mini-logo */}
              {match.status === 'Completed' && match.winner && (
                <div className="bg-slate-900/50 p-4 flex items-center justify-center gap-3 border-t border-slate-700">
                  {match.winner.logo_url && (
                    <img src={match.winner.logo_url} alt="Winner Logo" className="w-6 h-6 rounded-full object-cover" />
                  )}
                  <p className="text-yellow-400 font-bold">🏆 {match.winner.team_name} won {match.win_margin ? `(${match.win_margin})` : ''}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}