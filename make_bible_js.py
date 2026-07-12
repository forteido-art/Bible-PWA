import json, re, sys

KJV = {}
current_book = None
current_ch = None

# Read from stdin or kjv.txt
for line in sys.stdin:
    line = line.strip()
    if not line: continue

    # Match "Genesis 1:1 In the beginning..."
    m = re.match(r'^([\d\w\s]+?)\s+(\d+):(\d+)\s+(.+)$', line)
    if not m: continue

    book, ch, v, text = m.groups()
    ch, v = int(ch), int(v)

    if book not in KJV: KJV[book] = {}
    if ch not in KJV[book]: KJV[book][ch] = {}
    KJV[book][ch][v] = text

# Output as JS
print('window.KJV = ', end='')
print(json.dumps(KJV, ensure_ascii=False, separators=(',', ':')))
print(';')
