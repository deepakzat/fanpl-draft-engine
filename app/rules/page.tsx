"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function RulesPage() {
  const [leagueRules, setLeagueRules] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeagueRules = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .eq('league_name', 'FanPL Premier League')
        .single()
      
      if (data) setLeagueRules(data)
      setLoading(false)
    }

    fetchLeagueRules()
  }, [])

  if (loading) return <div className="p-10 text-white text-center text-xl font-bold min-h-[70vh] flex items-center justify-center">Loading Simulation Parameters...</div>

  if (!leagueRules) return <div className="p-10 text-white text-center font-bold">Error loading ruleset. Please contact the Commissioner.</div>

  return (
    <div className="p-10 max-w-5xl mx-auto flex flex-col gap-8">
      
      {/* Header */}
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-blue-600 px-6 py-2 rounded-bl-2xl font-black text-white tracking-widest text-sm shadow-lg">
          ACTIVE ENGINE: {leagueRules.format}
        </div>
        <h1 className="text-4xl font-black text-white mb-2">📜 Official League Handbook</h1>
        <p className="text-slate-400 text-lg">Live simulation parameters and drafting constraints for the current active format.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Draft & Roster Constraints */}
        <div className="space-y-4">
            
            {/* ✨ NEW SQUAD LIMITS */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-600 flex justify-between items-center shadow-inner">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Squad Size</p>
                <p className="text-sm text-slate-400">Min and Max roster limits</p>
              </div>
              <span className="text-xl font-black text-cyan-400">
                {leagueRules.min_squad_size} - {leagueRules.max_squad_size}
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-600 flex justify-between items-center shadow-inner">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Max Overseas (Squad)</p>
                <p className="text-sm text-slate-400">Total foreign slots per team</p>
              </div>
              <span className="text-xl font-black text-pink-400">
                {leagueRules.max_overseas_squad}
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-600 flex justify-between items-center shadow-inner">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Max Overseas (Playing XI)</p>
                <p className="text-sm text-slate-400">Strict limit per starting lineup</p>
              </div>
              <span className="text-2xl font-black text-pink-500">
                {leagueRules.max_overseas_xi}
              </span>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-600 flex justify-between items-center shadow-inner">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Host Country Bias</p>
                <p className="text-sm text-slate-400">Domestic talent pool</p>
              </div>
              <span className="text-lg font-black text-blue-400 uppercase">
                {leagueRules.host_country}
              </span>
            </div>
            
          </div>

        {/* Simulation Mechanics */}
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚙️</span>
            <h2 className="text-2xl font-bold text-white">Engine Mechanics</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            How the match simulator calculates stamina, economy rates, and over distribution based on the {leagueRules.format} format.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-600">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Total Deliveries</p>
                <p className="text-xl font-black text-cyan-400">{leagueRules.total_match_balls} <span className="text-sm font-bold text-slate-500">per innings</span></p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-600">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Set Length</p>
                <p className="text-xl font-black text-cyan-400">{leagueRules.balls_per_over} <span className="text-sm font-bold text-slate-500">balls</span></p>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-600 flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Max Bowler Workload</p>
                <p className="text-[10px] text-slate-400">Stamina penalty applied after limit</p>
              </div>
              <span className="text-xl font-black text-yellow-400">{leagueRules.max_overs_per_bowler} {leagueRules.format === '100-ball' ? 'Sets' : 'Overs'}</span>
            </div>
          </div>
        </div>

        {/* Ground Conditions & Pitch Modifiers */}
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🌍</span>
            <h2 className="text-2xl font-bold text-white">Pitch Condition Modifiers</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            The simulation engine applies heavy algorithmic weighting based on the ground type. Managers should consult the Draft Advisor to target players whose specific styles align with these parameters.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-xl border-t-4 border-yellow-500 shadow-inner">
              <h4 className="font-black text-white mb-2">Flat Track</h4>
              <p className="text-xs text-slate-400">Batting impact multiplied. High strike-rate batters receive a +15% simulation boost. Bowler economy heavily penalized.</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border-t-4 border-green-500 shadow-inner">
              <h4 className="font-black text-white mb-2">Green Top</h4>
              <p className="text-xs text-slate-400">Pace and Swing bowlers gain increased edge-probability. "Right-arm fast" styles receive optimal simulation weighting.</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border-t-4 border-orange-700 shadow-inner">
              <h4 className="font-black text-white mb-2">Spin Paradise</h4>
              <p className="text-xs text-slate-400">Dustbowl mechanics engaged. "Offbreak" and "Legbreak" styles receive massive turn multipliers in the middle overs.</p>
            </div>
            <div className="bg-slate-900 p-5 rounded-xl border-t-4 border-slate-500 shadow-inner">
              <h4 className="font-black text-white mb-2">Slow Pitch</h4>
              <p className="text-xs text-slate-400">Grip and hold conditions. "Medium" pace cutters and variation bowlers see improved economy rates. Power hitting heavily nerfed.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}