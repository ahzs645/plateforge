"""Exact visual quarantine for non-BC comparison plates hosted in BC galleries.
This is a known-bad list, not certification that every unlisted file is genuine.
"""
from pathlib import Path
import json,re

def specimen_key(name):
    return re.sub(r'(?:\(xl\)\d?|xl)(?=\.jpg$)', '', Path(name).name.lower())

EXCLUSIONS=json.loads(Path(__file__).with_name('source-exclusions.json').read_text())
_KEYS={specimen_key(name) for name in EXCLUSIONS}
def is_excluded_source(name):
    """Thumbnail/XL duplicates describe one physical specimen and share quarantine."""
    return specimen_key(name) in _KEYS
