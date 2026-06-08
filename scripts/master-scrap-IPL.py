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

team_urls = {
    "CSK": "https://www.espncricinfo.com/series/ipl-2026-1510719/chennai-super-kings-squad-1511148/series-squads",
    "DC" : "https://www.espncricinfo.com/series/ipl-2026-1510719/delhi-capitals-squad-1511107/series-squads",
    "GT" : "https://www.espncricinfo.com/series/ipl-2026-1510719/gujarat-titans-squad-1511094/series-squads",
    "KKR": "https://www.espncricinfo.com/series/ipl-2026-1510719/kolkata-knight-riders-squad-1511092/series-squads",
    "LSG": "https://www.espncricinfo.com/series/ipl-2026-1510719/lucknow-super-giants-squad-1511235/series-squads",
    "MI":  "https://www.espncricinfo.com/series/ipl-2026-1510719/mumbai-indians-squad-1511109/series-squads",
    "PBKS": "https://www.espncricinfo.com/series/ipl-2026-1510719/punjab-kings-squad-1511082/series-squads",
    "RR": "https://www.espncricinfo.com/series/ipl-2026-1510719/rajasthan-royals-squad-1511089/series-squads",
    "RCB": "https://www.espncricinfo.com/series/ipl-2026-1510719/royal-challengers-bengaluru-squad-1511134/series-squads",
    "SRH": "https://www.espncricinfo.com/series/ipl-2026-1510719/sunrisers-hyderabad-squad-1511114/series-squads",
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


def get_player_links(team_url):
    """Scrapes the team squad page to get player profile links."""
    print(f"Fetching team page: {team_url}")
    response = requests.get(team_url, headers=HEADERS)
    soup = BeautifulSoup(response.text, 'html.parser')
    
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
    return (player_links)

def scrape_team_players(team_name, team_url):
    """Scrapes all player details of a given team."""
    print(f"Scraping players for {team_name}...")
    player_links = get_player_links(team_url)
    print(f"Found {len(player_links)} players for {team_name}")
    
def get_player_details(player_url,team_name):
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
        name = "Unknown"
        h1 = soup.find('h1')
        if h1: name = h1.text.strip()
        player = {
            "id": player_id,
            "name": name,
            "team": team_name,
            "pastTeams": [],
            "role": "Unknown",
            "battingHand": "Unknown",
            "matches": 0,
            "runs": 0,
            "wickets": 0,
            "strikeRate": 0.0,
            "economy": 0.0,
            "debutYear": None,
            "auctionPrice": None,
            "matchIDs": [],
            "playerLink": player_url,
            "imageLink": "",
            "isTargetable": 0,
            "keywords": []
            
        }
            
        script_tag = soup.find('script', string=lambda x: x and 'nextData' in x)
        if script_tag:
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
        print(json.dumps(player, indent=2))
    except Exception as e:
        print(f"Error fetching {player_url}: {e}")

get_player_details("https://www.espncricinfo.com/player/virat-kohli-253802", "RCB")