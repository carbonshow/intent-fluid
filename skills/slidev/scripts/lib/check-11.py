#!/usr/bin/env python3
# check-11.py — SP2 image prompt validation.
# Invoked by validate-slides.sh. Prints FAIL: / WARN: / OK: lines.
# Exit 0 always; caller tallies FAILs.

import re
import sys
from pathlib import Path


def parse_deck_frontmatter_end(lines):
    if not lines or lines[0].strip() != '---':
        return 0
    for i in range(1, len(lines)):
        if lines[i].strip() == '---':
            return i + 1
    return 0


def parse_simple_fm(lines):
    """Very small YAML subset: key: value; nested key:\\n  sub: value; folded key: > block."""
    fm = {}
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        m = re.match(r'^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$', line)
        if m and not line.startswith(' '):
            key, val = m.group(1), m.group(2)
            if val == '>' or val == '|':
                collected = []
                i += 1
                while i < n and (lines[i].startswith('  ') or lines[i].strip() == ''):
                    collected.append(lines[i][2:] if lines[i].startswith('  ') else lines[i])
                    i += 1
                if val == '>':
                    fm[key] = re.sub(r'\s+', ' ', ' '.join(collected)).strip()
                else:
                    fm[key] = '\n'.join(collected).strip()
                continue
            if val == '':
                obj = {}
                i += 1
                while i < n and (lines[i].startswith('  ') or lines[i].strip() == ''):
                    sub = re.match(r'^  ([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$', lines[i])
                    if sub:
                        sv = sub.group(2).strip().strip('"').strip("'")
                        obj[sub.group(1)] = sv
                    i += 1
                fm[key] = obj
                continue
            fm[key] = val.strip().strip('"').strip("'")
            i += 1
            continue
        i += 1
    return fm


def extract_slide_chunks(slides_text):
    """Returns list of (frontmatter_dict, body_lines) for each slide (skipping deck-wide fm)."""
    lines = slides_text.split('\n')
    start = parse_deck_frontmatter_end(lines)
    body = lines[start:]

    slides = []
    i = 0
    # Skip leading blank lines
    while i < len(body) and body[i].strip() == '':
        i += 1

    cur_fm = {}
    cur_body = []

    # Check if this first slide has its own frontmatter (rare — cover slides usually don't)
    def try_consume_fm(start_idx):
        """Tight frontmatter: first line at start_idx must match key:, closing --- before any non-FM line."""
        if start_idx >= len(body):
            return None
        first = body[start_idx]
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_-]*:', first):
            return None
        dash_pos = start_idx
        while dash_pos < len(body) and body[dash_pos].strip() != '---':
            dash_pos += 1
        if dash_pos >= len(body):
            return None
        # All lines between start_idx and dash_pos must be FM-shaped
        for j in range(start_idx, dash_pos):
            l = body[j]
            if l.strip() == '':
                continue
            if l.strip().startswith('#'):
                continue
            if re.match(r'^[a-zA-Z_][a-zA-Z0-9_-]*:', l):
                continue
            if re.match(r'^  [a-zA-Z_]', l):
                continue
            if re.match(r'^    ', l):
                continue
            if re.match(r'^  -', l):
                continue
            return None
        return (parse_simple_fm(body[start_idx:dash_pos]), dash_pos + 1)

    while i < len(body):
        line = body[i]
        if line.strip() == '---':
            has_content = any(l.strip() for l in cur_body) or bool(cur_fm)
            if has_content:
                slides.append((cur_fm, cur_body))
            cur_fm = {}
            cur_body = []
            i += 1
            fm_result = try_consume_fm(i)
            if fm_result:
                cur_fm, i = fm_result
            continue
        cur_body.append(line)
        i += 1

    has_content = any(l.strip() for l in cur_body) or bool(cur_fm)
    if has_content:
        slides.append((cur_fm, cur_body))
    return slides


def parse_columns_from_body(body_lines):
    """Parse ::left:: / ::right:: markers and the key:value lines below each."""
    result = {'left': None, 'right': None}
    section = None
    sec_obj = None
    for line in body_lines:
        m = re.match(r'^::(left|right)::\s*$', line)
        if m:
            if section and sec_obj is not None:
                result[section] = sec_obj
            section = m.group(1)
            sec_obj = {}
            continue
        if section is None:
            continue
        kv = re.match(r'^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$', line)
        if kv:
            val = kv.group(2).strip().strip('"').strip("'")
            sec_obj[kv.group(1)] = val
    if section and sec_obj is not None:
        result[section] = sec_obj
    return result


