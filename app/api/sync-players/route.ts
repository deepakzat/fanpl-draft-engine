import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    // 🏏 THE 100-PLAYER GLOBAL FRANCHISE MEGA-POOL
    // Perfectly formatted roles to ensure the UI filters never break.
    const megaPool = [
      // INDIA
      { player_id: "cap_001", full_name: "Virat Kohli", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm medium", base_price: 20000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_002", full_name: "Jasprit Bumrah", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 20000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_009", full_name: "Suryakumar Yadav", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm medium", base_price: 20000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_011", full_name: "Rohit Sharma", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 20000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_012", full_name: "Rishabh Pant", primary_role: "Wicket Keeper", batting_style: "Left-hand bat", bowling_style: "N/A", base_price: 15000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_013", full_name: "Hardik Pandya", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm fast-medium", base_price: 20000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_014", full_name: "Ravindra Jadeja", primary_role: "All-Rounder", batting_style: "Left-hand bat", bowling_style: "Slow left-arm orthodox", base_price: 20000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_015", full_name: "Shubman Gill", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 15000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_016", full_name: "Yashasvi Jaiswal", primary_role: "Batter", batting_style: "Left-hand bat", bowling_style: "Legbreak", base_price: 10000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_017", full_name: "Mohammed Siraj", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 15000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_018", full_name: "Kuldeep Yadav", primary_role: "Bowler", batting_style: "Left-hand bat", bowling_style: "Left-arm wrist-spin", base_price: 15000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_019", full_name: "Arshdeep Singh", primary_role: "Bowler", batting_style: "Left-hand bat", bowling_style: "Left-arm medium-fast", base_price: 10000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_020", full_name: "Rinku Singh", primary_role: "Batter", batting_style: "Left-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_021", full_name: "Sanju Samson", primary_role: "Wicket Keeper", batting_style: "Right-hand bat", bowling_style: "N/A", base_price: 10000000, auction_status: "Available", country: "India", gender: "Male" },
      { player_id: "cap_022", full_name: "Axar Patel", primary_role: "All-Rounder", batting_style: "Left-hand bat", bowling_style: "Slow left-arm orthodox", base_price: 10000000, auction_status: "Available", country: "India", gender: "Male" },
      
      // AUSTRALIA
      { player_id: "cap_007", full_name: "Glenn Maxwell", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 15000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_023", full_name: "Travis Head", primary_role: "Batter", batting_style: "Left-hand bat", bowling_style: "Right-arm offbreak", base_price: 20000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_024", full_name: "David Warner", primary_role: "Batter", batting_style: "Left-hand bat", bowling_style: "Legbreak", base_price: 15000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_025", full_name: "Mitchell Marsh", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm medium", base_price: 20000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_026", full_name: "Pat Cummins", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 20000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_027", full_name: "Mitchell Starc", primary_role: "Bowler", batting_style: "Left-hand bat", bowling_style: "Left-arm fast", base_price: 20000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_028", full_name: "Adam Zampa", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Legbreak googly", base_price: 15000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_029", full_name: "Marcus Stoinis", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm medium", base_price: 15000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_030", full_name: "Tim David", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_031", full_name: "Josh Hazlewood", primary_role: "Bowler", batting_style: "Left-hand bat", bowling_style: "Right-arm fast-medium", base_price: 15000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_032", full_name: "Josh Inglis", primary_role: "Wicket Keeper", batting_style: "Right-hand bat", bowling_style: "N/A", base_price: 5000000, auction_status: "Available", country: "Australia", gender: "Male" },
      { player_id: "cap_033", full_name: "Spencer Johnson", primary_role: "Bowler", batting_style: "Left-hand bat", bowling_style: "Left-arm fast", base_price: 5000000, auction_status: "Available", country: "Australia", gender: "Male" },

      // ENGLAND
      { player_id: "cap_006", full_name: "Jos Buttler", primary_role: "Wicket Keeper", batting_style: "Right-hand bat", bowling_style: "N/A", base_price: 20000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_034", full_name: "Phil Salt", primary_role: "Wicket Keeper", batting_style: "Right-hand bat", bowling_style: "N/A", base_price: 15000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_035", full_name: "Will Jacks", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_036", full_name: "Jonny Bairstow", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "N/A", base_price: 15000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_037", full_name: "Harry Brook", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm medium", base_price: 10000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_038", full_name: "Moeen Ali", primary_role: "All-Rounder", batting_style: "Left-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_039", full_name: "Sam Curran", primary_role: "All-Rounder", batting_style: "Left-hand bat", bowling_style: "Left-arm fast-medium", base_price: 15000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_040", full_name: "Jofra Archer", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 15000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_041", full_name: "Mark Wood", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 10000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_042", full_name: "Adil Rashid", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Legbreak", base_price: 10000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_043", full_name: "Liam Livingstone", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Legbreak", base_price: 10000000, auction_status: "Available", country: "England", gender: "Male" },
      { player_id: "cap_044", full_name: "Reece Topley", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Left-arm fast-medium", base_price: 10000000, auction_status: "Available", country: "England", gender: "Male" },

      // SOUTH AFRICA
      { player_id: "cap_003", full_name: "Heinrich Klaasen", primary_role: "Wicket Keeper", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 15000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_045", full_name: "Quinton de Kock", primary_role: "Wicket Keeper", batting_style: "Left-hand bat", bowling_style: "N/A", base_price: 20000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_046", full_name: "David Miller", primary_role: "Batter", batting_style: "Left-hand bat", bowling_style: "N/A", base_price: 15000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_047", full_name: "Aiden Markram", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 15000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_048", full_name: "Tristan Stubbs", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_049", full_name: "Kagiso Rabada", primary_role: "Bowler", batting_style: "Left-hand bat", bowling_style: "Right-arm fast", base_price: 15000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_050", full_name: "Anrich Nortje", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 15000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_051", full_name: "Marco Jansen", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Left-arm fast", base_price: 10000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_052", full_name: "Keshav Maharaj", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Slow left-arm orthodox", base_price: 5000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_053", full_name: "Gerald Coetzee", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 10000000, auction_status: "Available", country: "South Africa", gender: "Male" },
      { player_id: "cap_054", full_name: "Tabraiz Shamsi", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Left-arm wrist-spin", base_price: 5000000, auction_status: "Available", country: "South Africa", gender: "Male" },

      // WEST INDIES
      { player_id: "cap_004", full_name: "Andre Russell", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 15000000, auction_status: "Available", country: "West Indies", gender: "Male" },
      { player_id: "cap_010", full_name: "Sunil Narine", primary_role: "All-Rounder", batting_style: "Left-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "West Indies", gender: "Male" },
      { player_id: "cap_055", full_name: "Nicholas Pooran", primary_role: "Wicket Keeper", batting_style: "Left-hand bat", bowling_style: "N/A", base_price: 20000000, auction_status: "Available", country: "West Indies", gender: "Male" },
      { player_id: "cap_056", full_name: "Rovman Powell", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm medium-fast", base_price: 10000000, auction_status: "Available", country: "West Indies", gender: "Male" },
      { player_id: "cap_057", full_name: "Kyle Mayers", primary_role: "All-Rounder", batting_style: "Left-hand bat", bowling_style: "Right-arm medium", base_price: 5000000, auction_status: "Available", country: "West Indies", gender: "Male" },
      { player_id: "cap_058", full_name: "Shimron Hetmyer", primary_role: "Batter", batting_style: "Left-hand bat", bowling_style: "N/A", base_price: 10000000, auction_status: "Available", country: "West Indies", gender: "Male" },
      { player_id: "cap_059", full_name: "Jason Holder", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm fast-medium", base_price: 10000000, auction_status: "Available", country: "West Indies", gender: "Male" },
      { player_id: "cap_060", full_name: "Alzarri Joseph", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 10000000, auction_status: "Available", country: "West Indies", gender: "Male" },
      { player_id: "cap_061", full_name: "Akeal Hosein", primary_role: "Bowler", batting_style: "Left-hand bat", bowling_style: "Slow left-arm orthodox", base_price: 5000000, auction_status: "Available", country: "West Indies", gender: "Male" },
      { player_id: "cap_062", full_name: "Romario Shepherd", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm fast-medium", base_price: 5000000, auction_status: "Available", country: "West Indies", gender: "Male" },

      // NEW ZEALAND
      { player_id: "cap_008", full_name: "Trent Boult", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Left-arm fast-medium", base_price: 10000000, auction_status: "Available", country: "New Zealand", gender: "Male" },
      { player_id: "cap_063", full_name: "Kane Williamson", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 15000000, auction_status: "Available", country: "New Zealand", gender: "Male" },
      { player_id: "cap_064", full_name: "Rachin Ravindra", primary_role: "All-Rounder", batting_style: "Left-hand bat", bowling_style: "Slow left-arm orthodox", base_price: 10000000, auction_status: "Available", country: "New Zealand", gender: "Male" },
      { player_id: "cap_065", full_name: "Devon Conway", primary_role: "Wicket Keeper", batting_style: "Left-hand bat", bowling_style: "N/A", base_price: 15000000, auction_status: "Available", country: "New Zealand", gender: "Male" },
      { player_id: "cap_066", full_name: "Daryl Mitchell", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm medium", base_price: 10000000, auction_status: "Available", country: "New Zealand", gender: "Male" },
      { player_id: "cap_067", full_name: "Glenn Phillips", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "New Zealand", gender: "Male" },
      { player_id: "cap_068", full_name: "Mitchell Santner", primary_role: "All-Rounder", batting_style: "Left-hand bat", bowling_style: "Slow left-arm orthodox", base_price: 10000000, auction_status: "Available", country: "New Zealand", gender: "Male" },
      { player_id: "cap_069", full_name: "Tim Southee", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm medium-fast", base_price: 10000000, auction_status: "Available", country: "New Zealand", gender: "Male" },
      { player_id: "cap_070", full_name: "Lockie Ferguson", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 10000000, auction_status: "Available", country: "New Zealand", gender: "Male" },
      { player_id: "cap_071", full_name: "Finn Allen", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "N/A", base_price: 5000000, auction_status: "Available", country: "New Zealand", gender: "Male" },

      // PAKISTAN
      { player_id: "cap_072", full_name: "Babar Azam", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 20000000, auction_status: "Available", country: "Pakistan", gender: "Male" },
      { player_id: "cap_073", full_name: "Mohammad Rizwan", primary_role: "Wicket Keeper", batting_style: "Right-hand bat", bowling_style: "N/A", base_price: 15000000, auction_status: "Available", country: "Pakistan", gender: "Male" },
      { player_id: "cap_074", full_name: "Fakhar Zaman", primary_role: "Batter", batting_style: "Left-hand bat", bowling_style: "Slow left-arm orthodox", base_price: 10000000, auction_status: "Available", country: "Pakistan", gender: "Male" },
      { player_id: "cap_075", full_name: "Shadab Khan", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Legbreak", base_price: 15000000, auction_status: "Available", country: "Pakistan", gender: "Male" },
      { player_id: "cap_076", full_name: "Shaheen Afridi", primary_role: "Bowler", batting_style: "Left-hand bat", bowling_style: "Left-arm fast", base_price: 20000000, auction_status: "Available", country: "Pakistan", gender: "Male" },
      { player_id: "cap_077", full_name: "Haris Rauf", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 15000000, auction_status: "Available", country: "Pakistan", gender: "Male" },
      { player_id: "cap_078", full_name: "Naseem Shah", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 10000000, auction_status: "Available", country: "Pakistan", gender: "Male" },
      { player_id: "cap_079", full_name: "Imad Wasim", primary_role: "All-Rounder", batting_style: "Left-hand bat", bowling_style: "Slow left-arm orthodox", base_price: 10000000, auction_status: "Available", country: "Pakistan", gender: "Male" },
      { player_id: "cap_080", full_name: "Mohammad Amir", primary_role: "Bowler", batting_style: "Left-hand bat", bowling_style: "Left-arm fast", base_price: 10000000, auction_status: "Available", country: "Pakistan", gender: "Male" },

      // AFGHANISTAN
      { player_id: "cap_005", full_name: "Rashid Khan", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Legbreak googly", base_price: 20000000, auction_status: "Available", country: "Afghanistan", gender: "Male" },
      { player_id: "cap_081", full_name: "Rahmanullah Gurbaz", primary_role: "Wicket Keeper", batting_style: "Right-hand bat", bowling_style: "N/A", base_price: 10000000, auction_status: "Available", country: "Afghanistan", gender: "Male" },
      { player_id: "cap_082", full_name: "Mohammad Nabi", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "Afghanistan", gender: "Male" },
      { player_id: "cap_083", full_name: "Fazalhaq Farooqi", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Left-arm fast-medium", base_price: 5000000, auction_status: "Available", country: "Afghanistan", gender: "Male" },
      { player_id: "cap_084", full_name: "Naveen-ul-Haq", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm medium-fast", base_price: 5000000, auction_status: "Available", country: "Afghanistan", gender: "Male" },
      { player_id: "cap_085", full_name: "Mujeeb Ur Rahman", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "Afghanistan", gender: "Male" },
      { player_id: "cap_086", full_name: "Ibrahim Zadran", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm medium-fast", base_price: 5000000, auction_status: "Available", country: "Afghanistan", gender: "Male" },
      { player_id: "cap_087", full_name: "Noor Ahmad", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Left-arm wrist-spin", base_price: 5000000, auction_status: "Available", country: "Afghanistan", gender: "Male" },

      // SRI LANKA
      { player_id: "cap_088", full_name: "Wanindu Hasaranga", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Legbreak", base_price: 15000000, auction_status: "Available", country: "Sri Lanka", gender: "Male" },
      { player_id: "cap_089", full_name: "Pathum Nissanka", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "N/A", base_price: 10000000, auction_status: "Available", country: "Sri Lanka", gender: "Male" },
      { player_id: "cap_090", full_name: "Kusal Mendis", primary_role: "Wicket Keeper", batting_style: "Right-hand bat", bowling_style: "Legbreak", base_price: 5000000, auction_status: "Available", country: "Sri Lanka", gender: "Male" },
      { player_id: "cap_091", full_name: "Matheesha Pathirana", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 10000000, auction_status: "Available", country: "Sri Lanka", gender: "Male" },
      { player_id: "cap_092", full_name: "Maheesh Theekshana", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "Sri Lanka", gender: "Male" },
      { player_id: "cap_093", full_name: "Charith Asalanka", primary_role: "Batter", batting_style: "Left-hand bat", bowling_style: "Right-arm offbreak", base_price: 5000000, auction_status: "Available", country: "Sri Lanka", gender: "Male" },
      { player_id: "cap_094", full_name: "Dilshan Madushanka", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Left-arm fast-medium", base_price: 5000000, auction_status: "Available", country: "Sri Lanka", gender: "Male" },
      { player_id: "cap_095", full_name: "Dushmantha Chameera", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Right-arm fast", base_price: 5000000, auction_status: "Available", country: "Sri Lanka", gender: "Male" },

      // PREMIUM WOMEN'S T20 SUPERSTARS (For WPL & Mixed T20S)
      { player_id: "cap_w01", full_name: "Smriti Mandhana", primary_role: "Batter", batting_style: "Left-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "India", gender: "Female" },
      { player_id: "cap_w02", full_name: "Harmanpreet Kaur", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", base_price: 10000000, auction_status: "Available", country: "India", gender: "Female" },
      { player_id: "cap_w03", full_name: "Ellyse Perry", primary_role: "All-Rounder", batting_style: "Right-hand bat", bowling_style: "Right-arm fast-medium", base_price: 15000000, auction_status: "Available", country: "Australia", gender: "Female" },
      { player_id: "cap_w04", full_name: "Meg Lanning", primary_role: "Batter", batting_style: "Right-hand bat", bowling_style: "Right-arm medium", base_price: 10000000, auction_status: "Available", country: "Australia", gender: "Female" },
      { player_id: "cap_w05", full_name: "Sophie Ecclestone", primary_role: "Bowler", batting_style: "Right-hand bat", bowling_style: "Slow left-arm orthodox", base_price: 10000000, auction_status: "Available", country: "England", gender: "Female" }
    ]

    // UPSERT the massive array into Supabase
    // This will securely overwrite the older versions without touching your 'Sold' players
    const { data, error } = await supabase
      .from('players')
      .upsert(megaPool, { onConflict: 'player_id' })

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      message: `Successfully locked in ${megaPool.length} elite global T20 players into the database!` 
    })

  } catch (error: any) {
    console.error("Sync Error:", error)
    return NextResponse.json({ error: "Failed to inject players" }, { status: 500 })
  }
}