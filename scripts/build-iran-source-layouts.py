"""Regenerate flat source-role rectangles from the recorded specimen geometry audit."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'docs/research/iran-customizer/fonts/city-studies-geometry.json').read_text())
data={r['presetId']:{k:v['rectFraction'] for k,v in r['roles'].items()} for r in rows}
data.update(json.loads((root/'docs/research/iran-customizer/fonts/additional-layouts.json').read_text())['rectangles'])
(root/'src/templates/iran-source-layouts.ts').write_text('/** Flat role rectangles measured from inspected city-family specimens; proportions, not certified physical dimensions. */\nexport const IRAN_SOURCE_ROLE_RECTS:Record<string,Record<string,{x:number;y:number;width:number;height:number}>>='+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
