#!/usr/bin/env python3
"""parse-catalog.py — Extract layout schemas from layout-catalog.md as JSON.

Usage:
    python3 parse-catalog.py path/to/layout-catalog.md [layout-name]

If layout-name is given, prints the parsed schema for just that layout.
If omitted, prints a JSON object keyed by layout name.

The output contains:
    - layout_name -> {
        frontmatter_layout: str,
        frontmatter_class: str | None,
        fields: [ { name, type, required, maxLength, note } ],
        allow_classes: [str]  # content-pattern classes for two-columns
      }

This parser is intentionally lenient: it finds `## <name>` headings and
inside each section extracts the Slidev frontmatter block and the
**Fields schema** bullet list using simple regex. It does NOT re-implement
Markdown parsing for the template section.
"""
import json
import re
import sys
from pathlib import Path

KNOWN_LAYOUTS = {
    "cover", "agenda", "section-divider", "content-bullets",
    "content-narrative", "two-columns", "three-metrics", "data-table",
    "timeline-horizontal", "code-focus", "diagram-primary",
    "image-focus", "image-text-split", "big-statement", "closing",
}

# Expected class value per layout (spec §6.3). None means no `class:` required.
EXPECTED_CLASS = {
    "cover": None,
    "agenda": "agenda",
    "section-divider": None,
    "content-bullets": "content-bullets",
    "content-narrative": "content-narrative",
    "two-columns": "two-columns",
    "three-metrics": "three-metrics",
    "data-table": "data-table",
    "timeline-horizontal": "timeline-horizontal",
    "code-focus": "code-focus",
    "diagram-primary": "diagram-primary",
    "image-focus": "image-focus",
    "image-text-split": "image-text-split",
    "big-statement": "big-statement",
    "closing": None,
}

# Expected Slidev built-in layout per semantic layout (spec §6.3)
EXPECTED_LAYOUT = {
    "cover": "cover",
    "agenda": "default",
    "section-divider": "section",
    "content-bullets": "default",
    "content-narrative": "default",
    "two-columns": "two-cols-header",
    "three-metrics": "default",
    "data-table": "default",
    "timeline-horizontal": "default",
    "code-focus": "default",
    "diagram-primary": "default",
    "image-focus": "image",
    "image-text-split": "image-left",  # or image-right
    "big-statement": "center",
    "closing": "end",
}

# Valid pattern names for two-columns' left/right
TWO_COLUMNS_PATTERNS = {"text", "bullets", "code", "image", "table", "metric"}

# Required fields per pattern
PATTERN_REQUIRED = {
    "text":    ["content"],
    "bullets": ["items"],
    "code":    ["language", "code"],
    "image":   ["image_path", "alt_text"],
    "table":   ["columns", "rows"],
    "metric":  ["value", "caption"],
}

# maxLength per pattern field (used for WARN)
PATTERN_MAXLEN = {
    "text":    {"content": 250},
    "bullets": {"items_each": 70},
    "code":    {"code_lines_max": 8},
    "image":   {"alt_text": 120, "caption": 40},
    "table":   {"rows_max": 6, "cell": 20},
    "metric":  {"value": 12, "unit": 10, "caption": 30},
}

FIELD_LINE_RE = re.compile(
    r"^- `([A-Za-z_]+)`:\s*(.+?)(?:,\s*(required|optional))?(?:,\s*maxLength\s*(\d+))?(?:\s*—\s*(.*))?$"
)


def parse_file(path: Path):
    text = path.read_text(encoding="utf-8")
    sections = {}
    cur = None
    cur_lines = []
    for line in text.splitlines():
        m = re.match(r"^## ([a-z-]+)$", line)
        if m and m.group(1) in KNOWN_LAYOUTS:
            if cur:
                sections[cur] = "\n".join(cur_lines)
            cur = m.group(1)
            cur_lines = []
        elif cur is not None:
            cur_lines.append(line)
    if cur:
        sections[cur] = "\n".join(cur_lines)

    schemas = {}
    for name, body in sections.items():
        schemas[name] = {
            "frontmatter_layout": EXPECTED_LAYOUT.get(name),
            "frontmatter_class": EXPECTED_CLASS.get(name),
            "fields": extract_fields(body),
        }
    schemas["_meta"] = {
        "two_columns_patterns": sorted(TWO_COLUMNS_PATTERNS),
        "pattern_required": PATTERN_REQUIRED,
        "pattern_maxlen": PATTERN_MAXLEN,
        "expected_class": EXPECTED_CLASS,
        "expected_layout": EXPECTED_LAYOUT,
    }
    return schemas


def extract_fields(body: str):
    """Find the **Fields schema** sub-section and parse bullet lines."""
    fields = []
    in_fields = False
    for line in body.splitlines():
        if re.match(r"^\*\*Fields schema\*\*", line):
            in_fields = True
            continue
        if in_fields:
            if line.startswith("**") or line.startswith("## "):
                break
            m = FIELD_LINE_RE.match(line.rstrip())
            if m:
                name, type_, req, maxlen, note = m.groups()
                fields.append({
                    "name": name,
                    "type": type_.strip().strip(","),
                    "required": (req == "required"),
                    "maxLength": int(maxlen) if maxlen else None,
                    "note": (note or "").strip(),
                })
    return fields


def main():
    if len(sys.argv) < 2:
        print("Usage: parse-catalog.py <layout-catalog.md> [layout-name]", file=sys.stderr)
        sys.exit(2)
    schemas = parse_file(Path(sys.argv[1]))
    if len(sys.argv) >= 3:
        name = sys.argv[2]
        if name not in schemas:
            print(f"Unknown layout: {name}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(schemas[name], indent=2, ensure_ascii=False))
    else:
        print(json.dumps(schemas, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
