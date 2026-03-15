"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function DraftAdvisor() {
  const [condition, setCondition] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // ✨ NEW: League Intelligence State
  const [leagueRules, setLeagueRules] = useState<any>(null)

  // 1. Fetch the active ruleset the moment the Advisor loads
  useEffect(() => {
    const fetchLeagueRules = async () => {
      const { data } = await supabase.from('leagues').select('*').eq('league_name', 'FanPL Premier League').single()
      if (data) setLeagueRules(data)
    }
    fetchLeagueRules()
  }, [])

  const getSuggestions = async (selectedCondition: string) => {
    setCondition(selectedCondition)
    if (!selectedCondition || !leagueRules) {
      setSuggestions([])
      return
    }

    setLoading(true)
    
    // Fetch ALL available players first so we can run our custom AI sorting
    const { data, error } = await supabase.from('players').select('*').eq('auction_status', 'Available')
    
    if (data) {
      // 🧠 PHASE 1: THE PITCH AI (Filter by Ground Conditions)
      let filtered = data.filter(p => {
        let conditionMatch = true
        const role = p.primary_role || p.role || ''
        const bowlStyle = (p.bowling_style || '').toLowerCase()

        if (selectedCondition === 'Spin Paradise (Dustbowl)') {
          conditionMatch = bowlStyle.includes('break') || bowlStyle.includes('orthodox') || bowlStyle.includes('spin')
        } else if (selectedCondition === 'Green Top (Pace & Swing)') {
          conditionMatch = bowlStyle.includes('fast') || bowlStyle.includes('medium fast') || bowlStyle.includes('pace')
        } else if (selectedCondition === 'Flat Track (Batting Paradise)') {
          conditionMatch = ['Batter', 'Wicket Keeper'].includes(role)
        } else if (selectedCondition === 'Slow Pitch (Grip & Hold)') {
          conditionMatch = bowlStyle.includes('medium') && !bowlStyle.includes('fast')
        }

        return conditionMatch
      })

      // 🧠 PHASE 2: THE LEAGUE AI (Sort by Ruleset Constraints)
      filtered.sort((a, b) => {
        const isADomestic = a.country === leagueRules.host_country
        const isBDomestic = b.country === leagueRules.host_country
        
        // If the league is highly restricted (4 or fewer overseas allowed)
        if (leagueRules.max_overseas_xi <= 4) {
          // Instantly prioritize Domestic players who fit the pitch criteria
          if (isADomestic && !isBDomestic) return -1
          if (!isADomestic && isBDomestic) return 1
        }
        
        // If both are domestic (or both overseas), sort by their base price/quality
        return b.base_price - a.base_price
      })

      // Return only the top 10 most tactically sound picks
      setSuggestions(filtered.slice(0, 10))
    }
    
    if (error) console.error("Error fetching suggestions:", error)
    setLoading(false)
  }

  return (
    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl mt-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h3 className="text-xl font-black text-white">Draft Advisor</h3>
            <p className="text-slate-400 text-sm">Select ground conditions for tactical player suggestions</p>
          </div>
        </div>

        {/* Dynamic Ruleset Display */}
        {leagueRules && (
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-600 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Rules:</span>
            <span className="text-sm font-black text-cyan-400">{leagueRules.format}</span>
            <span className="text-slate-600">|</span>
            <span className="text-sm font-black text-cyan-400">Max {leagueRules.max_overseas_xi} Overseas</span>
          </div>
        )}
      </div>

      <select 
        value={condition}
        onChange={(e) => getSuggestions(e.target.value)}
        className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-4 mb-6 outline-none focus:ring-2 focus:ring-blue-500 font-bold cursor-pointer"
      >
        <option value="">-- Analyze Pitch Conditions --</option>
        <option value="Flat Track (Batting Paradise)">Flat Track (Batting Paradise)</option>
        <option value="Green Top (Pace & Swing)">Green Top (Pace & Swing)</option>
        <option value="Spin Paradise (Dustbowl)">Spin Paradise (Dustbowl)</option>
        <option value="Slow Pitch (Grip & Hold)">Slow Pitch (Grip & Hold)</option>
      </select>

      {loading ? (
        <div className="text-center text-blue-400 font-bold py-8">Analyzing pitch conditions and league constraints...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestions.map((player) => {
            const isDomestic = player.country === leagueRules?.host_country

            return (
              <div key={player.player_id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col gap-3 hover:border-blue-500 transition-colors relative overflow-hidden">
                
                {/* Visual Flair for League Constraints */}
                <div className={`absolute top-0 right-0 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-bl-lg ${
                  isDomestic ? 'bg-blue-900/80 text-blue-300' : 'bg-pink-900/80 text-pink-300'
                }`}>
                  {isDomestic ? '🏠 Domestic' : '✈️ Overseas'}
                </div>

                <div>
                  <p className="font-bold text-white text-lg pr-20">{player.full_name}</p>
                  <div className="flex gap-2 text-xs font-bold uppercase tracking-wider mt-1">
                    <span className="text-blue-400">{player.primary_role}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      {condition.includes('Spin') || condition.includes('Green') || condition.includes('Slow') 
                        ? player.bowling_style 
                        : player.batting_style}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-end border-t border-slate-800 pt-2 mt-1">
                  <p className="text-slate-500 text-[10px] font-bold uppercase">Estimated Value</p>
                  <p className="text-yellow-400 font-black">₹{(player.base_price / 100000).toFixed(0)}L</p>
                </div>
              </div>
            )
          })}
          
          {suggestions.length === 0 && condition && (
            <div className="col-span-2 text-center text-slate-500 py-6 font-bold">No available players match this exact condition.</div>
          )}
        </div>
      )}
    </div>
  )
}