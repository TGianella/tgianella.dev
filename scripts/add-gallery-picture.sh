#!/usr/bin/env bash
# Usage: ./add-gallery-picture.sh <file> [<file> ...]
# Files can be bare names (resolved from ~/Downloads) or full paths.
# If the filename stem is already YYYYMMDD the date is used automatically.
set -euo pipefail

R2_BUCKET="images-personal-site"
CDN_BASE="https://images.tgianella.dev"
DOWNLOADS=~/Downloads
COMPRESSED_DIR=~/Pictures/"Blue screens compressed"
THUMBNAILS_DIR=~/Pictures/"Blue screens thumbnails"
CONTENT_DIR="$(cd "$(dirname "$0")/.." && pwd)/src/content/gallery"
THUMB_W=400
THUMB_H=533
TARGET_MAX_KB=200
TARGET_MIN_KB=150

# ── helpers ───────────────────────────────────────────────────────────────────

die() { echo "error: $*" >&2; exit 1; }

# Convert HEIC to a temp JPEG so ffmpeg can process it, set src to the temp file.
# Requires libheif-examples (sudo apt install libheif-examples).
# Call as: maybe_convert_heic src_varname tmp_varname
# Sets $tmp_jpeg to the temp path (empty string if no conversion needed).
tmp_jpeg=""
maybe_convert_heic() {
    local -n _src=$1
    local ext="${_src##*.}"
    ext="${ext,,}"  # lowercase
    if [[ "$ext" == "heic" || "$ext" == "heif" ]]; then
        if ! command -v heif-convert &>/dev/null; then
            die "HEIC file detected but heif-convert is not installed.\nRun: sudo apt install libheif-examples"
        fi
        tmp_jpeg="$(mktemp --suffix=.jpg)"
        echo "  converting HEIC → JPEG (temp) …"
        heif-convert "$_src" "$tmp_jpeg" >/dev/null
        # Strip EXIF orientation tag so ffmpeg doesn't auto-rotate the already-correct pixels
        python3 - "$tmp_jpeg" <<'PYEOF'
import sys
from PIL import Image
path = sys.argv[1]
img = Image.open(path)
exif = img.getexif()
exif.pop(274, None)
img.save(path, "JPEG", quality=95, exif=exif.tobytes())
PYEOF
        _src="$tmp_jpeg"
    fi
}

compress_webp() {
    local src="$1" dst="$2"
    local lo=20 hi=95 mid size_kb best_q=75

    # Binary-search for the highest quality that stays <= TARGET_MAX_KB
    while (( lo <= hi )); do
        mid=$(( (lo + hi) / 2 ))
        ffmpeg -y -i "$src" -quality "$mid" "$dst" -loglevel error
        size_kb=$(du -k "$dst" | cut -f1)
        if (( size_kb <= TARGET_MAX_KB )); then
            best_q=$mid
            lo=$(( mid + 1 ))
        else
            hi=$(( mid - 1 ))
        fi
    done

    ffmpeg -y -i "$src" -quality "$best_q" "$dst" -loglevel error
    size_kb=$(du -k "$dst" | cut -f1)
    echo "  compressed → ${dst##*/}  (${size_kb} kB, quality=${best_q})"
    if (( size_kb < TARGET_MIN_KB )); then
        echo "  warning: file is below ${TARGET_MIN_KB} kB — image may be too small to compress further"
    fi
}

# ── main loop ─────────────────────────────────────────────────────────────────

[[ $# -eq 0 ]] && die "no files given\nusage: $(basename "$0") <file> [<file> ...]"

for arg in "$@"; do
    # Resolve path
    if [[ -f "$arg" ]]; then
        src="$arg"
    elif [[ -f "$DOWNLOADS/$arg" ]]; then
        src="$DOWNLOADS/$arg"
    else
        echo "skip: '$arg' not found in current dir or $DOWNLOADS" >&2
        continue
    fi

    echo
    echo "── $(basename "$src") ──"

    # Capture the date-bearing stem before maybe_convert_heic reassigns src to a temp file
    stem="$(basename "$src")"
    stem="${stem%.*}"

    tmp_jpeg=""
    maybe_convert_heic src
    # shellcheck disable=SC2064
    [[ -n "$tmp_jpeg" ]] && trap "rm -f '$tmp_jpeg'" EXIT

    # Extract date from filename stem if it is already YYYYMMDD
    if [[ "$stem" =~ ^[0-9]{8}$ ]]; then
        date_str="$stem"
        echo "  date: ${date_str} (from filename)"
    else
        while true; do
            read -rp "  date (YYYYMMDD): " date_str
            [[ "$date_str" =~ ^[0-9]{8}$ ]] && break
            echo "  must be 8 digits, e.g. 20260424"
        done
    fi

    # Get original dimensions
    read -r orig_w orig_h < <(
        ffprobe -v quiet -print_format json -show_streams "$src" 2>/dev/null \
        | python3 -c "
import json, sys
streams = json.load(sys.stdin)['streams']
v = next(s for s in streams if s['codec_type'] == 'video')
print(v['width'], v['height'])
"
    )
    echo "  original size: ${orig_w}×${orig_h}"

    date_iso="${date_str:0:4}-${date_str:4:2}-${date_str:6:2}"
    out_name="${date_str}.webp"
    compressed_out="$COMPRESSED_DIR/$out_name"
    thumb_out="$THUMBNAILS_DIR/$out_name"

    mkdir -p "$COMPRESSED_DIR" "$THUMBNAILS_DIR"

    # Compress
    compress_webp "$src" "$compressed_out"

    # Thumbnail (scale up so both dims are covered, then centre-crop)
    ffmpeg -y -i "$src" \
        -vf "scale=${THUMB_W}:${THUMB_H}:force_original_aspect_ratio=increase,crop=${THUMB_W}:${THUMB_H}" \
        -quality 85 "$thumb_out" -loglevel error
    echo "  thumbnail  → ${thumb_out##*/}  (${THUMB_W}×${THUMB_H})"

    # Upload to R2
    echo "  uploading ${out_name} …"
    npx --yes wrangler r2 object put "${R2_BUCKET}/${out_name}" \
        --file "$compressed_out" \
        --content-type "image/webp" \
        --remote

    echo "  uploading thumbnails/${out_name} …"
    npx --yes wrangler r2 object put "${R2_BUCKET}/thumbnails/${out_name}" \
        --file "$thumb_out" \
        --content-type "image/webp" \
        --remote

    # Generate MDX files
    for lang in en fr; do
        mdx="$CONTENT_DIR/$lang/${date_str}.mdx"
        cat > "$mdx" <<MDXEOF
---
src: "${CDN_BASE}/${out_name}"
alt: ""
date: ${date_iso}
width: ${orig_w}
height: ${orig_h}
---
MDXEOF
        echo "  created    → src/content/gallery/${lang}/${date_str}.mdx"
    done

    echo "  done ✓"
done

echo
echo "All done. Fill in the 'alt' fields in both MDX files before committing."
