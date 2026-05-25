import json
import undetected_chromedriver as uc
from bs4 import BeautifulSoup
import time

def safe_val(v, is_float=False):
    """Helper function to safely convert stats, turning dashes/nulls into 0."""
    if v in [None, '', '-']: 
        return 0.0 if is_float else 0
    try:
        return float(v) if is_float else int(v)
    except (ValueError, TypeError):
        return 0.0 if is_float else 0

def run_ab_test():
    test_urls = [
        {"era": "OLD", "url": "https://www.espncricinfo.com/cricketers/fred-root-19471"},
        {"era": "MODERN", "url": "https://www.espncricinfo.com/cricketers/joe-root-303669"}
    ]
    
    print("🚀 Booting Test Engine (Visible Mode)...\n")
    options = uc.ChromeOptions()
    options.add_argument('--incognito')
    options.add_argument('--window-size=1280,1024')
    driver = uc.Chrome(options=options, version_main=148)
    
    try:
        for item in test_urls:
            print(f"🔍 Testing {item['era']} Era Player: {item['url']}")
            driver.get(item['url'])
            time.sleep(4) # Wait for rendering
            
            # WAF BLOCK DETECTION
            if "Access Denied" in driver.title or "Reference #" in driver.page_source:
                print("   🚨 AKAMAI FIREWALL BLOCK DETECTED! Cannot load page.\n")
                continue
            
            soup = BeautifulSoup(driver.page_source, 'html.parser')
            script_tag = soup.find('script', id='__NEXT_DATA__')
            
            if not script_tag:
                print("   ❌ FAILED: Page loaded, but could not find __NEXT_DATA__ block.\n")
                continue
                
            try:
                # --- EXTRACTION LOGIC ---
                next_data = json.loads(script_tag.string)
                app_data = next_data.get('props', {}).get('appPageProps', {}).get('data', {})
                p_info = app_data.get('player', {})
                
                result = {}
                
                # Name & DOB
                result['name'] = p_info.get('longName') or p_info.get('name') or "Unknown"
                dob = p_info.get('dateOfBirth', {})
                if dob and dob.get('year'):
                    result['dob'] = f"{dob.get('year')}-{str(dob.get('month', 1)).zfill(2)}-{str(dob.get('date', 1)).zfill(2)}"
                else:
                    result['dob'] = "Unknown"
                    
                # Role
                roles = p_info.get('playingRoles', [])
                fielding = p_info.get('fieldingStyles', [])
                if roles:
                    result['role'] = roles[0].title()
                elif fielding:
                    result['role'] = fielding[0].title()
                else:
                    result['role'] = "Unknown"
                    
                # Batting Hand
                batting = p_info.get('battingStyles', [])
                if batting:
                    result['battingHand'] = "Left" if "lhb" in batting else "Right"
                else:
                    result['battingHand'] = "Unknown"
                
                # Image
                img_path = p_info.get('imageUrl') or p_info.get('headshotImageUrl')
                if img_path:
                    if img_path.startswith('/'):
                        result['imageLink'] = f"https://img1.hscicdn.com/image/upload/f_auto,t_h_100_2x{img_path}"
                    else:
                        result['imageLink'] = img_path
                else:
                    result['imageLink'] = "No Image"

                # Stats (Testing Test Matches: cl=1)
                result['matches'] = 0; result['battingAverage'] = 0.0; result['bowlingAverage'] = 0.0
                
                career_avg = app_data.get('content', {}).get('careerAverages', {}).get('stats', [])
                for stat in career_avg:
                    if stat.get('cl') == 1:
                        if stat.get('type') == 'BATTING':
                            result['matches'] = safe_val(stat.get('mt'))
                            result['battingAverage'] = safe_val(stat.get('avg'), True)
                        elif stat.get('type') == 'BOWLING':
                            result['bowlingAverage'] = safe_val(stat.get('avg'), True)

                # --- OUTPUT RESULTS ---
                print("   ✅ EXTRACTION SUCCESSFUL")
                print(f"      Name:  {result['name']}")
                print(f"      DOB:   {result['dob']}")
                print(f"      Role:  {result['role']}")
                print(f"      Hand:  {result['battingHand']}")
                print(f"      Image: {result['imageLink']}")
                print(f"      Stats: {result['matches']} Matches | Bat Avg: {result['battingAverage']} | Bowl Avg: {result['bowlingAverage']}\n")

            except Exception as e:
                print(f"   ❌ FAILED PARSING: {e}\n")

    finally:
        driver.quit()

if __name__ == "__main__":
    run_ab_test()