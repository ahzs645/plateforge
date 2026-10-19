"""Bundle the committed B.C. report into one portable HTML file (standard library)."""
import base64
import json
import mimetypes
from pathlib import Path

root = Path(__file__).resolve().parents[1]
report = root / "public/bc-visual-review"
manifest = json.loads((report / "manifest.json").read_text())
paths = {case["source"] for case in manifest["cases"]}
for case in manifest["cases"]:
    paths.update(image["file"] for image in case["images"].values())
images = {}
for relative in sorted(paths):
    path = (report / relative).resolve()
    assert path.is_relative_to(root / "public"), relative
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    images[relative] = f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()

def script_data(value):
    return json.dumps(value, separators=(",", ":")).replace("<", "\\u003c")

html = (report / "index.html").read_text()
html = html.replace('<link rel="stylesheet" href="review.css">', "<style>" + (report / "review.css").read_text() + "</style>")
html = html.replace('<script src="review.js" type="module"></script>', "")
script = (report / "review.js").read_text()
assert "</script" not in script.lower()
html = html.replace("</body>", '<script id="evidence-ledger" type="application/json">' + script_data(manifest)
                    + '</script><script id="evidence-images" type="application/json">' + script_data(images)
                    + '</script><script type="module">' + script + '</script></body>')
html = html.replace('href="../"', 'href="https://projects.ahmadjalil.com/plateforge/"')
html = html.replace('href="manifest.json"', 'href="#metadata"')
output = root / "typography-evidence/bc-visual/offline.html"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html)
print(f"{output}: {len(manifest['cases'])} specimens, {len(images)} embedded images, {output.stat().st_size} bytes")
