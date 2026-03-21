#!/bin/bash
# Build a demo video from Cypress recordings with title cards and 0.3x speed
set -euo pipefail

cd "$(dirname "$0")/.."

VID=cypress/videos
OUT=demo
W=2560
H=1440
FPS=25
SLOW=0.3  # playback speed (lower = slower)
CARD_DUR=3 # title card duration in seconds
FONT="fontfile=/System/Library/Fonts/Supplemental/Arial.ttf"

mkdir -p "$OUT/tmp"

echo "==> Generating title cards..."

# Title card generator: bg color, main text, subtitle, output file
make_card() {
  local bg="$1" main="$2" sub="$3" outfile="$4" dur="${5:-$CARD_DUR}"
  ffmpeg -y -f lavfi \
    -i "color=c=${bg}:s=${W}x${H}:d=${dur}:r=${FPS}" \
    -vf "\
      drawtext=${FONT}:text='${main}':fontcolor=0xF0EAD8:fontsize=96:x=(w-text_w)/2:y=(h-text_h)/2-60,\
      drawtext=${FONT}:text='${sub}':fontcolor=0x8C8272:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2+60\
    " \
    -c:v libx264 -pix_fmt yuv420p -t "$dur" "$outfile" 2>/dev/null
  echo "    $outfile"
}

# Intro card (4 seconds)
make_card "0x111009" "CORTEGE" "AI Security Companions for Every Household" "$OUT/tmp/00-intro.mp4" 4

# Section cards
make_card "0x111009" "Household Management" "Multi-household CRUD with Twilio routing" "$OUT/tmp/01-card-household.mp4"
make_card "0x111009" "Member Management" "Add, edit, and assign companion agents" "$OUT/tmp/03-card-member.mp4"
make_card "0x111009" "Companion Agents" "Per-member AI companions with learning stages" "$OUT/tmp/05-card-companion.mp4"
make_card "0x111009" "Live Threat Feed" "Real-time event injection and monitoring" "$OUT/tmp/07-card-livefeed.mp4"
make_card "0x111009" "Fraud Case Detection" "Evidence collection and risk analysis" "$OUT/tmp/09-card-fraud.mp4"

# Outro card (4 seconds)
ffmpeg -y -f lavfi \
  -i "color=c=0x111009:s=${W}x${H}:d=4:r=${FPS}" \
  -vf "\
    drawtext=${FONT}:text='CORTEGE':fontcolor=0xE8A838:fontsize=80:x=(w-text_w)/2:y=(h-text_h)/2-120,\
    drawtext=${FONT}:text='Taylor Parsons  |  Rich Rosenthal  |  Jennifer McKinney':fontcolor=0xF0EAD8:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2-20,\
    drawtext=${FONT}:text='github.com/taylorparsons/cortege-hackathon':fontcolor=0x8C8272:fontsize=32:x=(w-text_w)/2:y=(h-text_h)/2+50\
  " \
  -c:v libx264 -pix_fmt yuv420p -t 4 "$OUT/tmp/11-outro.mp4" 2>/dev/null
echo "    $OUT/tmp/11-outro.mp4"

echo "==> Slowing down Cypress videos to ${SLOW}x speed..."

slow_video() {
  local src="$1" dst="$2"
  local pts_mul
  pts_mul=$(echo "scale=4; 1/$SLOW" | bc)
  ffmpeg -y -i "$src" \
    -vf "setpts=${pts_mul}*PTS,scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x111009" \
    -r "$FPS" -c:v libx264 -pix_fmt yuv420p -an "$dst" 2>/dev/null
  echo "    $dst"
}

slow_video "$VID/household-crud.cy.js.mp4"  "$OUT/tmp/02-household.mp4"
slow_video "$VID/member-crud.cy.js.mp4"     "$OUT/tmp/04-member.mp4"
slow_video "$VID/companion-cards.cy.js.mp4" "$OUT/tmp/06-companion.mp4"
slow_video "$VID/live-feed.cy.js.mp4"       "$OUT/tmp/08-livefeed.mp4"
slow_video "$VID/fraud-case-demo.cy.js.mp4" "$OUT/tmp/10-fraud.mp4"

echo "==> Concatenating segments..."

# Build concat list (sorted by filename prefix)
: > "$OUT/tmp/concat.txt"
for f in $(ls "$OUT/tmp"/*.mp4 | sort); do
  echo "file '$(pwd)/$f'" >> "$OUT/tmp/concat.txt"
done

ffmpeg -y -f concat -safe 0 -i "$OUT/tmp/concat.txt" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart \
  "$OUT/cortege-demo.mp4" 2>/dev/null

DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/cortege-demo.mp4")
echo ""
echo "==> Done! Demo video: $OUT/cortege-demo.mp4 (${DURATION}s)"
echo ""

# Cleanup
rm -rf "$OUT/tmp"
echo "==> Cleaned up temp files"
