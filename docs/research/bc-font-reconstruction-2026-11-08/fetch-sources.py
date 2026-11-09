"""Fetch the credited original files and verify the recorded exact bytes.
Uses normal inherited curl networking. A changed remote file is rejected.
Existing verified originals are reused. Run from the repository root.
"""
import hashlib
import json
from pathlib import Path
import subprocess

study = Path('docs/research/bc-font-reconstruction-2026-11-08')
ledger = json.loads((study / 'sources.json').read_text())
for specimen in ledger['specimens']:
    destination = study / specimen['originalPath']
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and hashlib.sha256(destination.read_bytes()).hexdigest() == specimen['sha256']:
        print(specimen['id'] + ': existing original verified')
        continue
    temporary = destination.with_suffix('.download')
    try:
        subprocess.run(['curl', '--fail', '--silent', '--show-error', '--location', specimen['sourceUrl'], '--output', str(temporary)], check=True)
        assert hashlib.sha256(temporary.read_bytes()).hexdigest() == specimen['sha256'], 'Remote source changed: '+specimen['id']
        temporary.replace(destination)
    finally:
        temporary.unlink(missing_ok=True)
    print(specimen['id'] + ': fetched and verified')
