#!/usr/bin/env python3
"""Rebuild the Grace McCarthy card study, its font model, and portable SVGs.

Requirements: Python 3, Pillow, numpy, fontTools, and the system HarfBuzz library.
No network access or package installation is performed by this script.

The first import accepts --font-source DIRECTORY (the seven Google Fonts study
directories plus font-manifest.json). Later rebuilds reuse the exact font bytes
embedded in model.json; that is their canonical committed copy, avoiding seven
duplicated TTF binaries. --extra-font-directory imports a new font with OFL.txt
and optional provenance.json. --layout accepts a saved editor layout, and
--default-font selects the global face. All lettering scales uniformly; target
widths are evidence, never a textLength/anisotropic fitting instruction.
"""

from __future__ import annotations

import argparse
import base64
import copy
import ctypes
import ctypes.util
import hashlib
import io
import json
import re
import shutil
import unicodedata
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

import numpy as np
from PIL import Image
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs/research/grace-mccarthy-card"
PUBLIC = ROOT / "public/stationery/grace-mccarthy"
MODEL = PUBLIC / "model.json"
SOURCE_ID = "user-upload-grace-mccarthy-card-2026-11-12"
FONT_IDS = ["pinyonscript", "imperialscript", "luxuriousscript", "meaculpa",
            "herrvonmuellerhoff", "monsieurladoulaise", "italianno"]
SOURCE_TEXT = {
    "name": "Grace M. McCarthy",
    "deputy": "Deputy Premier",
    "secretary": "Provincial Secretary",
    "minister": "Minister of Recreation & Travel Industry",
    "telephone": "Telephone 387-6601",
    "city": "Victoria",
    "province": "British Columbia",
}


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def write_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(path)


def number(value: float) -> str:
    # Stable, sufficiently precise geometry while keeping normalized runs small.
    return f"{value:.7f}".rstrip("0").rstrip(".") or "0"


class GlyphInfo(ctypes.Structure):
    _fields_ = [("codepoint", ctypes.c_uint32), ("mask", ctypes.c_uint32),
                ("cluster", ctypes.c_uint32), ("var1", ctypes.c_uint32),
                ("var2", ctypes.c_uint32)]


class GlyphPosition(ctypes.Structure):
    _fields_ = [("x_advance", ctypes.c_int32), ("y_advance", ctypes.c_int32),
                ("x_offset", ctypes.c_int32), ("y_offset", ctypes.c_int32),
                ("var", ctypes.c_uint32)]


class HarfBuzz:
    """Small typed ctypes binding: shape a complete run with default OT features."""

    def __init__(self) -> None:
        name = ctypes.util.find_library("harfbuzz")
        if not name:
            raise RuntimeError("A system HarfBuzz library is required for shaped outlines")
        self.lib = ctypes.CDLL(name)
        signatures = {
            "hb_blob_create": (ctypes.c_void_p, [ctypes.c_void_p, ctypes.c_uint,
                ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p]),
            "hb_blob_destroy": (None, [ctypes.c_void_p]),
            "hb_face_create": (ctypes.c_void_p, [ctypes.c_void_p, ctypes.c_uint]),
            "hb_face_destroy": (None, [ctypes.c_void_p]),
            "hb_font_create": (ctypes.c_void_p, [ctypes.c_void_p]),
            "hb_font_destroy": (None, [ctypes.c_void_p]),
            "hb_ot_font_set_funcs": (None, [ctypes.c_void_p]),
            "hb_font_set_scale": (None, [ctypes.c_void_p, ctypes.c_int, ctypes.c_int]),
            "hb_buffer_create": (ctypes.c_void_p, []),
            "hb_buffer_destroy": (None, [ctypes.c_void_p]),
            "hb_buffer_add_utf8": (None, [ctypes.c_void_p, ctypes.c_char_p,
                ctypes.c_int, ctypes.c_uint, ctypes.c_int]),
            "hb_buffer_guess_segment_properties": (None, [ctypes.c_void_p]),
            "hb_shape": (None, [ctypes.c_void_p, ctypes.c_void_p,
                ctypes.c_void_p, ctypes.c_uint]),
            "hb_buffer_get_glyph_infos": (ctypes.POINTER(GlyphInfo),
                [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint)]),
            "hb_buffer_get_glyph_positions": (ctypes.POINTER(GlyphPosition),
                [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint)]),
            "hb_version_string": (ctypes.c_char_p, []),
        }
        for function, (result, arguments) in signatures.items():
            entry = getattr(self.lib, function)
            entry.restype, entry.argtypes = result, arguments
        self.version = self.lib.hb_version_string().decode("ascii")

    def shape(self, font_bytes: bytes, upem: int, text: str) -> list[dict]:
        hb = self.lib
        data = ctypes.create_string_buffer(font_bytes)
        blob = hb.hb_blob_create(data, len(font_bytes), 0, None, None)
        face = hb.hb_face_create(blob, 0)
        font = hb.hb_font_create(face)
        buffer = hb.hb_buffer_create()
        try:
            hb.hb_ot_font_set_funcs(font)
            hb.hb_font_set_scale(font, upem, upem)
            encoded = text.encode("utf-8")
            hb.hb_buffer_add_utf8(buffer, encoded, len(encoded), 0, len(encoded))
            hb.hb_buffer_guess_segment_properties(buffer)
            hb.hb_shape(font, buffer, None, 0)
            length = ctypes.c_uint()
            infos = hb.hb_buffer_get_glyph_infos(buffer, ctypes.byref(length))
            positions = hb.hb_buffer_get_glyph_positions(buffer, ctypes.byref(length))
            result = []
            for index in range(length.value):
                info, pos = infos[index], positions[index]
                if info.codepoint == 0:
                    raise ValueError(f"Unsupported glyph while shaping {text!r}")
                result.append({"glyph": int(info.codepoint), "cluster": int(info.cluster),
                    "xAdvance": int(pos.x_advance), "yAdvance": int(pos.y_advance),
                    "xOffset": int(pos.x_offset), "yOffset": int(pos.y_offset)})
            return result
        finally:
            hb.hb_buffer_destroy(buffer)
            hb.hb_font_destroy(font)
            hb.hb_face_destroy(face)
            hb.hb_blob_destroy(blob)


