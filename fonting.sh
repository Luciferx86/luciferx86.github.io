#!/bin/bash

# Root folder containing all subfolders with index.html
ROOT_DIR="./details"

# Loop through each index.html file
find "$ROOT_DIR" -type f -name "index.html" | while read -r file; do
    echo "Processing $file ..."

    # 1️⃣ Add <link rel="stylesheet" href="/assets/css/fonts.css"> after the first <head> tag
    sed -i '' '0,/<head>/s|<head>|<head>\n  <link rel="stylesheet" href="/assets/css/fonts.css">|' "$file"

    # 2️⃣ Add font-family: 'BorisBlack'; to h1 CSS inside <style> block
    # This will append the line after the existing 'h1 {' line
    sed -i '' '/h1 *{/a\
    font-family: '\''BorisBlack'\'';' "$file"

    # 3️⃣ Add font-family: 'Outfit'; to p CSS inside <style> block
    sed -i '' '/p *{/a\
    font-family: '\''Outfit'\'';' "$file"

done

echo "All files updated!"