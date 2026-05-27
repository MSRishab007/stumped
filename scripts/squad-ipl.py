import csv
import re
import time
import random
import os
import json
import requests
import undetected_chromedriver as uc
from bs4 import BeautifulSoup

# --- CONFIGURATION ---
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

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
    "Kings XI Punjab": "PBKS", # Standardizes legacy PBKS
    "Rajasthan Royals": "RR",
    "Royal Challengers Bengaluru": "RCB",
    "Royal Challengers Bangalore": "RCB", # Standardizes legacy RCB
    "Sunrisers Hyderabad": "SRH",
    "Deccan Chargers": "DCG",
    "Gujarat Lions": "GL",
    "Pune Warriors": "PWI",
    "Rising Pune Supergiant": "RPS",
    "Rising Pune Supergiants": "RPS",
    "Kochi Tuskers Kerala": "KTK"
}

def safe_val(v, is_float=False):
    if not v or v in ['-', '--', '']: return 0.0 if is_float else 0
    cleaned = re.sub(r'[^0-9.]', '', str(v))
    try:
        return float(cleaned) if is_float else int(cleaned)
    except ValueError:
        return 0.0 if is_float else 0

def parse_current_team(squad_url):
    """Automatically detects the current franchise code from the squad URL."""
    url_lower = squad_url.lower()
    for full_name, code in IPL_TEAMS_MAP.items():
        normalized_name = full_name.lower().replace(" ", "-")
        if normalized_name in url_lower:
            return code
    return "Unknown"

def get_squad_player_links(driver, squad_url):
    """Visits the squad page and harvests all player profile links."""
    print(f"📡 Scanning Squad Page: {squad_url}...")
    driver.get(squad_url)
    time.sleep(5)
    
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    player_links = set()
    
    # Harvest all hrefs pointing to /cricketers/
    for a in soup.find_all('a', href=re.compile(r'/cricketers/')):
        link = a['href']
        # Ignore generic staff or index links
        if "-team-" not in link and "-squad-" not in link and "records" not in link:
            if not link.startswith('http'):
                link = "https://www.espncricinfo.com" + link
            player_links.add(link)
            
    return list(player_links)

