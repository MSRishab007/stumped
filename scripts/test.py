import csv
import re
import time
import random
import os
import requests
import json
import undetected_chromedriver as uc
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

IPL_TEAMS_MAP = {
    "Chennai Super Kings": "CSK", "Delhi Capitals": "DC", "Delhi Daredevils": "DD",
    "Gujarat Titans": "GT", "Kolkata Knight Riders": "KKR", "Lucknow Super Giants": "LSG",
    "Mumbai Indians": "MI", "Punjab Kings": "PBKS", "Kings XI Punjab": "PBKS",
    "Rajasthan Royals": "RR", "Royal Challengers Bengaluru": "RCB", "Royal Challengers Bangalore": "RCB",
    "Sunrisers Hyderabad": "SRH", "Deccan Chargers": "DCG", "Gujarat Lions": "GL",
    "Pune Warriors": "PWI", "Rising Pune Supergiant": "RPS", "Rising Pune Supergiants": "RPS",
    "Kochi Tuskers Kerala": "KTK"
}

def safe_val(v, is_float=False):
    if not v or v in ['-', '--', '']: return 0.0 if is_float else 0
    cleaned = re.sub(r'[^0-9.]', '', str(v))
    try:
        return float(cleaned) if is_float else int(cleaned)
    except ValueError:
        return 0.0 if is_float else 0