def shaped_outline(hb: HarfBuzz, font: TTFont, raw: bytes, text: str) -> dict:
    glyphs = font.getGlyphSet()
    glyph_order = font.getGlyphOrder()
    upem = font["head"].unitsPerEm
    instructions = hb.shape(raw, upem, text)
    path_pen = SVGPathPen(glyphs, ntos=number)
    bounds_pen = BoundsPen(glyphs)
    x = y = 0
    for step in instructions:
        transform = (1 / upem, 0, 0, -1 / upem,
            (x + step["xOffset"]) / upem, -(y + step["yOffset"]) / upem)
        glyph = glyphs[glyph_order[step["glyph"]]]
        glyph.draw(TransformPen(path_pen, transform))
        glyph.draw(TransformPen(bounds_pen, transform))
        x += step["xAdvance"]
        y += step["yAdvance"]
    return {"path": path_pen.getCommands(),
        "bounds": [round(v, 7) for v in (bounds_pen.bounds or (0, 0, 0, 0))],
        "advance": round(x / upem, 7), "glyphCount": len(instructions),
        "shaping": "HarfBuzz default OpenType features, Latin LTR, em=1, SVG y down"}


def import_font(directory: Path, info: dict | None = None) -> dict:
    fonts = sorted(directory.glob("*.ttf"))
    if len(fonts) != 1:
        raise ValueError(f"Expected exactly one TTF in {directory}")
    raw = fonts[0].read_bytes()
    font = TTFont(io.BytesIO(raw))
    source = copy.deepcopy(info or {})
    provenance_path = directory / "provenance.json"
    if provenance_path.exists():
        source.update(json.loads(provenance_path.read_text()))
    # The desktop and embedded font use their actual internal preferred name.
    family = font["name"].getDebugName(16) or font["name"].getDebugName(1)
    license_path = directory / "OFL.txt"
    if not license_path.exists():
        raise ValueError(f"Missing complete redistribution license: {license_path}")
    result = {
        "id": source.get("id", directory.name), "family": family,
        "styleName": source.get("styleName", source.get("style_name",
            font["name"].getDebugName(17) or font["name"].getDebugName(2) or "Regular")),
        "style": "normal", "weight": 400, "format": "truetype",
        "filename": fonts[0].name, "ttfBase64": base64.b64encode(raw).decode("ascii"),
        "license": license_path.read_text(), "licenseId": "OFL-1.1",
        "sourceUrl": source.get("source_url", source.get("sourceUrl", "")),
        "sha256": digest(raw),
        "copyright": font["name"].getDebugName(0) or source.get("copyright", ""),
        "version": font["name"].getDebugName(5),
        "matchStatus": source.get("matchStatus", "experimental-candidate"),
        "matchNote": source.get("matchNote", "Candidate lettering; not an authenticated historical typeface match."),
    }
    # Keep provenance but strip temporary workspace paths and duplicate licenses.
    result["provenance"] = {key: value for key, value in source.items()
        if key not in {"path", "license", "sha256", "copyright", "version", "family"}}
    return result


