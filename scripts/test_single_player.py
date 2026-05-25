import time
import re
import json
import undetected_chromedriver as uc
from bs4 import BeautifulSoup

def parse_single_player_live(url):
    print(f"🚀 Launching Chrome to fetch: {url}\n")
    
    options = uc.ChromeOptions()
    options.add_argument('--window-size=1280,1024')
    options.add_argument('--disable-gpu')
    
    # Using your matching Chrome version
    driver = uc.Chrome(options=options, version_main=148)
    
    player = {
        "name": "Unknown",
        "dob": "Unknown",
        "role": "Unknown",
        "battingHand": "Unknown",
        "matches": 0,
        "runs": 0,
        "wickets": 0,
        "battingAverage": 0.0,
        "bowlingAverage": 0.0,
        "fifties": 0,
        "hundreds": 0,
        "fiveWickets": 0,
        "tenWickets": 0,
        "imageLink": "",
        "isTargetable": 0
    }

    try:
        driver.get(url)
        # Give Cloudflare time to verify the browser and let the DOM render
        time.sleep(5) 
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # 1. Player Name
        name_tag = soup.find('h1')
        if name_tag:
            player['name'] = name_tag.text.strip()

        # 2. Extract Image & isTargetable Logic
        img_tag = soup.find('img', alt=player['name'])
        if img_tag and 'src' in img_tag.attrs:
            src = img_tag['src']
            if "lazyimage" not in src and "wassets" not in src:
                player['imageLink'] = src
                player['isTargetable'] = 1
            else:
                player['imageLink'] = "No Image"
                player['isTargetable'] = 0

        # 3. Extract Biography Details (Bulletproof Parent Parsing)
        for p in soup.find_all('p'):
            header_text = p.text.strip().lower()
            
            # Target our specific biography headers
            if header_text in ['born', 'batting style', 'playing role']:
                parent_div = p.parent
                val_tag = parent_div.find('span')
                
                if val_tag:
                    val_text = val_tag.text.strip()
                    
                    if header_text == 'born':
                        # Extracts exactly "December 19, 1969" and ignores the city/state
                        date_match = re.search(r'([A-Za-z]+\s\d{1,2},\s\d{4})', val_text)
                        if date_match:
                            try:
                                from datetime import datetime
                                date_obj = datetime.strptime(date_match.group(1), "%B %d, %Y")
                                player["dob"] = date_obj.strftime("%Y-%m-%d")
                            except:
                                player["dob"] = date_match.group(1)
                                
                    elif header_text == 'batting style':
                        player["battingHand"] = "Left" if "left" in val_text.lower() else "Right"
                        
                    elif header_text == 'playing role':
                        player["role"] = val_text
        # 4. Extract Stats Tables
        tables = soup.find_all('table')
        for table in tables:
            headers = [th.text.strip().lower() for th in table.find_all('th')]
            
            is_batting = '100s' in headers
            is_bowling = '10w' in headers

            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if not cells: continue
                
                format_name = cells[0].text.strip().lower()
                if "tests" in format_name:
                    
                    def safe_num(val, is_float=False):
                        v = val.replace(',', '').replace('-', '0').strip()
                        if not v: return 0.0 if is_float else 0
                        return float(v) if is_float else int(v)

                    if is_batting:
                        player["matches"] = safe_num(cells[headers.index('mat')].text)
                        player["runs"] = safe_num(cells[headers.index('runs')].text)
                        player["battingAverage"] = safe_num(cells[headers.index('ave')].text, is_float=True)
                        player["hundreds"] = safe_num(cells[headers.index('100s')].text)
                        player["fifties"] = safe_num(cells[headers.index('50s')].text)

                    elif is_bowling:
                        player["wickets"] = safe_num(cells[headers.index('wkts')].text)
                        player["bowlingAverage"] = safe_num(cells[headers.index('ave')].text, is_float=True)
                        player["fiveWickets"] = safe_num(cells[headers.index('5w')].text)
                        player["tenWickets"] = safe_num(cells[headers.index('10w')].text)

    except Exception as e:
        print(f"Error parsing profile: {e}")
    finally:
        driver.quit()

    return player

if __name__ == "__main__":
    test_url = "https://www.espncricinfo.com/cricketers/nayan-mongia-31036"
    result = parse_single_player_live(test_url)
    print("\n✅ Parsing Complete! Result payload:")
    print(json.dumps(result, indent=4))