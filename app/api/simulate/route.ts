import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: Request) {
  try {
    const { match_id } = await request.json()

    // 1. Fetch the Match and Team Details
    const { data: match } = await supabase.from('matches').select('*').eq('match_id', match_id).single()
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

    const { data: teamA } = await supabase.from('teams').select('*').eq('team_id', match.team_a_id).single()
    const { data: teamB } = await supabase.from('teams').select('*').eq('team_id', match.team_b_id).single()

    // 2. Fetch the Playing 11s for BOTH teams
    const { data: players } = await supabase
      .from('players')
      .select('*')
      .in('team_id', [match.team_a_id, match.team_b_id])
      .eq('is_playing', true)

    // Sort by batting order before sending to the AI so the lineup makes logical sense
    const rosterA = players?.filter(p => p.team_id === match.team_a_id).sort((a, b) => (a.batting_order || 99) - (b.batting_order || 99)) || []
    const rosterB = players?.filter(p => p.team_id === match.team_b_id).sort((a, b) => (a.batting_order || 99) - (b.batting_order || 99)) || []

    // 3. ✨ NEW: Smart Roster Formatting with C, VC, WK and Bowling Spells
    const formatRoster = (roster: any[]) => roster.map(p => {
      let roleTags = []
      if (p.is_captain) roleTags.push('C')
      if (p.is_vice_captain) roleTags.push('VC')
      if (p.is_wk) roleTags.push('WK')
      
      const tags = roleTags.length > 0 ? ` [${roleTags.join(', ')}]` : ''
      const bowling = p.specific_overs ? ` | Bowling: ${p.specific_overs}` : ''
      
      return `${p.batting_order}. ${p.full_name || p.name} (${p.primary_role})${tags}${bowling}`
    }).join('\n')

    // 4. THE MASTER PROMPT
    const prompt = `
      You are an expert Cricket Match Simulation Engine. 
      Simulate a realistic T20 cricket match between ${teamA.team_name} and ${teamB.team_name}.
      
      VENUE: ${match.venue}
      TIME: 19:30 Local Time

      TEAM A PLAYING XI (In Batting Order): 
      ${formatRoster(rosterA)}
      
      TEAM B PLAYING XI (In Batting Order): 
      ${formatRoster(rosterB)}

      =================
      🏟️ GROUND CONDITIONS & PITCH REPORT
      Based on the provided VENUE, fetch its real-world historical data and define it exactly in the JSON output. The simulation's scoring rate, boundary frequency, and types of dismissals MUST actively reflect these characteristics.

      =================
      PITCH-DRIVEN REALISM
      * Tough wickets: Lower strike rates, more false shots, patient innings.
      * Flat wickets: Higher scoring, more boundaries, aggressive middle overs.
      * The pitch must visibly shape scoring patterns and dismissals.

      PERFORMANCE MIRRORS REAL LIFE
      * Anchors: High-average players usually bat longer and anchor innings.
      * Aggressors: High strike-rate batters score faster but carry higher dismissal risk.
      * Finishers: Accelerate sharply in final overs (16-20).
      * Set Batters: Should find boundaries more easily than new batters.

      RULES
      * 20 overs per side | Max 4 overs per bowler | Powerplay = first 6 overs.
      * Scoring patterns must be realistic and consistent across innings.

      =================
      ⚙️ GAMEPLAY LOGIC (STRICT)
      BATTING LOGIC
      * Phasing: Overs 1-6 (Attack field restrictions) -> 7-15 (Target spinners, rotate strike) -> 16-20 (High variance hitting).
      * On tough pitches: Skilled batters adapt through strike rotation and selective aggression.
      * Settling: New batters MUST play cautiously for first 5 balls (except Death overs).
      * Roles: Maintain one Anchor (low risk) and one Aggressor. If 2 wickets fall quickly, next pair enters "Consolidation Mode".

      BOWLING PHYSICS & FIELDING
      * Ball Wear: Swing ends after Over 4. 
      * Variations: Pacers use cross-seam/slower balls predominantly in overs 16-20.
      * Spin: Flighted deliveries for turn; flat/fast trajectory for containment. Adapt to the fetched venue conditions.
      * Wicket-Keeper: The player tagged with [WK] is the ONLY player who can execute stumpings and designated wicket-keeper catches. The [WK] CANNOT bowl under any circumstances.

      CAPTAINCY
      * The player tagged with [C] is the Captain. They dictate the tactical bowling changes and field placements.
      * Field starts attacking. Becomes defensive if partnership >40 runs. Squeeze field brings slips back immediately after a wicket.

      ==================
      MATCH DYNAMICS & COMMENTARY
      * Natural Events: Include wides, no-balls, byes, leg-byes, overthrows.
      * No Fantasy Heroics: All momentum shifts should be organic and sensible.
      * Real-World Stats Integration: Performance for all players must be strictly based on their real-world overall T20 statistics. Use their actual historical strike rates, averages, and strengths/weaknesses to determine how they play.

      =================
      OUTPUT INSTRUCTIONS (CRITICAL)
      You are an API endpoint. You MUST return the entire match in a single valid JSON object. Do not use markdown blocks.
      You must calculate and provide a "5 OVER UPDATE" exactly at Overs 5, 10, 15, and 20 for BOTH innings.

      JSON FORMAT:
      {
        "ground_conditions": {
          "characteristics": "Known for...",
          "batting": "Excellent for batting...",
          "bowling": "Seamers get good bounce..."
        },
        "match_updates": [
          {
            "innings": 1,
            "overs_completed": 5,
            "live_score": "45/1",
            "last_two_overs": "18/0",
            "equation": "N/A",
            "crr": "9.00",
            "rrr": "N/A",
            "win_probability": "Team A 55%",
            "projected_score": "180",
            "current_batters": "M. Patel [C]: 22* (14) | SR: 157.14 | Control: 85%\\nA. Rawat [WK]: 12* (10) | SR: 120.00 | Control: 90%",
            "partnership": "30 (20)",
            "last_bowler_stats": "Bumrah: 2-0-14-1",
            "last_wicket": "Sharma - 10(6) - Caught at slip"
          }
        ],
        "end_of_match_summary": {
          "winner": "Team Name",
          "win_margin": "e.g., won by 12 runs",
          "player_of_the_match": "Player Name (Reason)",
          "turning_point": "Identify the specific over or tactical change.",
          "pitch_report_validation": "Did the pitch behave as promised?",
          "phase_analysis": "Who won the Powerplay, Middle, and Death overs?",
          "emotional_recap": "A 2-paragraph energetic broadcast-style storytelling of the match."
        },
        "team_a_final_runs": 180,
        "team_a_final_wickets": 5,
        "team_a_final_overs": 20.0,
        "team_b_final_runs": 165,
        "team_b_final_wickets": 8,
        "team_b_final_overs": 20.0
      }
    `

    // 5. Call the AI
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    })

    const aiData = await response.json()
    const rawText = aiData.candidates[0].content.parts[0].text
    const result = JSON.parse(rawText)

    // 6. Calculate Final Math & Database Updates
    const isTeamAWinner = result.end_of_match_summary.winner === teamA.team_name
    const winnerId = isTeamAWinner ? teamA.team_id : teamB.team_id
    
    // NRR Calculation Math
    const teamAMatchNRR = (result.team_a_final_runs / (result.team_a_final_overs === 20 ? 20 : 20)) - (result.team_b_final_runs / (result.team_b_final_overs === 20 ? 20 : 20))
    const teamBMatchNRR = (result.team_b_final_runs / (result.team_b_final_overs === 20 ? 20 : 20)) - (result.team_a_final_runs / (result.team_a_final_overs === 20 ? 20 : 20))

    // Save final match stats
    await supabase.from('matches').update({
      status: 'Completed',
      team_a_runs: result.team_a_final_runs, 
      team_a_wickets: result.team_a_final_wickets, 
      team_a_overs: result.team_a_final_overs,
      team_b_runs: result.team_b_final_runs, 
      team_b_wickets: result.team_b_final_wickets, 
      team_b_overs: result.team_b_final_overs,
      winner_id: winnerId,
      win_margin: result.end_of_match_summary.win_margin,
      man_of_the_match: result.end_of_match_summary.player_of_the_match,
      match_report: result.end_of_match_summary.emotional_recap
    }).eq('match_id', match_id)

    // Update Standings
    await supabase.from('teams').update({
      matches_played: teamA.matches_played + 1,
      matches_won: isTeamAWinner ? teamA.matches_won + 1 : teamA.matches_won,
      matches_lost: !isTeamAWinner ? teamA.matches_lost + 1 : teamA.matches_lost,
      points: isTeamAWinner ? teamA.points + 2 : teamA.points,
      net_run_rate: teamA.net_run_rate + teamAMatchNRR
    }).eq('team_id', teamA.team_id)

    await supabase.from('teams').update({
      matches_played: teamB.matches_played + 1,
      matches_won: !isTeamAWinner ? teamB.matches_won + 1 : teamB.matches_won,
      matches_lost: isTeamAWinner ? teamB.matches_lost + 1 : teamB.matches_lost,
      points: !isTeamAWinner ? teamB.points + 2 : teamB.points,
      net_run_rate: teamB.net_run_rate + teamBMatchNRR
    }).eq('team_id', teamB.team_id)

    return NextResponse.json({ success: true, result })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Simulation Failed" }, { status: 500 })
  }
}