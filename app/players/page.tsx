"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function PlayersPage() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [condition, setCondition] = useState('')
  
  // League States
  const [hostCountry, setHostCountry] = useState('')
  const [activeTournament, setActiveTournament] = useState('')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const playersPerPage = 50 

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter, condition])

  const fetchData = async () => {
    setLoading(true)

    // ✨ NEW: Fetch both the Host Country AND the Tournament Name
    const { data: leagueData } = await supabase
      .from('leagues')
      .select('host_country, tournament_name')
      .eq('league_name', 'FanPL Premier League')
      .single()

    if (leagueData) {
      if (leagueData.host_country) setHostCountry(leagueData.host_country)
      if (leagueData.tournament_name) setActiveTournament(leagueData.tournament_name)
    }

    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .order('base_price', { ascending: false })
    
    if (playersData) {
      const uniquePlayers = Array.from(new Map(playersData.map(p => [p.player_id, p])).values())
      setPlayers(uniquePlayers)
    }
    
    setLoading(false)
  }

  const filteredPlayers = players.filter(p => {
    const nameMatch = (p.full_name || p.player_name || p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const roleMatch = roleFilter ? (p.primary_role || p.role) === roleFilter : true
    const statusMatch = statusFilter ? p.auction_status === statusFilter : true

    // Ground Condition Filter
    let conditionMatch = true
    const role = p.primary_role || p.role || ''
    const bowlStyle = (p.bowling_style || '').toLowerCase()

    if (condition === 'Spin Paradise') conditionMatch = bowlStyle.includes('break') || bowlStyle.includes('orthodox') || bowlStyle.includes('spin')
    else if (condition === 'Green Top') conditionMatch = bowlStyle.includes('fast') || bowlStyle.includes('medium fast') || bowlStyle.includes('pace')
    else if (condition === 'Flat Track') conditionMatch = ['Batter', 'Wicket Keeper'].includes(role)
    else if (condition === 'Slow Pitch') conditionMatch = bowlStyle.includes('medium') && !bowlStyle.includes('fast')

    // ✨ NEW: Strict Gender Filtering
    const playerGender = p.gender || 'Male'
    let genderMatch = true
    if (activeTournament === 'WPL') {
      genderMatch = playerGender === 'Female'
    } else if (activeTournament === 'Mixed T20S') {
      genderMatch = true // Shows everyone
    } else {
      genderMatch = playerGender === 'Male'
    }

    return nameMatch && roleMatch && statusMatch && conditionMatch && genderMatch
  })

  const indexOfLastPlayer = currentPage * playersPerPage
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage
  const currentPlayers = filteredPlayers.slice(indexOfFirstPlayer, indexOfLastPlayer)
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage)

  if (loading) return <div className="p-10 text-white text-center text-xl font-bold">Loading Player Pool...</div>

  return (
    <div className="p-6 max-w-[1600px] mx-auto flex flex-col gap-6">
      
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black text-white">🏏 Draft Pool & Scouting</h1>
          <span className="bg-slate-900 text-blue-400 font-bold px-4 py-2 rounded-lg text-sm border border-slate-700">
            {filteredPlayers.length} Players Found
          </span>
        </div>
        
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="🔍 Search by player name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
          />
          
          <div className="flex flex-col md:flex-row gap-3">
            <select 
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-600 text-purple-400 rounded-xl p-4 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm cursor-pointer"
            >
              <option value="">🌍 Draft Advisor: All Conditions</option>
              <option value="Flat Track">Flat Track (Batting)</option>
              <option value="Green Top">Green Top (Pace)</option>
              <option value="Spin Paradise">Spin Paradise</option>
              <option value="Slow Pitch">Slow Pitch (Cutters)</option>
            </select>

            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-600 text-blue-400 rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm cursor-pointer"
            >
              <option value="">🏏 All Roles</option>
              <option value="Batter">Batter</option>
              <option value="Bowler">Bowler</option>
              <option value="All-Rounder">All-Rounder</option>
              <option value="Wicket Keeper">Wicket Keeper</option>
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-600 text-green-400 rounded-xl p-4 outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm cursor-pointer"
            >
              <option value="">🏷️ All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Block">On Block</option>
              <option value="Sold">Sold</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
        {currentPlayers.map((player) => {
          
          // Overseas check dynamically applies to both men and women based on host_country
          const isOverseas = Boolean(
            hostCountry && 
            player.country && 
            player.country.trim().toLowerCase() !== hostCountry.trim().toLowerCase()
          );

          return (
            <div key={player.player_id} className="bg-slate-800 p-2 rounded-lg border border-slate-700 hover:border-blue-500 transition-all flex flex-col gap-1 relative overflow-hidden group">
              
              <div className={`absolute top-0 left-0 w-full h-1 ${
                player.auction_status === 'Sold' ? 'bg-red-500' : 
                player.auction_status === 'On Block' ? 'bg-yellow-500' : 
                'bg-green-500'
              }`} />

              <div className="flex items-center gap-1 mt-1 overflow-hidden">
                <span className="font-bold text-white text-[11px] truncate" title={player.full_name}>
                  {player.full_name}
                </span>
                {isOverseas && <span className="text-[10px] shrink-0" title={`Overseas (${player.country})`}>✈️</span>}
              </div>

              <div className="flex justify-between items-end mt-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase">
                  {player.primary_role === 'Wicket Keeper' ? 'WK' : player.primary_role}
                </span>
                <span className="text-[10px] font-black text-yellow-400">
                  {(player.base_price / 100000).toFixed(0)}L
                </span>
              </div>
              
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
          >
            ◀ Prev
          </button>
          <span className="text-slate-400 font-bold text-sm">
            Page <span className="text-white">{currentPage}</span> of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
          >
            Next ▶
          </button>
        </div>
      )}

      {filteredPlayers.length === 0 && (
        <div className="text-center text-slate-500 py-20 text-xl font-bold">
          No players match your scouting criteria.
        </div>
      )}

    </div>
  )
}