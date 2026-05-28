import csv
import json
import os

# --- CONFIGURATION ---
INPUT_CSV = "scripts/final_ipl_database.csv"
OUTPUT_JSON = "scripts/final_ipl_database.json"

def convert_csv_to_json():
    if not os.path.exists(INPUT_CSV):
        print(f"❌ Error: Could not find {INPUT_CSV}")
        return

    players_list = []
    
    print(f"🔄 Reading data from {INPUT_CSV}...")
    with open(INPUT_CSV, mode='r', encoding='utf-8') as csv_file:
        reader = csv.DictReader(csv_file)
        
        for row in reader:
            # 1. Parse stringified JSON arrays safely
            try:
                past_teams = json.loads(row.get("pastTeams", "[]"))
            except json.JSONDecodeError:
                past_teams = []

            try:
                search_terms = json.loads(row.get("searchTerms", "[]"))
            except json.JSONDecodeError:
                search_terms = []

            # 2. Parse match IDs from semicolon string to array
            match_ids_raw = row.get("matchIds", "")
            match_ids = [m_id for m_id in match_ids_raw.split(";") if m_id.strip()]

            # 3. Smart Auction Price Handler
            auction_price_raw = row.get("auctionPrice", "").strip()
            
            if not auction_price_raw or auction_price_raw.lower() in ["unknown", "null", "-"]:
                auction_price = None  # Converts blanks or "Unknown" to JSON null. Change to "Unknown" if you prefer string text.
            else:
                try:
                    # If it's a pure number (like 1800), save it as a clean integer
                    auction_price = int(auction_price_raw)
                except ValueError:
                    # If it's descriptive text (like "Retained" or "Base Price"), save it as a string
                    auction_price = auction_price_raw

            # 4. Construct strongly-typed dictionary
            player_data = {
                "id": row.get("id"),
                "name": row.get("name"),
                "currentFranchise": row.get("currentFranchise"),
                "pastTeams": past_teams,
                "dob": row.get("dob"),
                "role": row.get("role"),
                "auctionPrice": auction_price, # <--- Smart value/null applied here
                "battingHand": row.get("battingHand"),
                "debutYear": row.get("debutYear"),
                "matches": int(row.get("matches", 0) or 0),
                "runs": int(row.get("runs", 0) or 0),
                "strikeRate": float(row.get("strikeRate", 0.0) or 0.0),
                "wickets": int(row.get("wickets", 0) or 0),
                "economy": float(row.get("economy", 0.0) or 0.0),
                "searchTerms": search_terms,
                "imageLink": row.get("imageLink"),
                "isTargetable": int(row.get("isTargetable", 0) or 0),
                "matchIds": match_ids,
                "playerLink": row.get("playerLink")
            }
            
            players_list.append(player_data)

    # --- SAVE TO JSON ---
    print(f"💾 Saving {len(players_list)} players to {OUTPUT_JSON}...")
    with open(OUTPUT_JSON, mode='w', encoding='utf-8') as json_file:
        json.dump(players_list, json_file, indent=4)
        
    print("🎉 Conversion complete! Database is finalized and ready.")

if __name__ == "__main__":
    convert_csv_to_json()