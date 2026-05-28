import csv
import re
import time
import random
import os
import json
from datetime import timedelta
from collections import deque
import undetected_chromedriver as uc
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

INPUT_CSV = "scripts/playersURL.csv"  # Ensure this file is in the same directory or update the path
OUTPUT_CSV = "scripts/final_ipl_database.csv"

# Master Map for Short Codes
IPL_TEAMS_MAP = {
    "Chennai Super Kings": "CSK",
    "Delhi Capitals": "DC",
    "Delhi Daredevils": "DD",
    "Gujarat Titans": "GT",
    "Kolkata Knight Riders": "KKR",
    "Lucknow Super Giants": "LSG",
    "Mumbai Indians": "MI",
    "Punjab Kings": "PBKS",
    "Kings XI Punjab": "PBKS", 
    "Rajasthan Royals": "RR",
    "Royal Challengers Bengaluru": "RCB",
    "Royal Challengers Bangalore": "RCB", 
    "Sunrisers Hyderabad": "SRH",
    "Deccan Chargers": "DCG",
    "Gujarat Lions": "GL",
    "Pune Warriors": "PWI",
    "Rising Pune Supergiant": "RPS",
    "Rising Pune Supergiants": "RPS",
    "Kochi Tuskers Kerala": "KTK"
}

def safe_val(v, is_float=False):
    """Helper function to safely convert stats, turning dashes/nulls/asterisks into 0."""
    if v in [None, '', '-']: 
        return 0.0 if is_float else 0
    cleaned = re.sub(r'[^0-9.]', '', str(v))
    try:
        return float(cleaned) if is_float else int(cleaned)
    except (ValueError, TypeError):
        return 0.0 if is_float else 0

def get_fresh_driver():
    """Initializes a brand new incognito Chrome instance."""
    options = uc.ChromeOptions()
    options.add_argument('--window-size=1280,1024')
    options.add_argument('--incognito')
    return uc.Chrome(options=options, version_main=148)

