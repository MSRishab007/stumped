import csv
import re
import time
import random
import os
import requests
import json
from datetime import timedelta
from collections import deque
import undetected_chromedriver as uc
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def safe_val(v, is_float=False):
    """Helper function to safely convert stats, turning dashes/nulls into 0."""
    if v in [None, '', '-']: 
        return 0.0 if is_float else 0
    try:
        return float(v) if is_float else int(v)
    except (ValueError, TypeError):
        return 0.0 if is_float else 0

def get_player_match_ids(player_id):
    """Fetches Match IDs and returns them as a semicolon-separated string."""
    statsguru_url = f"https://stats.espncricinfo.com/ci/engine/player/{player_id}.html?class=1;template=results;type=allround;view=match"
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
        
    return ";".join(match_ids)

def compile_master_database():
    input_csv = "scripts/players_directory.csv"
    output_csv = "scripts/check_final_players_database.csv"
    
    csv_headers = [
        "id", "name", "country", "testCap", "dob", "role", "battingHand", 
        "matches", "runs", "wickets", "battingAverage", "bowlingAverage", 
        "fifties", "hundreds", "fiveWickets", "tenWickets", 
        "imageLink", "isTargetable", "matchIds", "playerLink"
    ]

    # --- 1. STATE MEMORY & SAFE APPEND FIX ---
    completed_ids = set()
    if os.path.exists(output_csv):
        # Fix missing line breaks so we don't squish rows together
        with open(output_csv, mode='r', encoding='utf-8') as f:
            content = f.read()
            if content and not content.endswith('\n'):
                with open(output_csv, mode='a', encoding='utf-8') as fa:
                    fa.write('\n')

        with open(output_csv, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                completed_ids.add(int(row['id']))
        print(f"🔄 Found {len(completed_ids)} players already saved.")
    else:
        with open(output_csv, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=csv_headers)
            writer.writeheader()

    target_players = []
    with open(input_csv, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            target_players.append(row)

    # --- 2. PRE-FILTER FOR ACCURATE ETA ---
    players_to_scrape = []
    for base_data in target_players:
        url = base_data['playerLink']
        id_match = re.search(r'-(\d+)$', url)
        cricinfo_id = int(id_match.group(1)) if id_match else base_data['global_index_id']
        
        if cricinfo_id not in completed_ids:
            base_data['parsed_id'] = cricinfo_id 
            players_to_scrape.append(base_data)

    total_remaining = len(players_to_scrape)
    if total_remaining == 0:
        print("🎉 All players are already scraped! Database is complete.")
        return

    print(f"🎯 {total_remaining} players remaining to scrape.")
    print("🚀 Initiating High-Speed God-Mode JSON Protocol...\n")

    # --- 3. LAUNCH BROWSER ---
    options = uc.ChromeOptions()
    options.add_argument('--window-size=1280,1024')
    options.add_argument('--disable-gpu')
    options.add_argument('--incognito')
    options.add_argument('--disable-application-cache')
    driver = uc.Chrome(options=options, version_main=148)

    # Telemetry Setup
    recent_times = deque(maxlen=10)

    try:
        for idx, base_data in enumerate(players_to_scrape):
            loop_start_time = time.time()
            
            url = base_data['playerLink']
            name = base_data['name']
            cricinfo_id = base_data['parsed_id']
            
            # --- WAF RETRY LOOP ---
            while True:
                driver.get(url)
                time.sleep(random.uniform(3.0, 5.0))
                
                if "Access Denied" in driver.title or "Reference #" in driver.page_source:
                    print(f"\n🚨 AKAMAI FIREWALL BLOCK DETECTED on {name}! 🚨")
                    print("1. Switch to Mobile Hotspot / Toggle Airplane Mode / Change VPN City.")
                    print("2. Wait 5 seconds.")
                    input("3. PRESS [ENTER] HERE TO RETRY THIS PLAYER...")
                    continue 
                break 

            soup = BeautifulSoup(driver.page_source, 'html.parser')

            player = {
                "id": cricinfo_id, "name": name, "country": base_data['country'],
                "testCap": base_data['testCap'], "playerLink": url,
                "dob": "Unknown", "role": "Unknown", "battingHand": "Unknown",
                "matches": 0, "runs": 0, "wickets": 0, "battingAverage": 0.0, "bowlingAverage": 0.0,
                "fifties": 0, "hundreds": 0, "fiveWickets": 0, "tenWickets": 0,
                "imageLink": "No Image", "isTargetable": 0, "matchIds": "" 
            }

            # --- 4. THE JSON PARSER ---
            script_tag = soup.find('script', id='__NEXT_DATA__')
            if script_tag:
                try:
                    next_data = json.loads(script_tag.string)
                    app_data = next_data.get('props', {}).get('appPageProps', {}).get('data', {})
                    p_info = app_data.get('player', {})
                    
                    # Name & DOB
                    player['name'] = p_info.get('longName') or p_info.get('name') or player['name']
                    dob = p_info.get('dateOfBirth', {})
                    if dob and dob.get('year'):
                        player['dob'] = f"{dob.get('year')}-{str(dob.get('month', 1)).zfill(2)}-{str(dob.get('date', 1)).zfill(2)}"
                        
                    # Safely handle missing Roles
                    roles = p_info.get('playingRoles', [])
                    fielding = p_info.get('fieldingStyles', [])
                    if roles:
                        player['role'] = roles[0].title()
                    elif fielding:
                        player['role'] = fielding[0].title()
                        
                    # Safely handle Batting Hand
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

                    # Safely Extract ALL Stats
                    career_avg = app_data.get('content', {}).get('careerAverages', {}).get('stats', [])
                    for stat in career_avg:
                        if stat.get('cl') == 1: # 1 = Test Matches
                            if stat.get('type') == 'BATTING':
                                player['matches'] = safe_val(stat.get('mt'))
                                player['runs'] = safe_val(stat.get('rn'))
                                player['battingAverage'] = safe_val(stat.get('avg'), True)
                                player['hundreds'] = safe_val(stat.get('hn'))
                                player['fifties'] = safe_val(stat.get('ft'))
                            elif stat.get('type') == 'BOWLING':
                                player['wickets'] = safe_val(stat.get('wk'))
                                player['bowlingAverage'] = safe_val(stat.get('avg'), True)
                                player['fiveWickets'] = safe_val(stat.get('fw'))
                                player['tenWickets'] = safe_val(stat.get('tw'))
                                
                except Exception as e:
                    print(f"   [!] JSON Parse Error for {name}: {e}")
            else:
                print(f"   [!] Could not find Next.js JSON block for {name}")

            # --- 5. MATCH IDS ---
            player["matchIds"] = get_player_match_ids(player["id"])

            # --- 6. SAVE TO CSV ---
            with open(output_csv, mode='a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=csv_headers)
                writer.writerow(player)
            
            # --- 7. TELEMETRY & CLEAN OUTPUT ---
            loop_end_time = time.time()
            loop_duration = loop_end_time - loop_start_time
            recent_times.append(loop_duration)
            
            avg_time = sum(recent_times) / len(recent_times)
            players_left = total_remaining - (idx + 1)
            eta_seconds = int(avg_time * players_left)
            eta_formatted = str(timedelta(seconds=eta_seconds))
            
            print(f"[{idx+1}/{total_remaining}] {player['name']} | Mat: {player['matches']} | Run: {player['runs']} | Wkt: {player['wickets']} | ETA: {eta_formatted}")
            
            # --- 8. THE AMNESIA WIPE ---
            driver.delete_all_cookies()
            driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
            
            time.sleep(random.uniform(1.5, 3.0))

    except Exception as e:
        print(f"❌ Master Loop Error: {e}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    compile_master_database()