import csv

def verify_match_counts():
    input_csv = "scripts/final_players_database.csv"
    discrepancies = []
    total_players = 0

    print(f"🔍 Running Quality Assurance check on {input_csv}...\n")

    try:
        with open(input_csv, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                total_players += 1
                name = row['name']
                
                # Safely parse the matches from the profile table
                try:
                    profile_matches = int(row['matches'])
                except ValueError:
                    profile_matches = 0
                
                # Count the number of IDs in the semicolon-separated string
                match_ids_str = row['matchIds']
                if match_ids_str:
                    scraped_match_count = len(match_ids_str.split(';'))
                else:
                    scraped_match_count = 0
                    
                # Flag if they don't match
                if profile_matches != scraped_match_count:
                    discrepancies.append({
                        "name": name,
                        "id": row['id'],
                        "profile_count": profile_matches,
                        "scraped_count": scraped_match_count
                    })
                    
        print(f"✅ Scanned {total_players} total players.")
        
        # Output the Report
        if not discrepancies:
            print("🎉 PERFECT DATASET! All Match ID arrays match their profile totals exactly.")
        else:
            print(f"⚠️ Found {len(discrepancies)} data discrepancies:")
            print("-" * 50)
            for d in discrepancies:
                print(f"   - {d['name']} (ID: {d['id']}) | Profile: {d['profile_count']} | Array Size: {d['scraped_count']}")
                
    except FileNotFoundError:
        print(f"❌ Error: Could not find {input_csv}. Ensure the master scrape has finished.")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    verify_match_counts()