IMAGE_LAYOUTS = {'image-left', 'image-right'}


def class_tokens(cls):
    return set((cls or '').split())


def is_image_focus_slide(layout, cls):
    return layout == 'default' and 'image-focus' in class_tokens(cls)


def main():
    if len(sys.argv) < 3:
        print("Usage: check-11.py <slides.md> <deck-dir>", file=sys.stderr)
        sys.exit(1)

    slides_path = Path(sys.argv[1])
    deck_dir = Path(sys.argv[2])

    if not slides_path.exists():
        print(f"FAIL: slides.md not found: {slides_path}")
        return

    text = slides_path.read_text(encoding='utf-8')
    slides = extract_slide_chunks(text)

    any_image_slide = False
    for idx, (fm, body) in enumerate(slides, start=1):
        layout = fm.get('layout')
        cls = fm.get('class')
        is_image_slide = False
        prompt_source = None
        path_source = None
        label = None

        if is_image_focus_slide(layout, cls):
            is_image_slide = True
            prompt_source = fm.get('image_prompt')
            path_source = fm.get('image_path') or fm.get('image')
            label = f"slide {idx} (image-focus)"
        elif layout in IMAGE_LAYOUTS:
            is_image_slide = True
            prompt_source = fm.get('image_prompt')
            path_source = fm.get('image_path') or fm.get('image')
            label = f"slide {idx} ({layout})"
        elif layout == 'two-cols-header':
            # Column patterns can live in frontmatter (fm.left / fm.right nested objects,
            # authoritative per SP1) OR as fallback in ::left:: / ::right:: body markers.
            # Frontmatter wins when both are present.
            body_cols = parse_columns_from_body(body)
            fm_left = fm.get('left') if isinstance(fm.get('left'), dict) else None
            fm_right = fm.get('right') if isinstance(fm.get('right'), dict) else None
            cols = {
                'left': fm_left if fm_left else body_cols.get('left'),
                'right': fm_right if fm_right else body_cols.get('right'),
            }
            for side in ('left', 'right'):
                if cols.get(side) and cols[side].get('pattern') == 'image':
                    is_image_slide = True
                    prompt_source = cols[side].get('image_prompt')
                    path_source = cols[side].get('image_path')
                    label = f"slide {idx} (two-cols-header.{side}.image)"
                    break

        if not is_image_slide:
            continue
        any_image_slide = True

        # Check image_prompt required + length
        if not prompt_source or not prompt_source.strip():
            print(f"FAIL: {label} image_prompt missing")
            continue
        nonspace = re.sub(r'\s', '', prompt_source)
        if len(nonspace) < 20:
            print(f"FAIL: {label} image_prompt too short ({len(nonspace)} non-whitespace chars, need ≥20)")
            continue

        # Check image_path constraints
        if path_source:
            if not path_source.startswith('public/'):
                print(f"FAIL: {label} image_path must start with public/ (got {path_source})")
                continue
            if path_source.startswith('public/generated/'):
                print(f"OK: {label} prompt ({len(prompt_source)} chars), auto image_path")
            else:
                abs_user = deck_dir / path_source
                if not abs_user.exists():
                    print(f"FAIL: {label} image_path {path_source} does not exist")
                else:
                    print(f"OK: {label} prompt ({len(prompt_source)} chars), user-provided image")
        else:
            print(f"OK: {label} prompt ({len(prompt_source)} chars), auto image_path")

    if any_image_slide:
        # image-style.txt is only required when the deck has image-consuming slides.
        image_style = deck_dir / 'image-style.txt'
        if not image_style.exists():
            print(f"FAIL: image-style.txt missing in deck: {image_style}")
        else:
            content = image_style.read_text(encoding='utf-8').strip()
            if len(content) < 10:
                print(f"FAIL: image-style.txt too short (<10 chars)")
            else:
                print(f"OK: image-style.txt ({len(content)} chars)")
    else:
        print("OK: no image-consuming slides in deck")


if __name__ == '__main__':
    main()
