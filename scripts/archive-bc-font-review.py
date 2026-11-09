#!/usr/bin/env python3
"""Preserve the recovered Nov 7 report, with exact embedded figures externalized.

The standalone report is evidence of the earlier work, not its missing source
checkout. This importer verifies an exact round trip before adding an archive
notice. It never derives new geometry or re-labels historical validation.
"""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PATTERN = re.compile(r'src="data:(image/(?:png|jpeg|webp|svg\+xml));base64,([A-Za-z0-9+/=\s]+)"')
SUFFIX = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg"}
NOTICE = '''<aside style="margin:0;padding:20px 24px;background:#fff3cd;color:#342a10;border-bottom:2px solid #d4a847;font:16px/1.5 system-ui,sans-serif"><strong>Archived review — 7 November 2026.</strong> This is the recovered standalone report and its original figures. Its validation and publication statements describe that earlier capture. The source commits named below were unavailable during the current recovery; the new implementation has its own validation. <a href="../bc-font-reconstruction/">Open the current reconstruction review</a> · <a href="../bc-font-audit/">Open the current case queue</a></aside>'''

def digest(data):
    return hashlib.sha256(data).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path, nargs="?")
    parser.add_argument("--output", type=Path, default=ROOT / "public/bc-font-reconstruction-archive")
    parser.add_argument("--check", action="store_true", help="Verify the archived assets and reconstruct the original report hash")
    args = parser.parse_args()
    output = args.output.resolve()
    if args.check:
        manifest = json.loads((output / "manifest.json").read_text())
        archived = (output / "index.html").read_text()
        if archived.count(NOTICE) != 1:
            raise RuntimeError("The archive notice changed or is missing")
        original_tags = {}
        for asset in manifest["assets"]:
            data = (output / asset["path"]).read_bytes()
            if digest(data) != asset["sha256"] or len(data) != asset["bytes"]:
                raise RuntimeError("Archived figure changed: " + asset["path"])
            original_tags[asset["path"]] = f'src="data:{asset["mimeType"]};base64,{base64.b64encode(data).decode()}"'
        recovered = re.sub(r'src="(assets/[^"]+)"', lambda m: original_tags[m.group(1)], archived.replace(NOTICE, "", 1)).encode()
        if digest(recovered) != manifest["originalSha256"] or len(recovered) != manifest["originalBytes"]:
            raise RuntimeError("The archived report no longer matches the recovered original")
        print(json.dumps({"originalSha256": digest(recovered), "figures": len(manifest["assets"]), "verified": True}))
        return
    if args.report is None:
        parser.error("Provide the recovered standalone report, or use --check")
    original = args.report.read_bytes()
    source = original.decode("utf-8")
    (output / "assets").mkdir(parents=True, exist_ok=True)
    assets = []
    originals = {}
    def extract(match):
        mime, encoded = match.groups()
        data = base64.b64decode(encoded, validate=True)
        name = f"assets/{digest(data)}.{SUFFIX[mime]}"
        (output / name).write_bytes(data)
        originals[name] = match.group(0)
        assets.append({"occurrence": len(assets) + 1, "path": name, "mimeType": mime, "bytes": len(data), "sha256": digest(data)})
        return f'src="{name}"'
    archived = PATTERN.sub(extract, source)
    restored = re.sub(r'src="(assets/[^"]+)"', lambda m: originals[m.group(1)], archived)
    if restored.encode("utf-8") != original:
        raise RuntimeError("The archived figures do not reconstruct the original report exactly")
    if not assets:
        raise RuntimeError("No embedded figures found")
    archived, count = re.subn(r"(<body[^>]*>)", lambda m: m.group(1) + NOTICE, archived, count=1)
    if count != 1:
        raise RuntimeError("Report has no body")
    (output / "index.html").write_text(archived)
    manifest = {
        "schema": "plateforge.recovered-font-report/v1",
        "originalFilename": args.report.name,
        "originalSha256": digest(original),
        "originalBytes": len(original),
        "roundTripVerifiedBeforeArchiveNotice": True,
        "sourceCommitAvailability": "93a100a and f34cbab were not available in the repository, local recovery files or searched saved archives.",
        "scope": "Original historical report text and figures preserved without changing their claims. The archive notice distinguishes them from current validation.",
        "assets": assets,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"originalSha256": manifest["originalSha256"], "figures": len(assets), "uniqueAssets": len(originals), "roundTrip": True}))

if __name__ == "__main__":
    main()
