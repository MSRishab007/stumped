import csv
import re
import time
import undetected_chromedriver as uc
from bs4 import BeautifulSoup

TEST_TEAMS = {
    "England": "https://www.espncricinfo.com/cricketers/team/england-1/caps/test-1",
    "Australia": "https://www.espncricinfo.com/cricketers/team/australia-2/caps/test-1",
    "South Africa": "https://www.espncricinfo.com/cricketers/team/south-africa-3/caps/test-1",
    "West Indies": "https://www.espncricinfo.com/cricketers/team/west-indies-4/caps/test-1",
    "New Zealand": "https://www.espncricinfo.com/cricketers/team/new-zealand-5/caps/test-1",
    "India": "https://www.espncricinfo.com/cricketers/team/india-6/caps/test-1",
    "Pakistan": "https://www.espncricinfo.com/cricketers/team/pakistan-7/caps/test-1",
    "Sri Lanka": "https://www.espncricinfo.com/cricketers/team/sri-lanka-8/caps/test-1",
    "Zimbabwe": "https://www.espncricinfo.com/cricketers/team/zimbabwe-9/caps/test-1",
    "Bangladesh": "https://www.espncricinfo.com/cricketers/team/bangladesh-25/caps/test-1",
    "Ireland": "https://www.espncricinfo.com/cricketers/team/ireland-29/caps/test-1",
    "Afghanistan": "https://www.espncricinfo.com/cricketers/team/afghanistan-40/caps/test-1"
}

def harvest_all_rosters_hybrid():
    output_csv = "scripts/players_directory.csv"
    csv_headers = ["global_index_id", "name", "testCap", "country", "playerLink"]
    
    print("Launching Chrome Window in Interactive Mode...")
    options = uc.ChromeOptions()
    options.add_argument('--window-size=1280,1024')
    options.add_argument('--disable-gpu')
    
    driver = uc.Chrome(options=options, version_main=148)
    all_discovered_players = []
    global_id = 1
    
    try:
        for country_name, target_url in TEST_TEAMS.items():
            print(f"\n🌍 Opening Cap Registry for: {country_name}")
            driver.get(target_url)
            
            # Allow a moment for initial paint
            time.sleep(3)
            
            # INTERACTIVE TRIGGER: The script pauses here and waits for your signal
            print(f"👉 ACTION REQUIRED: Scroll down the browser window for {country_name} until you hit Cap #1.")
            input("⌨️ Press [ENTER] here in the terminal once the full roster has loaded to parse it... ")
            
            print(f"⚙️ Parsing fully-rendered layout for {country_name}...")
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            rows = soup.find_all('tr', class_=lambda x: x and 'ds-table-row' in x) or soup.find_all('tr')
            
            team_count = 0
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 2:
                    cap_text = cells[0].text.strip()
                    name_anchor = cells[1].find('a')
                    
                    if name_anchor and name_anchor.get('href'):
                        relative_url = name_anchor.get('href')
                        full_player_url = relative_url if relative_url.startswith('http') else f"https://www.espncricinfo.com{relative_url}"
                        
                        if "/cricketers/" in full_player_url:
                            cap_number = ''.join(filter(str.isdigit, cap_text))
                            
                            all_discovered_players.append({
                                "global_index_id": global_id,
                                "name": name_anchor.text.strip(),
                                "testCap": cap_number,
                                "country": country_name,
                                "playerLink": full_player_url
                            })
                            global_id += 1
                            team_count += 1
            
            print(f"✅ Extracted {team_count} total players for {country_name}!")
            
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        driver.quit()
        print("\nChrome window closed.")

    if all_discovered_players:
        print(f"\nWriting {len(all_discovered_players)} total players into '{output_csv}'...")
        with open(output_csv, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=csv_headers)
            writer.writeheader()
            for player in all_discovered_players:
                writer.writerow(player)
        print("🎉 Complete player registry compiled perfectly!")

if __name__ == "__main__":
    harvest_all_rosters_hybrid()