def process_players_from_csv():
    csv_headers = [
        "id", "name", "currentFranchise", "pastTeams", "dob", "role", "battingHand", "debutYear",
        "matches", "runs", "strikeRate", "wickets", "economy", 
        "searchTerms", "imageLink", "isTargetable", "matchIds", "playerLink"
    ]

    # --- 1. LOAD TARGETS FROM INPUT CSV ---
    if not os.path.exists(INPUT_CSV):
        print(f"❌ Error: Could not find {INPUT_CSV}")
        return

    target_players = []
    with open(INPUT_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            target_players.append(row)

    # --- 2. STATE MEMORY (RESUME LOGIC) ---
    completed_ids = set()
    if os.path.exists(OUTPUT_CSV):
        with open(OUTPUT_CSV, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                completed_ids.add(row['id'])
        print(f"🔄 Found {len(completed_ids)} players already in the database. Resuming...")
    else:
        with open(OUTPUT_CSV, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=csv_headers)
            writer.writeheader()

    # Pre-filter targets
    players_to_scrape = []
    for p in target_players:
        p_id = p['playerLink'].split('-')[-1]
        if p_id not in completed_ids:
            p['id'] = p_id
            players_to_scrape.append(p)

    total_remaining = len(players_to_scrape)
    if total_remaining == 0:
        print("🎉 All players in the CSV have been scraped! Database is complete.")
        return

    print(f"🎯 {total_remaining} players remaining to scrape.")
    print("🚀 Initiating High-Speed Scraping Protocol (Fresh Window Per Player)...\n")

    recent_times = deque(maxlen=10)

    # --- 3. MASTER SCRAPING LOOP ---
    for idx, p_data in enumerate(players_to_scrape):
        loop_start_time = time.time()
        
        player_id = p_data['id']
        p_name = p_data['name']
        p_team = p_data['team']
        p_url = p_data['playerLink']
        
        print(f"\n{'='*60}")
        print(f"[{idx+1}/{total_remaining}] Processing: {p_name} ({p_team})")
        
        # LAUNCH FRESH DRIVER FOR THIS PLAYER
        driver = get_fresh_driver()
        
        try:
            # --- A. PROFILE PAGE EXTRACTION ---
            while True:
                driver.get(p_url)
                time.sleep(random.uniform(4.0, 5.5))
                if "Access Denied" in driver.title or "Reference #" in driver.page_source:
                    print("\n🚨 FIREWALL BLOCK DETECTED! Change VPN/Network and press ENTER...")
                    input()
                    continue
                break

            soup = BeautifulSoup(driver.page_source, 'html.parser')
            
            # Base Player Dictionary
            player = {
                "id": player_id, "name": p_name, "currentFranchise": p_team,
                "pastTeams": [], "dob": "Unknown", "role": "Unknown", "battingHand": "Unknown",
                "debutYear": "Unknown", "matches": 0, "runs": 0, "strikeRate": 0.0, 
                "wickets": 0, "economy": 0.0, "searchTerms": set(), "imageLink": "", 
                "isTargetable": 0, "matchIds": "", "playerLink": p_url
            }

            # JSON Data Extraction
            full_name = "Unknown"
            script_tag = soup.find('script', id='__NEXT_DATA__')
            if script_tag:
                try:
                    next_data = json.loads(script_tag.string)
                    p_info = next_data.get('props', {}).get('appPageProps', {}).get('data', {}).get('player', {})
                    
                    player['name'] = p_info.get('longName') or p_info.get('name') or player['name']
                    full_name = p_info.get('longName', 'Unknown')
                    
                    dob = p_info.get('dateOfBirth', {})
                    if dob and dob.get('year'):
                        player['dob'] = f"{dob.get('year')}-{str(dob.get('month', 1)).zfill(2)}-{str(dob.get('date', 1)).zfill(2)}"
                            
                    roles = p_info.get('playingRoles', [])
                    fielding = p_info.get('fieldingStyles', [])
                    if roles: player['role'] = roles[0].title()
                    elif fielding: player['role'] = fielding[0].title()
                        
                    batting = p_info.get('battingStyles', [])
                    if batting: player['battingHand'] = "Left" if "lhb" in batting else "Right"
                        
                    img_path = p_info.get('imageUrl') or p_info.get('headshotImageUrl')
                    if img_path:
                        if img_path.startswith('/'):
                            player['imageLink'] = f"https://img1.hscicdn.com/image/upload/f_auto,t_h_100_2x{img_path}"
                        else:
                            player['imageLink'] = img_path
                        player['isTargetable'] = 1

                    nicks = p_info.get('nickNames', '')
                    if nicks:
                        for nick in nicks.split(','):
                            player['searchTerms'].add(nick.strip().lower())
                except Exception:
                    pass

            # HTML Fallbacks
            if player['name'] == "Unknown":
                h1 = soup.find('h1')
                if h1: player['name'] = h1.text.strip()

            for p in soup.find_all('p'):
                text = p.text.strip().lower()
                if text in ['born', 'batting style', 'playing role', 'full name']:
                    span = p.find_next_sibling('span')
                    if span:
                        val = span.text.strip()
                        if text == 'full name' and full_name == "Unknown": full_name = val
                        elif text == 'born' and player['dob'] == "Unknown": player['dob'] = val
                        elif text == 'batting style' and player['battingHand'] == "Unknown": player['battingHand'] = "Left" if "left" in val.lower() else "Right"
                        elif text == 'playing role' and player['role'] == "Unknown": player['role'] = val

            # Search Terms Generation
            if player['name'] != "Unknown":
                player['searchTerms'].add(player['name'].lower())
                parts = player['name'].lower().split()
                for p in parts: player['searchTerms'].add(p)
                if len(parts) > 1: player['searchTerms'].add("".join([p[0] for p in parts]))
            
            if full_name != "Unknown":
                player['searchTerms'].add(full_name.lower())
                parts_full = full_name.lower().split()
                if len(parts_full) > 1: player['searchTerms'].add("".join([p[0] for p in parts_full]))

            # Past Teams
            past_teams = set()
            for p in soup.find_all('p'):
                if p.text.strip().upper() == 'TEAMS':
                    teams_div = p.find_next_sibling('div')
                    if teams_div:
                        for span in teams_div.find_all('span', title=True):
                            t_name = span['title'].strip()
                            if t_name in IPL_TEAMS_MAP:
                                short_code = IPL_TEAMS_MAP[t_name]
                                if short_code != p_team: 
                                    past_teams.add(short_code)
            player['pastTeams'] = list(past_teams)

            # Profile Image Override
            if player['imageLink'] == "" or player['imageLink'] == "No Image":
                for img in soup.find_all('img'):
                    src = img.get('src', '')
                    alt = img.get('alt', '').strip().lower()
                    if alt == player['name'].lower() and '/pictures/cms/' in src.lower():
                        if 'wassets' not in src.lower() and 'lazyimage' not in src.lower():
                            player['imageLink'] = src
                            player['isTargetable'] = 1
                            break

            # Dynamic Stats Extraction (Table-Type Isolated Fix)
            for table in soup.find_all('table'):
                thead = table.find('thead')
                if not thead: continue
                
                headers = [th.text.strip().lower() for th in thead.find_all('th')]
                header_map = {name: i for i, name in enumerate(headers)}
                
                # Context check to classify table types correctly
                is_batting_table = 'bf' in header_map or 'hs' in header_map or 'no' in header_map
                is_bowling_table = 'wkts' in header_map or 'econ' in header_map or 'bbi' in header_map
                
                for row in table.find_all('tr'):
                    cells = row.find_all('td')
                    if not cells: continue
                    
                    if cells[0].text.strip() == "IPL":
                        vals = [c.text.strip() for c in cells]
                        
                        # Batting Stats Configuration
                        if is_batting_table and 'runs' in header_map and 'sr' in header_map:
                            player['runs'] = safe_val(vals[header_map['runs']])
                            player['strikeRate'] = safe_val(vals[header_map['sr']], True)
                        
                        # Bowling Stats Configuration
                        if is_bowling_table and 'wkts' in header_map and 'econ' in header_map:
                            player['wickets'] = safe_val(vals[header_map['wkts']])
                            player['economy'] = safe_val(vals[header_map['econ']], True)

            # --- B. STATSGURU DATA (Match IDs & Debut Year Calculation) ---
            sg_url = f"https://stats.espncricinfo.com/ci/engine/player/{player_id}.html?class=6;trophy=117;template=results;type=allround;view=match"
            
            while True:
                driver.get(sg_url)
                time.sleep(3.5)
                if "Access Denied" in driver.title or "Reference #" in driver.page_source:
                    print("\n🚨 FIREWALL BLOCK ON STATSGURU! Change VPN and press ENTER...")
                    input()
                    continue
                break
                
            sg_soup = BeautifulSoup(driver.page_source, 'html.parser')
            match_ids = set()
            years_played = set()
            
            tables = sg_soup.find_all('table', class_='engineTable')
            for table in tables:
                if "Match" in table.text and "Date" in table.text:
                    rows = table.find_all('tr', class_='data1')
                    for row in rows:
                        match_link = row.find('a', href=re.compile(r'/match/'))
                        if match_link:
                            m_id = re.search(r'/match/(\d+)\.html', match_link['href'])
                            if m_id: match_ids.add(m_id.group(1))
                        
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            # Target second-to-last column containing match date text
                            date_text = cells[-2].text.strip()
                            year_match = re.search(r'\b(19\d{2}|20\d{2})\b', date_text)
                            if year_match: years_played.add(int(year_match.group(1)))
                                
            player['debutYear'] = min(years_played) if years_played else "Unknown"
            player['matchIds'] = ";".join(list(match_ids))
            
            # Absolute Validation Synchronizer
            player['matches'] = len(match_ids)
            
            # Format Collection Structures
            player['pastTeams'] = json.dumps(player['pastTeams'])
            player['searchTerms'] = json.dumps(list(player['searchTerms']))

            # --- C. SAVE TO CSV ---
            with open(OUTPUT_CSV, mode='a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=csv_headers)
                writer.writerow(player)

            # --- D. TELEMETRY & TEARDOWN ---
            loop_duration = time.time() - loop_start_time
            recent_times.append(loop_duration)
            avg_time = sum(recent_times) / len(recent_times)
            
            players_left = total_remaining - (idx + 1)
            eta_seconds = int(avg_time * players_left)
            eta_formatted = str(timedelta(seconds=eta_seconds))
            
            print(f"   ✅ Saved {player['name']} | Debut: {player['debutYear']} | Mat: {player['matches']}")
            print(f"   ⏱️ Time: {loop_duration:.1f}s | Avg: {avg_time:.1f}s | ETA: {eta_formatted}")

        except Exception as e:
            print(f"❌ Error processing {p_name}: {e}")
        
        finally:
            if driver:
                driver.quit()
            time.sleep(random.uniform(1.5, 3.5))

if __name__ == "__main__":
    process_players_from_csv()