def model_fonts(font_source: Path | None, extra: list[Path], previous: dict) -> list[dict]:
    collected = {entry["id"]: copy.deepcopy(entry) for entry in previous.get("fonts", [])}
    if font_source:
        manifest_file = font_source / "font-manifest.json"
        manifest = json.loads(manifest_file.read_text()) if manifest_file.exists() else []
        for font_id in FONT_IDS:
            directory = font_source / font_id
            info = next((entry for entry in manifest
                if Path(entry.get("path", "")).parent.name == font_id), {})
            entry = import_font(directory, info)
            collected[entry["id"]] = entry
    for directory in extra:
        entry = import_font(directory)
        collected[entry["id"]] = entry
    if not collected:
        raise ValueError("Supply --font-source for the first build; no embedded fonts found")
    for font_id in FONT_IDS:
        if font_id not in collected:
            raise ValueError(f"Missing comparison font {font_id}")
    ordered = FONT_IDS + sorted(key for key in collected if key not in FONT_IDS)
    return [collected[font_id] for font_id in ordered]


def make_lines(geometry: dict, previous: dict, layout: dict) -> list[dict]:
    tuned = {entry["id"]: entry for entry in previous.get("lines", [])}
    tuned.update({entry["id"]: entry for entry in layout.get("lines", [])})
    lines = []
    for source_line in geometry["lines"]:
        line_id = source_line["id"]
        x0, y0, x1, y1 = source_line["rectified_ink_bbox_xyxy"]
        line = {"id": line_id, "sourceId": SOURCE_ID,
            "text": SOURCE_TEXT[line_id], "color": "#171716",
            "x": (x0 + x1) / 2, "y": (y0 + y1) / 2,
            "capHeight": 96 if line_id == "name" else 62,
            "sourceBounds": [x0, y0, x1, y1],
            "sourceImageBounds": source_line["source_ink_bbox_xyxy"],
            "sourceText": SOURCE_TEXT[line_id]}
        # Only editable layout fields survive. Evidence cannot be replaced by tuning.
        for field in ["text", "color", "x", "y", "capHeight", "fontId"]:
            if field in tuned.get(line_id, {}):
                line[field] = tuned[line_id][field]
        if not isinstance(line["text"], str) or len(line["text"]) > 500:
            raise ValueError(f"Invalid text for {line_id}")
        for field in ["x", "y", "capHeight"]:
            if not isinstance(line[field], (int, float)) or not np.isfinite(line[field]):
                raise ValueError(f"Invalid {field} for {line_id}")
        if not 1 <= line["capHeight"] <= 500:
            raise ValueError(f"Invalid capHeight for {line_id}")
        lines.append(line)
    return lines


def rectify(source: Path, geometry: dict, output: Path) -> None:
    config = geometry["rectification"]
    image = Image.open(source).convert("RGB")
    expected = geometry["source_sha256"]
    if digest(source.read_bytes()) != expected:
        raise ValueError("Source image hash does not match the measured geometry")
    corrected = image.transform(tuple(config["size_px"]), Image.Transform.PERSPECTIVE,
        config["pillow_inverse_coefficients"], Image.Resampling.BICUBIC, fillcolor="white")
    corrected.save(output, optimize=True)


def outline_placement(line: dict, face: dict) -> tuple[float, float, float]:
    bounds = face["runs"][line["id"]]["bounds"]
    scale = line["capHeight"] / face["capHeightEm"]
    x = line["x"] - scale * (bounds[0] + bounds[2]) / 2
    y = line["y"] - scale * (bounds[1] + bounds[3]) / 2
    return x, y, scale


