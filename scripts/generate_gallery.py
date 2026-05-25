import csv
import os

def build_qa_gallery():
    csv_file = "scripts/final_players_database.csv"
    html_file = "scripts/qa_gallery.html"
    
    players_with_images = []
    
    # 1. Read the CSV and filter for players who supposedly have images
    try:
        with open(csv_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('isTargetable') == '1' and row.get('imageLink') not in ['No Image', '']:
                    players_with_images.append({
                        'id': row['id'],
                        'name': row['name'],
                        'image': row['imageLink']
                    })
    except FileNotFoundError:
        print(f"❌ Error: {csv_file} not found.")
        return

    print(f"🔍 Found {len(players_with_images)} players with images. Building gallery...")

    # 2. Write the HTML string with a dark-mode CSS Grid
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Stumped - Image QA</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #0f172a;
                color: #f8fafc;
                padding: 30px;
                margin: 0;
            }}
            h1 {{ text-align: center; color: #DAAE4F; }}
            p {{ text-align: center; color: #94a3b8; margin-bottom: 40px; }}
            .grid {{
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 20px;
                max-width: 1400px;
                margin: 0 auto;
            }}
            .card {{
                background-color: #1e293b;
                border: 2px solid #334155;
                border-radius: 12px;
                padding: 15px;
                text-align: center;
                transition: transform 0.2s;
            }}
            .card:hover {{
                transform: scale(1.05);
                border-color: #DAAE4F;
            }}
            .card img {{
                width: 100%;
                height: 180px;
                object-fit: contain;
                border-radius: 8px;
                background-color: #000;
                margin-bottom: 10px;
            }}
            .name {{ font-weight: bold; font-size: 15px; margin-bottom: 5px; }}
            .id {{ font-size: 12px; color: #64748b; font-family: monospace; }}
        </style>
    </head>
    <body>
        <h1>Image Quality Assurance</h1>
        <p>Reviewing {len(players_with_images)} Scraped Images. Note the ID of any incorrect pictures!</p>
        
        <div class="grid">
    """

    # 3. Inject each player into the grid using lazy loading
    for p in players_with_images:
        html_content += f"""
            <div class="card">
                <img src="{p['image']}" loading="lazy" alt="Image of {p['name']}">
                <div class="name">{p['name']}</div>
                <div class="id">ID: {p['id']}</div>
            </div>
        """

    # 4. Close HTML tags
    html_content += """
        </div>
    </body>
    </html>
    """

    # 5. Save the file
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"🎉 Success! Open the file: {os.path.abspath(html_file)}")

if __name__ == "__main__":
    build_qa_gallery()