"""Package inspected browser captures; no photograph is stretched to fit lettering.

Run build-bc-visual-review.mjs first. Requires Pillow. All render pixels remain
lossless in the atlases. Full-size raw captures stay in typography-evidence/.
"""
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / "typography-evidence/bc-visual"
OUT = ROOT / "public/bc-visual-review"
OUT.mkdir(parents=True, exist_ok=True)
results = json.loads((WORK / "results.json").read_text())
cases = json.loads((ROOT / "docs/research/bc-visual-review/cases.json").read_text())
captures = {case["id"]: case for case in results["cases"]}
assert not results["errors"], results["errors"]
for case in cases:
    assert hashlib.sha256((ROOT / "public" / case["source"]).read_bytes()).hexdigest() == case["sourceStoredSha256"], case["id"]
    capture = captures[case["id"]]
    assert capture["format"] == case["format"] and capture["parts"] == case["parts"], case["id"]
    case["states"] = capture["states"]
    case["difference"] = capture["difference"]
    case["source"] = "../" + case["source"]
    if case.get("focus"):
        for state in case["states"].values():
            focus = case["focus"]["art"]
            matches = [art for art in state["art"] if art["art"] == focus or art["role"] == focus]
            assert len(matches) == 1, (case["id"], focus, matches)
            assert min(matches[0]["box"][2:]) > 0
            state["focusBox"] = matches[0]["box"]

# Twenty-one specimens per pair of atlases; fixed cells preserve native dimensions.
for start in range(0, len(cases), 21):
    group = cases[start:start + 21]
    for state in ("main", "current"):
        atlas = Image.new("RGB", (2700, 4200), "white")
        for i, case in enumerate(group):
            image = Image.open(WORK / state / (case["id"] + ".png")).convert("RGB")
            assert image.width <= 900 and image.height <= 600, (case["id"], image.size)
            x, y = (i % 3) * 900, (i // 3) * 600
            atlas.paste(image, (x, y))
            case.setdefault("images", {})[state] = {"file": f"{state}-{start // 21}.webp", "rect": [x, y, *image.size]}
        atlas.save(OUT / f"{state}-{start // 21}.webp", lossless=True, method=6)

audit = results["audit"]
assert len(audit) == 448, "Use a complete audit before publishing"
changed = [case for case in audit if case["difference"]["changedFraction"] > 0.001]
manifest = {
    "schema": results["schema"], "baseCommit": results["baseCommit"],
    "renderCommit": results["branchCommit"], "browser": results["browser"],
    "renderSourceSha256": results["renderSourceSha256"],
    "workingChanges": results["workingChanges"],
    "reviewedOn": "2026-10-19", "auditCount": len(audit),
    "changedCount": len(changed), "cases": cases,
    "audit": [{"format": case["format"], "difference": case["difference"]} for case in audit],
}
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps({"audit": len(audit), "changed": len(changed), "cases": len(cases)}))
