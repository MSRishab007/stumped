import csv
import re
import time
import random
import os
import requests
from datetime import datetime, timedelta
from collections import deque
import undetected_chromedriver as uc
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

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
    output_csv = "scripts/final_players_database.csv"
    
    csv_headers = [
        "id", "name", "country", "testCap", "dob", "role", "battingHand", 
        "matches", "runs", "wickets", "battingAverage", "bowlingAverage", 
        "fifties", "hundreds", "fiveWickets", "tenWickets", 
        "imageLink", "isTargetable", "matchIds", "playerLink"
    ]

    # --- 1. STATE MEMORY ---
    completed_ids = set()
    if os.path.exists(output_csv):
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
            # Save the ID into the dictionary so we don't have to calculate it again
            base_data['parsed_id'] = cricinfo_id 
            players_to_scrape.append(base_data)

    total_remaining = len(players_to_scrape)
    if total_remaining == 0:
        print("🎉 All players are already scraped! Database is complete.")
        return

    print(f"🎯 {total_remaining} players remaining to scrape.")
    print("🚀 Initiating High-Speed Amnesia Scraping Protocol...\n")

    # BROWSER LAUNCH
    options = uc.ChromeOptions()
    options.add_argument('--window-size=1280,1024')
    options.add_argument('--disable-gpu')
    options.add_argument('--incognito')
    options.add_argument('--disable-application-cache')
    driver = uc.Chrome(options=options, version_main=148)

    # --- TELEMETRY SETUP ---
    recent_times = deque(maxlen=10)

    try:
        for idx, base_data in enumerate(players_to_scrape):
            loop_start_time = time.time() # Start the stopwatch
            
            url = base_data['playerLink']
            name = base_data['name']
            cricinfo_id = base_data['parsed_id']
                
            print(f"[{idx+1}/{total_remaining}] Processing: {name} (ID: {cricinfo_id})")
            
            # --- WAF RETRY LOOP ---
            while True:
                driver.get(url)
                time.sleep(random.uniform(3.5, 5.5))
                
                if "Access Denied" in driver.title or "Reference #" in driver.page_source:
                    print("\n🚨 AKAMAI FIREWALL BLOCK DETECTED! 🚨")
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

            # EXTRACT FULL NAME
            name_tag = soup.find('h1')
            if name_tag:
                player['name'] = name_tag.text.strip()

            # IMAGE EXTRACTION
            all_images = soup.find_all('img')
            for img in all_images:
                src = img.get('src', '')
                alt = img.get('alt', '').lower()
                src_lower = src.lower()
                
                if 'wassets' in src_lower or 'lazyimage' in src_lower:
                    continue
                if 'logo' in src_lower or 'flag' in src_lower or 'logo' in alt or 'flag' in alt:
                    continue
                
                if '/pictures/cms/' in src_lower or '/pictures/db/' in src_lower or '.player.jpg' in src_lower:
                    player['imageLink'] = src
                    player['isTargetable'] = 1
                    break 

            # BIOGRAPHY
            for p in soup.find_all('p'):
                header_text = p.text.strip().lower()
                if header_text in ['born', 'batting style', 'playing role']:
                    parent_div = p.parent
                    if not parent_div: continue
                    val_tag = parent_div.find('span')
                    if val_tag:
                        val_text = val_tag.text.strip()
                        if header_text == 'born':
                            date_match = re.search(r'([A-Za-z]+\s\d{1,2},\s\d{4})', val_text)
                            if date_match:
                                try:
                                    date_obj = datetime.strptime(date_match.group(1), "%B %d, %Y")
                                    player["dob"] = date_obj.strftime("%Y-%m-%d")
                                except:
                                    player["dob"] = date_match.group(1)
                        elif header_text == 'batting style':
                            player["battingHand"] = "Left" if "left" in val_text.lower() else "Right"
                        elif header_text == 'playing role':
                            player["role"] = val_text

            # TABLES
            tables = soup.find_all('table')
            for table in tables:
                headers = [th.text.strip().lower() for th in table.find_all('th')]
                is_batting = '100s' in headers
                is_bowling = '10w' in headers

                rows = table.find_all('tr')
                for row in rows:
                    cells = row.find_all(['td', 'th'])
                    if not cells: continue
                    if "tests" in cells[0].text.strip().lower():
                        def safe_num(val, is_float=False):
                            v = val.text.replace(',', '').replace('-', '0').strip()
                            if not v: return 0.0 if is_float else 0
                            return float(v) if is_float else int(v)

                        if is_batting:
                            player["matches"] = safe_num(cells[headers.index('mat')])
                            player["runs"] = safe_num(cells[headers.index('runs')])
                            player["battingAverage"] = safe_num(cells[headers.index('ave')], True)
                            player["hundreds"] = safe_num(cells[headers.index('100s')])
                            player["fifties"] = safe_num(cells[headers.index('50s')])
                        elif is_bowling:
                            player["wickets"] = safe_num(cells[headers.index('wkts')])
                            player["bowlingAverage"] = safe_num(cells[headers.index('ave')], True)
                            player["fiveWickets"] = safe_num(cells[headers.index('5w')])
                            player["tenWickets"] = safe_num(cells[headers.index('10w')])

            # MATCH IDS
            player["matchIds"] = get_player_match_ids(player["id"])

            # SAVE TO CSV
            with open(output_csv, mode='a', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=csv_headers)
                writer.writerow(player)
            
            # --- ETA & TELEMETRY CALCULATIONS ---
            loop_end_time = time.time()
            loop_duration = loop_end_time - loop_start_time
            recent_times.append(loop_duration)
            
            avg_time = sum(recent_times) / len(recent_times)
            players_left = total_remaining - (idx + 1)
            eta_seconds = int(avg_time * players_left)
            eta_formatted = str(timedelta(seconds=eta_seconds))
            
            print(f"   [+] Saved {player['name']} | Time: {loop_duration:.1f}s | Avg: {avg_time:.1f}s | ETA: {eta_formatted}")
            
            # THE AMNESIA WIPE
            driver.delete_all_cookies()
            driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
            
            time.sleep(random.uniform(1.5, 3.5))

    except Exception as e:
        print(f"❌ Master Loop Error: {e}")
    finally:
        if driver:
            driver.quit()

if __name__ == "__main__":
    compile_master_database()