def get_player_match_ids(player_id):
    """Fetches Match IDs and returns them as a semicolon-separated string."""
    # Using class=6 (T20) and trophy=117 (IPL) for Statsguru
    statsguru_url = f"https://stats.espncricinfo.com/ci/engine/player/{player_id}.html?class=6;trophy=117;template=results;type=allround;view=match"
    match_ids = []
    try:
        response = requests.get(statsguru_url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        tables = soup.find_all('table', class_='engineTable')
        for table in tables:
            if "Match" in table.text and "Date" in table.text:
                rows = table.find_all('tr', class_='data1')
                for row in rows:
                    match_link = row.find('a', href=re.compile(r'/match/'))
                    if match_link:
                        match_id = re.search(r'/match/(\d+)\.html', match_link['href'])
                        if match_id:
                            match_ids.append(match_id.group(1))
    except Exception as e:
        print(f"   [!] Warning: Could not fetch match IDs for {player_id}")
        
    return ";".join(list(set(match_ids)))

def get_player_links(team_url):
    """Scrapes the team squad page to get player profile links using your exact logic."""
    print(f"Fetching team page: {team_url}")
    
    player_links = []
    options = uc.ChromeOptions()
    options.add_argument('--window-size=1440,900')
    options.add_argument('--incognito')
    driver = uc.Chrome(options=options, version_main=148)
    driver.get(team_url)
    time.sleep(5)  
    
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    player_cards = soup.find_all('div', class_='ds-relative ds-flex ds-flex-row ds-space-x-4 ds-p-3')
    
    for card in player_cards:     
        a_tag = card.find('a', href=True)
        if a_tag:
            href = a_tag['href']
            if href.startswith('/'):
                player_links.append(f"https://www.espncricinfo.com{href}")
            else:
                player_links.append(href)
                
    driver.quit()
    return player_links

def test_single_player(player_url, team_name):
    """Scrapes detailed stats for a single player."""
    print(f"Fetching player page: {player_url}")
    options = uc.ChromeOptions()
    options.add_argument('--window-size=1440,900')
    options.add_argument('--incognito')
    driver = uc.Chrome(options=options, version_main=148)
    
    try:
        driver.get(player_url)
        time.sleep(5) 
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        player_id = player_url.split('-')[-1]
        
        player = {
            "id": player_id,
            "name": "Unknown",
            "team": team_name,
            "pastTeams": [],
            "role": "Unknown",
            "battingHand": "Unknown",
            "matches": 0,
            "runs": 0,
            "wickets": 0,
            "strikeRate": 0.0,
            "economy": 0.0,
            "debutYear": "Unknown",
            "matchIDs": [],
            "playerLink": player_url,
            "imageLink": "No Image",
            "isTargetable": 0,
            "keywords": set()
        }

        # --- 1. JSON EXTRACTION (Bio, Hand, Role, Image, Nicknames) ---
        script_tag = soup.find('script', id='__NEXT_DATA__')
        if script_tag:
            next_data = json.loads(script_tag.string)
            app_data = next_data.get('props', {}).get('appPageProps', {}).get('data', {})
            p_info = app_data.get('player', {})
            
            # Name & DOB
            player['name'] = p_info.get('longName') or p_info.get('name') or "Unknown"
            dob = p_info.get('dateOfBirth', {})
            if dob and dob.get('year'):
                player['dob'] = f"{dob.get('year')}-{str(dob.get('month', 1)).zfill(2)}-{str(dob.get('date', 1)).zfill(2)}"
                        
            # Roles
            roles = p_info.get('playingRoles', [])
            fielding = p_info.get('fieldingStyles', [])
            if roles:
                player['role'] = roles[0].title()
            elif fielding:
                player['role'] = fielding[0].title()
                
            # Batting Hand
            batting = p_info.get('battingStyles', [])
            if batting:
                player['battingHand'] = "Left" if "lhb" in batting else "Right"
                
            # Perfect Image Extraction
            img_path = p_info.get('imageUrl') or p_info.get('headshotImageUrl')
            if img_path:
                if img_path.startswith('/'):
                    player['imageLink'] = f"https://img1.hscicdn.com/image/upload/f_auto,t_h_100_2x{img_path}"
                else:
                    player['imageLink'] = img_path
                player['isTargetable'] = 1

            # Keywords & Nicknames
            player['keywords'].add(player['name'].lower())
            parts = player['name'].lower().split()
            if len(parts) > 1:
                player['keywords'].add("".join([p[0] for p in parts]))
            
            nicks = p_info.get('nickNames', '')
            if nicks:
                for nick in nicks.split(','):
                    player['keywords'].add(nick.strip().lower())

        # --- 2. HTML EXTRACTION (Stats, Debut Year, Past Teams) ---
        years_played = []
        for table in soup.find_all('table'):
            thead = table.find('thead')
            if not thead: continue
            headers = [th.text.strip().lower() for th in thead.find_all('th')]
            
            for row in table.find_all('tr'):
                cells = row.find_all('td')
                if not cells: continue
                row_title = cells[0].text.strip()
                
                if row_title == "IPL":
                    vals = [c.text.strip() for c in cells]
                    if 'sr' in headers and 'bf' in headers:
                        player['matches'] = safe_val(vals[headers.index('mat')])
                        player['runs'] = safe_val(vals[headers.index('runs')])
                        player['strikeRate'] = safe_val(vals[headers.index('sr')], True)
                    if 'econ' in headers and 'wkts' in headers:
                        if player['matches'] == 0 and 'mat' in headers:
                            player['matches'] = safe_val(vals[headers.index('mat')])
                        player['wickets'] = safe_val(vals[headers.index('wkts')])
                        player['economy'] = safe_val(vals[headers.index('econ')], True)
                        
                elif "IPL 20" in row_title or "IPL 19" in row_title:
                    year_match = re.findall(r'\d{4}', row_title)
                    if year_match: years_played.append(int(year_match[0]))

        if years_played:
            player['debutYear'] = min(years_played)

        past_teams = set()
        for p in soup.find_all('p'):
            if p.text.strip().upper() == 'TEAMS':
                teams_div = p.find_next_sibling('div')
                if teams_div:
                    for span in teams_div.find_all('span', title=True):
                        t_name = span['title'].strip()
                        if t_name in IPL_TEAMS_MAP:
                            short_code = IPL_TEAMS_MAP[t_name]
                            if short_code != team_name:
                                past_teams.add(short_code)
        player['pastTeams'] = list(past_teams)

        # --- 3. MATCH IDs ---
        player['matchIDs'] = get_player_match_ids(player_id).split(';') if get_player_match_ids(player_id) else []
        
        # Convert keywords set to list for JSON printing
        player['keywords'] = list(player['keywords'])

        print("\n🎯 Extraction Results:")
        print(json.dumps(player, indent=2))
        
    except Exception as e:
        print(f"Error fetching {player_url}: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    # Test 1: Get Links from a squad page (using your function)
    # links = get_player_links("https://www.espncricinfo.com/series/ipl-2026-1510719/chennai-super-kings-squad-1511148/series-squads")
    # print(f"Found {len(links)} links. Sample: {links[:2]}")
    
    # Test 2: Process Sarfaraz using the robust JSON/HTML hybrid
    test_single_player("https://www.espncricinfo.com/cricketers/akeal-hosein-530812", "CSK")