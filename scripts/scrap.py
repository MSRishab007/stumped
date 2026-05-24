# # import requests
# # from bs4 import BeautifulSoup
# # import csv

# # team_urls = {
# #     "CSK": "https://www.espncricinfo.com/series/ipl-2026-1510719/chennai-super-kings-squad-1511148/series-squads",
# #     "DC" : "https://www.espncricinfo.com/series/ipl-2026-1510719/delhi-capitals-squad-1511107/series-squads",
# #     "GT" : "https://www.espncricinfo.com/series/ipl-2026-1510719/gujarat-titans-squad-1511094/series-squads",
# #     "KKR": "https://www.espncricinfo.com/series/ipl-2026-1510719/kolkata-knight-riders-squad-1511092/series-squads",
# #     "LSG": "https://www.espncricinfo.com/series/ipl-2026-1510719/lucknow-super-giants-squad-1511235/series-squads",
# #     "MI":  "https://www.espncricinfo.com/series/ipl-2026-1510719/mumbai-indians-squad-1511109/series-squads",
# #     "PBKS": "https://www.espncricinfo.com/series/ipl-2026-1510719/punjab-kings-squad-1511082/series-squads",
# #     "RR": "https://www.espncricinfo.com/series/ipl-2026-1510719/rajasthan-royals-squad-1511089/series-squads",
# #     "RCB": "https://www.espncricinfo.com/series/ipl-2026-1510719/royal-challengers-bengaluru-squad-1511134/series-squads",
# #     "SRH": "https://www.espncricinfo.com/series/ipl-2026-1510719/sunrisers-hyderabad-squad-1511114/series-squads",
# #     }


# # headers = {
# #     'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
# # }

# # all_players = []
# # player_id = 1

# # print("Starting the scraper...")

# # # Loop through each team
# # for team_name, url in team_urls.items():
# #     print(f"Scraping {team_name}...")
    
# #     response = requests.get(url, headers=headers)
# #     soup = BeautifulSoup(response.text, 'html.parser')
    
# #     # Find all the "Player Cards"
# #     player_cards = soup.find_all('div', class_='ds-relative ds-flex ds-flex-row ds-space-x-4 ds-p-3') 

# #     for card in player_cards:
# #         try:
# #             # 1. Extract Name
# #             name_tag = card.find('span', class_='ds-text-compact-s ds-font-medium ds-block ds-text-typo ds-underline ds-decoration-ui-stroke hover:ds-text-typo-primary hover:ds-decoration-ui-stroke-primary')
# #             if not name_tag:
# #                 continue 
# #             name = name_tag.text.strip()
            
# #             # 2. Extract Profile Link
# #             # We look for the anchor <a> tag inside the card
# #             a_tag = card.find('a', href=True)
# #             player_link = ""
# #             if a_tag:
# #                 href = a_tag['href']
# #                 # ESPNcricinfo uses relative links, so we add the base domain
# #                 if href.startswith('/'):
# #                     player_link = f"https://www.espncricinfo.com{href}"
# #                 else:
# #                     player_link = href

# #             # 3. Extract Role
# #             role_tag = card.find('p', class_='ds-text-tight-s ds-font-regular ds-mb-2 ds-mt-1')
# #             role = role_tag.text.strip() if role_tag else "Unknown"
            
# #             # 4. Extract Batting Hand
# #             batting_hand = "Unknown"
# #             details = card.find_all('span', class_='ds-text-compact-xxs ds-font-medium  ')
# #             for detail in details:
# #                 if "Batting:" in detail.text:
# #                     batting_hand = detail.text.replace("Batting:", "").replace("hand Bat", "").strip()
            
# #             # Create our player dictionary! 
# #             # (Empty strings are used so your CSV cells are blank and ready to fill)
# #             player_data = {
# #                 "id": player_id,
# #                 "name": name,
# #                 "team": team_name,
# #                 "pastTeams": "", 
# #                 "role": role,
# #                 "battingHand": batting_hand,
# #                 "jerseyNo": "",    
# #                 "debutYear": "",   
# #                 "auctionPrice": "", 
# #                 "matches": "",      
# #                 "playerLink": player_link
# #             }
            
