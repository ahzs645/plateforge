#!/usr/bin/env bash
# Download the BCpl8s 1940–54 passenger photos used as references into .cache/ (never committed).
# Polite: one request at a time with a short pause; files already cached are skipped.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .cache/plates .cache/ref
UA="PlateForge die research (https://github.com/ahzs645/plateforge)"
# Thumbnails plus the full-size "(XL)" photos the gallery links to; the extractors prefer the largest copy.
fetch_page() {  # page, filename pattern, cache dir
  mkdir -p "$3"
  curl -fsS -A "$UA" "https://www.bcpl8s.ca/Passenger-$1.html" \
    | grep -oE "images/Passenger/$1/$2(\(XL\)[0-9]?|XL)?\.jpg" | sort -u > ".cache/$1.txt"
  while read -r path; do
    f="$3/$(basename "$path")"
    [ -s "$f" ] || { curl -fsS -A "$UA" -o "$f" "https://www.bcpl8s.ca/$path"; sleep 0.3; }
  done < ".cache/$1.txt"
}
for page in 1940-1948 1949-1951 1952-1954; do fetch_page "$page" '19[45][0-9]-[0-9A-Z]+' .cache/plates; done
fetch_page 1915-1917 '191[567]-[0-9]+' .cache/tin
# Loose strips, the high-resolution 217·639 and loose tabs for the strip and tab dies.
for path in "1949-1951/1951-Tab(long).jpg" "1949-1951/1951-Tab(short).jpg" "1949-1951/1951Strip.jpg" "1949-1951/1951-217639.jpg" \
  1952-1954/1953-Tab.jpg 1952-1954/1953-148879.jpg 1952-1954/1953-349016.jpg 1952-1954/1953-217791.jpg \
  1952-1954/1954-Tab.jpg 1952-1954/1954-306142.jpg 1952-1954/1954-351154.jpg 1952-1954/1954-351016.jpg; do
  f=".cache/ref/$(basename "$path")"
  [ -s "$f" ] || { curl -fsS -A "$UA" -o "$f" "https://www.bcpl8s.ca/images/Passenger/$path"; sleep 0.3; }
done
echo "cached $(ls .cache/plates | wc -l) 1940–54 photos, $(ls .cache/tin | wc -l) 1915–17 photos and $(ls .cache/ref | wc -l) strip/tab photos"