def card_svg(model: dict, face: dict, editable: bool) -> str:
    board = model["artboard"]
    faces = {entry["id"]: entry for entry in model["fonts"]}
    used_ids = list(dict.fromkeys(line.get("fontId") or face["id"] for line in model["lines"]))
    metadata = {"sourceId": SOURCE_ID,
        "fonts": [{"id": fid, "family": faces[fid]["family"],
            "sha256": faces[fid]["sha256"], "license": faces[fid]["license"],
            "sourceUrl": faces[fid]["sourceUrl"], "matchStatus": faces[fid]["matchStatus"]}
            for fid in used_ids],
        "crestStatus": model["crest"]["accuracy"],
        "note": "Research reconstruction. Supplied arms are a different engraving; font match and original physical dimensions are unverified."}
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{board["width"]}" height="{board["height"]}" viewBox="0 0 {board["width"]} {board["height"]}">',
        '<title>Grace M. McCarthy — calling-card reconstruction</title>',
        '<desc>Editable text and supplied BC coat of arms. Research reconstruction with candidate lettering; not authenticated historical artwork.</desc>',
        '<metadata>' + escape(json.dumps(metadata, ensure_ascii=False)) + '</metadata>',
        f'<rect width="{board["width"]}" height="{board["height"]}" fill={quoteattr(board["paper"])}/>']
    if editable:
        font_css = []
        for fid in used_ids:
            alias = "CardEmbedded-" + hashlib.sha256(fid.encode()).hexdigest()[:16]
            font_css.append('@font-face{font-family:"' + alias
                + '";font-style:normal;font-weight:400;src:url("data:font/ttf;base64,'
                + faces[fid]["ttfBase64"] + '") format("truetype");}')
        parts.append('<style>' + ''.join(font_css) + '</style>')
    crest = model["crest"]
    x0, y0, x1, y1 = crest["bounds"]
    scale = crest["height"] / (y1 - y0)
    tx = crest["x"] - (x0 + x1) / 2 * scale
    ty = crest["y"] - (y0 + y1) / 2 * scale
    parts.append(f'<g id="coat-of-arms" data-accuracy="supplied-substitute" transform="translate({number(tx)} {number(ty)}) scale({number(scale)})" fill={quoteattr(crest["color"])}><path fill-rule="evenodd" d={quoteattr(crest["path"])}/></g>')
    for line in model["lines"]:
        line_face = faces[line.get("fontId") or face["id"]]
        tx, ty, scale = outline_placement(line, line_face)
        label = escape(line["text"])
        common = f'id={quoteattr(line["id"])} fill={quoteattr(line["color"])} data-source-id={quoteattr(SOURCE_ID)}'
        if editable:
            alias = "CardEmbedded-" + hashlib.sha256(line_face["id"].encode()).hexdigest()[:16]
            family_stack = json.dumps(alias) + ', ' + json.dumps(line_face["family"])
            parts.append(f'<text {common} x="{number(tx)}" y="{number(ty)}" font-family={quoteattr(family_stack)} font-size="{number(scale)}" font-weight="400" font-style="normal" xml:space="preserve">{label}</text>')
        else:
            parts.append(f'<g {common} aria-label={quoteattr(line["text"])} transform="translate({number(tx)} {number(ty)}) scale({number(scale)})"><title>{label}</title><path d={quoteattr(line_face["runs"][line["id"]]["path"])}/></g>')
    parts.append('</svg>')
    return '\n'.join(parts) + '\n'


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-image", type=Path)
    parser.add_argument("--arms-fragment", type=Path)
    parser.add_argument("--geometry", type=Path)
    parser.add_argument("--font-source", type=Path)
    parser.add_argument("--extra-font-directory", action="append", type=Path, default=[])
    parser.add_argument("--default-font")
    parser.add_argument("--layout", type=Path)
    parser.add_argument("--model-only", action="store_true")
    args = parser.parse_args()
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    source = EVIDENCE / "source-card.png"
    fragment = EVIDENCE / "supplied-arms-fragment.txt"
    geometry_file = EVIDENCE / "geometry.json"
    for incoming, target in [(args.source_image, source), (args.arms_fragment, fragment),
                             (args.geometry, geometry_file)]:
        if incoming and incoming.resolve() != target.resolve():
            shutil.copyfile(incoming, target)
    geometry = json.loads(geometry_file.read_text())
    previous = json.loads(MODEL.read_text()) if MODEL.exists() else {}
    layout = json.loads(args.layout.read_text()) if args.layout else {}
    lines = make_lines(geometry, previous, layout)
    fonts = model_fonts(args.font_source, args.extra_font_directory, previous)
    hb = HarfBuzz()
    for face in fonts:
        raw = base64.b64decode(face["ttfBase64"], validate=True)
        if digest(raw) != face["sha256"]:
            raise ValueError(f"Embedded font hash mismatch: {face['id']}")
        font = TTFont(io.BytesIO(raw))
        upem = font["head"].unitsPerEm
        face.setdefault("styleName", font["name"].getDebugName(17)
            or font["name"].getDebugName(2) or "Regular")
        cap_height = getattr(font["OS/2"], "sCapHeight", 0)
        if not cap_height:
            pen = BoundsPen(font.getGlyphSet())
            font.getGlyphSet()[font.getBestCmap()[ord("H")]].draw(pen)
            cap_height = pen.bounds[3] - pen.bounds[1]
        face["unitsPerEm"] = upem
        face["capHeightEm"] = round(cap_height / upem, 7)
        face["supportedCodepoints"] = sorted(font.getBestCmap())
        face["coverage"] = ''.join(chr(codepoint) for codepoint in face["supportedCodepoints"]
            if not unicodedata.category(chr(codepoint)).startswith("C"))
        face["runs"] = {line["id"]: shaped_outline(hb, font, raw, line["text"])
                        for line in lines}
    pasted = fragment.read_text()
    match = re.search(r'\bd="([^"]+)"', pasted)
    if not match:
        raise ValueError("No supplied SVG path found")
    path = match.group(1)  # Exact original compound path, without simplification.
    bounds_pen = BoundsPen(None)
    parse_path(path, bounds_pen)
    crest_bounds = geometry["crest"]["rectified_ink_bbox_xyxy_approx"]
    x0, y0, x1, y1 = crest_bounds
    crest = {"path": path, "bounds": list(bounds_pen.bounds),
        "sourceId": SOURCE_ID, "sourceBounds": crest_bounds,
        "x": (x0 + x1) / 2, "y": (y0 + y1) / 2, "height": y1 - y0,
        "color": "#807953", "fillRule": "evenodd", "accuracy": "supplied-substitute",
        "pathSha256": digest(path.encode()), "fragmentSha256": digest(fragment.read_bytes()),
        "note": geometry["crest"]["comparison"]}
    for tune in [previous.get("crest", {}), layout.get("crest", {})]:
        for key in ["x", "y", "height", "color"]:
            if key in tune:
                crest[key] = tune[key]
    default_font = (args.default_font or layout.get("defaultFontId")
                    or previous.get("defaultFontId") or "pinyonscript")
    if default_font not in {face["id"] for face in fonts}:
        raise ValueError(f"Unknown default font {default_font}")
    for line in lines:
        if line.get("fontId") and line["fontId"] not in {face["id"] for face in fonts}:
            raise ValueError(f"Unknown per-line font {line['fontId']} in {line['id']}")
    model = {"schemaVersion": 1, "sourceId": SOURCE_ID,
        "observedChars": geometry["typography"]["characters_observed"],
        "artboard": {"width": 1800, "height": 1038, "paper": "#ffffff",
            "physicalSize": None, "note": "Measured photograph proportions; physical card size is unverified."},
        "source": {"id": SOURCE_ID, "filename": "source-card.png",
            "originalFilename": geometry["source_filename"],
            "sha256": geometry["source_sha256"], "referenceImage": "reference.png",
            "geometryRepositoryPath": "docs/research/grace-mccarthy-card/geometry.json",
            "cornerConfidence": geometry["corner_confidence"],
            "historicalDate": None, "dateNote": "Upload date is not a manufacture or issue date."},
        "crest": crest, "lines": lines, "fonts": fonts,
        "defaultFontId": default_font,
        "shaper": {"name": "HarfBuzz", "version": hb.version},
        "limitations": ["Historical typeface identification is unverified; all bundled faces are comparison candidates.",
            "The supplied coat of arms is a different engraving and is placed without changing its proportions.",
            "The photograph does not establish a physical print size, exact original ink colour, or printed border.",
            "Unobserved glyphs in any derivative study are inherited or constructed, not source-verified."],
    }
    model["artboard"]["paper"] = layout.get("artboard", {}).get("paper", previous.get("artboard", {}).get("paper", "#ffffff"))
    write_json(MODEL, model)
    rectify(source, geometry, PUBLIC / "reference.png")
    if not args.model_only:
        face = next(face for face in fonts if face["id"] == default_font)
        (PUBLIC / "card-outlined.svg").write_text(card_svg(model, face, False))
        (PUBLIC / "card-editable.svg").write_text(card_svg(model, face, True))
    print(json.dumps({"model": str(MODEL.relative_to(ROOT)), "fonts": len(fonts),
        "lines": len(lines), "defaultFont": default_font,
        "modelBytes": MODEL.stat().st_size, "harfbuzz": hb.version,
        "sourceSha256": model["source"]["sha256"], "crestPathSha256": crest["pathSha256"]}))


if __name__ == "__main__":
    main()