# #             all_players.append(player_data)
# #             player_id += 1
            
# #         except Exception as e:
# #             print(f"Error parsing a player: {e}")

# # 5. Save directly to a CSV file
# csv_filename = 'cricinfo_players.csv'
# fieldnames = [
#     'id', 'name', 'team', 'pastTeams', 'role', 'battingHand', 
#     'jerseyNo', 'debutYear', 'auctionPrice', 'matches', 'playerLink'
# ]

# with open(csv_filename, mode='w', newline='', encoding='utf-8') as csv_file:
#     writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
    
#     # Write the column headers (Row 1)
#     writer.writeheader()
#     # Write all the player data
#     writer.writerows(all_players)

# print(f"Successfully scraped {len(all_players)} players! Saved to {csv_filename}")


from bs4 import BeautifulSoup
import csv
import os 

# 1. Read the local HTML file we saved from Chrome
with open('test.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# 2. Parse it with BeautifulSoup
soup = BeautifulSoup(html_content, 'html.parser')

all_players = []
player_id = 1

print("Parsing the local HTML file...")

# Find all the "Player Cards"
# NOTE: Update 'ds-p-4' if the class name is different in your saved HTML!
player_cards = soup.find_all('div', class_='ds-relative ds-flex ds-flex-row ds-space-x-4 ds-p-3') 

for card in player_cards:
    try:
        # Extract Name
        name_tag = card.find('span', class_='ds-text-compact-s ds-font-medium ds-block ds-text-typo ds-underline ds-decoration-ui-stroke hover:ds-text-typo-primary hover:ds-decoration-ui-stroke-primary')
        if not name_tag:
            continue 
        name = name_tag.text.strip()
        
        # Extract Profile Link
        a_tag = card.find('a', href=True)
        player_link = ""
        if a_tag:
            href = a_tag['href']
            player_link = f"https://www.espncricinfo.com{href}" if href.startswith('/') else href

        # Extract Role
        role_tag = card.find('p', class_='ds-text-tight-s ds-font-regular ds-mb-2 ds-mt-1')
        role = role_tag.text.strip() if role_tag else "Unknown"
        
        
        # Grab ALL visible text inside the player's card, separated by a "|"
        # It turns the card into something like: "MS Dhoni | Batter | Batting: Right hand Bat"
        # 4. Extract Batting Hand (The Sledgehammer Method)
        batting_hand = "Unknown"
        
        # Grab absolutely all text, separate it with spaces, and make it lowercase
        full_text = card.get_text(separator=" ", strip=True).lower()
        
        # Ignore formatting completely. Just look for the words anywhere in the text.
        if "right hand" in full_text:
            batting_hand = "Right"
        elif "left hand" in full_text:
            batting_hand = "Left"
        
        # Create player dictionary
        player_data = {
            "id": player_id,
            "name": name,
            "team": "SRH", # Hardcoded since we are doing one team's file at a time
            "pastTeams": "", 
            "role": role,
            "battingHand": batting_hand,
            "jerseyNo": "",    
            "debutYear": "",   
            "auctionPrice": "", 
            "matches": "",      
            "playerLink": player_link
        }
        
        all_players.append(player_data)
        player_id += 1
        
    except Exception as e:
        print(f"Error parsing a player: {e}")

# 3. Save to CSV (Append Mode)
csv_filename = 'players.csv' # Use a master filename
fieldnames = ['id', 'name', 'team', 'pastTeams', 'role', 'battingHand', 'jerseyNo', 'debutYear', 'auctionPrice', 'matches', 'playerLink']

# Check if the file exists and isn't empty so we know whether to write the header
file_exists = os.path.isfile(csv_filename) and os.path.getsize(csv_filename) > 0

# Open in 'a' (append) mode
with open(csv_filename, mode='a', newline='', encoding='utf-8') as csv_file:
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
    
    # Only write the header if this is the very first time creating the file
    if not file_exists:
        writer.writeheader()
        
    writer.writerows(all_players)

print(f"Successfully appended {len(all_players)} players to {csv_filename}!")