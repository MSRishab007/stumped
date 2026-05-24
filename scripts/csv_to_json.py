import csv
import json

# --- CONFIGURATION ---
LIMIT_ENTRIES = 5

csv_filename = r"scripts\players.csv"
json_filename = r"scripts\players.json"    

players_list = []

print("Starting CSV to JSON conversion...")

with open(csv_filename, mode='r', encoding='utf-8') as csv_file:
    # 1. Read the raw file first to clean up any messy column headers
    raw_reader = csv.reader(csv_file)
    headers = next(raw_reader)
    
    # Strip spaces and make headers lowercase (e.g., "Runs " or "Runs" becomes "runs")
    cleaned_headers = [h.strip().lower() for h in headers]
    
    # 2. Re-read the file using our sanitized, lowercase headers
    csv_file.seek(0) # Reset file pointer to the beginning
    next(csv_file)   # Skip the original raw header row
    
    csv_reader = csv.DictReader(csv_file, fieldnames=cleaned_headers)
    
    for row in csv_reader:
        if LIMIT_ENTRIES is not None and len(players_list) == LIMIT_ENTRIES:
            print(f"Reached specified cutoff limit of {LIMIT_ENTRIES} entries.")
            break

        if not row.get('id') or not row.get('name', '').strip():
            continue
            
        try:
            # Parse pastTeams into a clean JavaScript Array
            raw_past_teams = row.get('pastteams', '') # Note: lowered header key
            if raw_past_teams and raw_past_teams.strip():
                past_teams_array = [team.strip() for team in raw_past_teams.split(',') if team.strip()]
            else:
                past_teams_array = []

            # Number Parsing Helpers
            def safe_int(value, default=0):
                if not value: return default
                cleaned = ''.join(c for c in str(value) if c.isdigit() or c == '-')
                return int(cleaned) if cleaned else default

            def safe_float(value, default=0.0):
                if not value: return default
                try:
                    cleaned = ''.join(c for c in str(value) if c.isdigit() or c in '.-')
                    return float(cleaned) if cleaned else default
                except ValueError:
                    return default

            # 3. Structure the Profile Layout using the lowercase keys
            player_json_data = {
                "id": safe_int(row.get('id')),
                "name": row.get('name', '').strip(),
                "currentTeam": row.get('team', '').strip(),
                "pastTeams": past_teams_array,
                "role": row.get('role', '').strip(),
                "battingHand": row.get('battinghand', '').strip(),
                "debutYear": safe_int(row.get('debutyear')),
                "currentPrice": safe_float(row.get('auctionprice')),
                "matches": safe_int(row.get('matches')),
                "runs": safe_int(row.get('runs')),
                "wickets": safe_int(row.get('wickets')),
                "espnLink": row.get('playerlink', '').strip()
            }
            
            players_list.append(player_json_data)
            
        except Exception as e:
            print(f"Error transforming row ID {row.get('id', 'Unknown')}: {e}")

with open(json_filename, mode='w', encoding='utf-8') as json_file:
    json.dump(players_list, json_file, indent=2, ensure_ascii=False)

print(f"Success! Processed {len(players_list)} player rows into '{json_filename}'.")