def crawl_squad(squad_url):
    output_csv = "scripts/second_ipl_database.csv"
    csv_headers = [
        "id", "name", "currentFranchise", "pastTeams", "dob", "role", "battingHand", "debutYear",
        "matches", "runs", "strikeRate", "wickets", "economy", 
        "fifties", "hundreds", "fiveWickets", "tenWickets", 
        "searchTerms", "imageLink", "isTargetable", "matchIds", "playerLink"
    ]

    current_franchise_code = parse_current_team(squad_url)
    print(f"🏁 Detected Franchise: {current_franchise_code}")

    # --- STATE MEMORY ---
    completed_ids = set()
    if os.path.exists(output_csv):
        with open(output_csv, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                completed_ids.add(row['id'])
        print(f"🔄 Found {len(completed_ids)} players already in database.")
    else:
        with open(output_csv, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=csv_headers)
            writer.writeheader()

    options = uc.ChromeOptions()
    options.add_argument('--window-size=1440,900')
    options.add_argument('--incognito')
    driver = uc.Chrome(options=options, version_main=148)
    
    try:
        player_links = get_squad_player_links(driver, squad_url)
        print(f"🎯 Discovered {len(player_links)} players in the squad.\n")

        for idx, url in enumerate(player_links):
            player_id = url.split('-')[-1]
            if player_id in completed_ids:
                print(f"⏩ Skipping {url.split('/')[-1]} (Already saved)")
                continue

            print(f"\n[{idx+1}/{len(player_links)}] Processing: {url.split('/')[-1]}")
            
            driver.get(url)
            time.sleep(5) 
            soup = BeautifulSoup(driver.page_source, 'html.parser')

            # 1. NAME EXTRACTION
            name = "Unknown"
            h1 = soup.find('h1')
            if h1: name = h1.text.strip()

            # 2. BIO EXTRACTION
            dob, hand, role, full_name = "Unknown", "Unknown", "Unknown", "Unknown"
            for p in soup.find_all('p'):
                text = p.text.strip().lower()
                if text in ['full name', 'born', 'batting style', 'playing role']:
                    span = p.find_next_sibling('span')
                    if span:
                        val = span.text.strip()
                        if text == 'full name': full_name = val
                        elif text == 'born': dob = val
                        elif text == 'batting style': hand = "Left" if "left" in val.lower() else "Right"
                        elif text == 'playing role': role = val

            # 3. SEARCH KEYWORDS
            search_keywords = set()
            if name != "Unknown":
                search_keywords.add(name.lower())
                parts = name.lower().split()
                for part in parts: search_keywords.add(part)
                if len(parts) > 1: search_keywords.add("".join([p[0] for p in parts]))
                
            if full_name != "Unknown":
                search_keywords.add(full_name.lower())
                parts_full = full_name.lower().split()
                for part in parts_full: search_keywords.add(part)
                if len(parts_full) > 1: search_keywords.add("".join([p[0] for p in parts_full]))

            script_tag = soup.find('script', id='__NEXT_DATA__')
            if script_tag:
                try:
                    payload = json.loads(script_tag.string)
                    p_meta = payload['props']['appPageProps']['data']['player']
                    if p_meta.get('nickNames'):
                        for nick in p_meta['nickNames'].split(','):
                            search_keywords.add(nick.strip().lower())
                except: pass

            # 4. PROFILE IMAGE & TARGETABILITY (Default to 0)
            image_link = "No Image"
            is_targetable = 0
            for img in soup.find_all('img'):
                src = img.get('src', '')
                alt = img.get('alt', '').strip()
                if alt.lower() == name.lower() and '/pictures/cms/' in src.lower():
                    image_link = src
                    is_targetable = 1
                    break

            # 5. PAST TEAMS EXTRACTION & CODE MAPPING
            past_teams = set()
            for p in soup.find_all('p'):
                if p.text.strip().upper() == 'TEAMS':
                    teams_div = p.find_next_sibling('div')
                    if teams_div:
                        for span in teams_div.find_all('span', title=True):
                            t_name = span['title'].strip()
                            if t_name in IPL_TEAMS_MAP:
                                short_code = IPL_TEAMS_MAP[t_name]
                                # Ensure we don't add their current franchise to past teams
                                if short_code != current_franchise_code:
                                    past_teams.add(short_code)

            # 6. STATS EXTRACTION
            stats = {"mat": 0, "runs": 0, "sr": 0.0, "wkts": 0, "econ": 0.0, "100s": 0, "50s": 0, "5w": 0, "10w": 0}
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
                            stats['mat'] = safe_val(vals[headers.index('mat')])
                            stats['runs'] = safe_val(vals[headers.index('runs')])
                            stats['sr'] = safe_val(vals[headers.index('sr')], True)
                            stats['100s'] = safe_val(vals[headers.index('100s')])
                            stats['50s'] = safe_val(vals[headers.index('50s')])
                        if 'econ' in headers and 'wkts' in headers:
                            stats['wkts'] = safe_val(vals[headers.index('wkts')])
                            stats['econ'] = safe_val(vals[headers.index('econ')], True)
                            if '5w' in headers: stats['5w'] = safe_val(vals[headers.index('5w')])
                            if '10w' in headers: stats['10w'] = safe_val(vals[headers.index('10w')])
                    
                    elif "IPL 20" in row_title or "IPL 19" in row_title:
                        year_digits = re.findall(r'\d{4}', row_title)
                        if year_digits: years_played.append(int(year_digits[0]))

            debut_year = min(years_played) if years_played else "Unknown"

            # 7. MATCH IDs EXTRACTION (Statsguru)
            match_ids = []
            sg_url = f"https://stats.espncricinfo.com/ci/engine/player/{player_id}.html?class=6;trophy=117;template=results;type=allround;view=match"
            driver.get(sg_url)
            time.sleep(3)
            
            sg_soup = BeautifulSoup(driver.page_source, 'html.parser')
            tables = sg_soup.find_all('table', class_='engineTable')
            for table in tables:
                if "Match" in table.text and "Date" in table.text:
                    rows = table.find_all('tr', class_='data1')
                    for row in rows:
                        match_link = row.find('a', href=re.compile(r'/match/'))
                        if match_link:
                            match_id_match = re.search(r'/match/(\d+)\.html', match_link['href'])
                            if match_id_match:
                                match_ids.append(match_id_match.group(1))
            
            match_ids = list(set(match_ids))

            # --- BUILD ROW & SAVE ---
            player_data = {
                "id": player_id, "name": name, "currentFranchise": current_franchise_code,
                "pastTeams": json.dumps(list(past_teams)), "dob": dob, "role": role, "battingHand": hand,
                "debutYear": debut_year, "matches": stats['mat'], "runs": stats['runs'], 
                "strikeRate": stats['sr'], "wickets": stats['wkts'], "economy": stats['econ'], 
                "fifties": stats['50s'], "hundreds": stats['100s'], "fiveWickets": stats['5w'], 
                "tenWickets": stats['10w'], "searchTerms": json.dumps(list(search_keywords)), 
                "imageLink": image_link, "isTargetable": is_targetable, 
                "matchIds": ";".join(match_ids), "playerLink": url
            }

            with open(output_csv, mode='a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=csv_headers)
                writer.writerow(player_data)

            print(f"✅ Saved {name} | Img: {'Yes' if is_targetable else 'No'} | Past: {player_data['pastTeams']} | Mat: {stats['mat']}")

            # Clean cache to avoid detection
            driver.delete_all_cookies()
            driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
            time.sleep(random.uniform(1.5, 3.0))

    finally:
        driver.quit()

if __name__ == "__main__":
    target_squad = "https://www.espncricinfo.com/series/ipl-2026-1510719/chennai-super-kings-squad-1511148/series-squads"
    crawl_squad(target_squad)