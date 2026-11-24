"""
Visual Brand Audit Engine
Multi-Modal Brand Governance:
1. Exact Dominant Hex Color Palette Extraction (PIL + numpy)
2. WCAG 2.1 Contrast Ratio calculation (AA / AAA compliance)
3. Gemini Multi-Modal Vision Analysis (OCR, logo placement, clear space, visual layout)
"""

import io
import math
import os
import re
import colorsys
from typing import List, Dict, Optional, Tuple, Any
from PIL import Image
import numpy as np
from dotenv import load_dotenv

load_dotenv()

from google import genai
from google.genai import types

# Default approved brand palette from Section 12 of Brand Guidelines
DEFAULT_APPROVED_PALETTE = [
    {"name": "Primary Indigo", "hex": "#4F46E5", "rgb": (79, 70, 229)},
    {"name": "Deep Navy", "hex": "#1E1B4B", "rgb": (30, 27, 75)},
    {"name": "Accent Violet", "hex": "#7C3AED", "rgb": (124, 58, 237)},
    {"name": "Slate Dark", "hex": "#1E293B", "rgb": (30, 41, 59)},
    {"name": "Surface Light", "hex": "#F8FAFC", "rgb": (248, 250, 252)},
    {"name": "Pure White", "hex": "#FFFFFF", "rgb": (255, 255, 255)},
    {"name": "Pure Black", "hex": "#000000", "rgb": (0, 0, 0)},
]

PROHIBITED_NEONS = [
    {"name": "Fluorescent Green", "hex": "#00FF00", "rgb": (0, 255, 0)},
    {"name": "Neon Magenta", "hex": "#FF00FF", "rgb": (255, 0, 255)},
    {"name": "Saturated Red", "hex": "#FF0000", "rgb": (255, 0, 0)},
    {"name": "Harsh Yellow", "hex": "#FFFF00", "rgb": (255, 255, 0)},
]


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02X}{g:02X}{b:02X}"


def hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c * 2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))


def is_neutral_grayscale(rgb: Tuple[int, int, int]) -> bool:
    """Check if color is neutral grayscale (black, white, or gray where R ~ G ~ B)"""
    max_c = max(rgb)
    min_c = min(rgb)
    return (max_c - min_c) <= 20 or max_c <= 20 or min_c >= 245


def color_distance(c1: Tuple[int, int, int], c2: Tuple[int, int, int]) -> float:
    """Euclidean distance in RGB space"""
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2)))


def is_color_match(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int], max_dist: float = 55.0) -> bool:
    """
    Perceptually accurate color matching.
    Checks Euclidean RGB distance and verifies hue does not cross distinct color families.
    Prevents Blue from accidentally matching Indigo/Purple (e.g. #6962D3 vs #3B82F6),
    or Red from accidentally matching Orange or Pink.
    """
    dist = color_distance(rgb1, rgb2)
    if dist > max_dist:
        return False
    if dist < 25.0:
        return True

    r1, g1, b1 = [x / 255.0 for x in rgb1]
    r2, g2, b2 = [x / 255.0 for x in rgb2]
    h1, l1, s1 = colorsys.rgb_to_hls(r1, g1, b1)
    h2, l2, s2 = colorsys.rgb_to_hls(r2, g2, b2)

    # If both colors have discernible saturation, enforce hue preservation
    if s1 > 0.15 and s2 > 0.15:
        hue_diff = min(abs(h1 * 360 - h2 * 360), 360 - abs(h1 * 360 - h2 * 360))
        # Blue is ~217°, Indigo is ~244° (difference 27°). Maximum allowable hue drift is 20°
        if hue_diff > 20.0:
            return False

    return True


# ─── Standard Color Shade Ranges (Spectrums) ───────────────────────────────────
STANDARD_COLOR_RANGES = {
    "blue": {
        "id": "blue",
        "name": "All Blue Shades",
        "family": "blue",
        "hue_min": 185,
        "hue_max": 235,
        "gradient": "linear-gradient(to right, #BAE6FD, #38BDF8, #2563EB, #1E3A8A)"
    },
    "red": {
        "id": "red",
        "name": "All Red Shades",
        "family": "red",
        "hue_min": 345,
        "hue_max": 15,
        "gradient": "linear-gradient(to right, #FECACA, #EF4444, #B91C1C, #7F1D1D)"
    },
    "green": {
        "id": "green",
        "name": "All Green Shades",
        "family": "green",
        "hue_min": 80,
        "hue_max": 160,
        "gradient": "linear-gradient(to right, #A7F3D0, #10B981, #047857, #064E3B)"
    },
    "yellow": {
        "id": "yellow",
        "name": "All Yellow & Amber Shades",
        "family": "yellow",
        "hue_min": 40,
        "hue_max": 65,
        "gradient": "linear-gradient(to right, #FEF08A, #FACC15, #D97706)"
    },
    "purple": {
        "id": "purple",
        "name": "All Purple & Indigo Shades",
        "family": "purple",
        "hue_min": 235,
        "hue_max": 290,
        "gradient": "linear-gradient(to right, #DDD6FE, #8B5CF6, #6D28D9, #4C1D95)"
    },
    "orange": {
        "id": "orange",
        "name": "All Orange Shades",
        "family": "orange",
        "hue_min": 15,
        "hue_max": 40,
        "gradient": "linear-gradient(to right, #FED7AA, #FB923C, #EA580C, #9A3412)"
    },
    "pink": {
        "id": "pink",
        "name": "All Pink & Magenta Shades",
        "family": "pink",
        "hue_min": 290,
        "hue_max": 345,
        "gradient": "linear-gradient(to right, #FBCFE8, #EC4899, #BE185D)"
    },
    "cyan": {
        "id": "cyan",
        "name": "All Cyan & Teal Shades",
        "family": "cyan",
        "hue_min": 160,
        "hue_max": 190,
        "gradient": "linear-gradient(to right, #99F6E4, #14B8A6, #0F766E)"
    }
}


def is_in_hue_range(hue: float, hue_min: float, hue_max: float) -> bool:
    """Check if hue angle (0-360) is inside range, including wrap-around at 360 (e.g. Red 345° to 15°)"""
    if hue_min <= hue_max:
        return hue_min <= hue <= hue_max
    else:
        return hue >= hue_min or hue <= hue_max


def check_color_in_range(rgb: Tuple[int, int, int], hue_min: float, hue_max: float) -> bool:
    """Check if RGB color falls into specified hue range and has discernible saturation"""
    r, g, b = [x / 255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    hue = h * 360.0
    # Must have discernible color (not grayscale / near-black / near-white)
    if s < 0.12 or l < 0.06 or l > 0.95:
        return False
    return is_in_hue_range(hue, hue_min, hue_max)


def calculate_relative_luminance(rgb: Tuple[int, int, int]) -> float:
    """WCAG 2.1 formula for relative luminance"""
    def channel_luminance(c: int) -> float:
        val = c / 255.0
        return val / 12.92 if val <= 0.04045 else ((val + 0.055) / 1.055) ** 2.4

    r_lum = channel_luminance(rgb[0])
    g_lum = channel_luminance(rgb[1])
    b_lum = channel_luminance(rgb[2])
    return 0.2126 * r_lum + 0.7152 * g_lum + 0.0722 * b_lum


def calculate_wcag_contrast(rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]) -> float:
    """Calculate WCAG 2.1 contrast ratio between two colors (range: 1.0 to 21.0)"""
    l1 = calculate_relative_luminance(rgb1)
    l2 = calculate_relative_luminance(rgb2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return round((lighter + 0.05) / (darker + 0.05), 2)


def parse_color_rules_from_text(guideline_text: Optional[str]) -> Dict[str, Any]:
    if not guideline_text:
        return {"banned_colors": [], "approved_colors": [], "has_wcag_rule": False, "has_neon_rule": False, "has_approved_palette": False}
    text_lower = guideline_text.lower()
    banned_colors = []
    
    color_map = {
        "red": {"name": "Red", "rgb": (239, 68, 68), "hex": "#EF4444"},
        "blue": {"name": "Blue", "rgb": (59, 130, 246), "hex": "#3B82F6"},
        "green": {"name": "Green", "rgb": (34, 197, 94), "hex": "#22C55E"},
        "yellow": {"name": "Yellow", "rgb": (234, 179, 8), "hex": "#EAB308"},
        "purple": {"name": "Purple", "rgb": (168, 85, 247), "hex": "#A855F7"},
        "orange": {"name": "Orange", "rgb": (249, 115, 22), "hex": "#F97316"},
        "pink": {"name": "Pink", "rgb": (236, 72, 153), "hex": "#EC4899"},
        "cyan": {"name": "Cyan", "rgb": (6, 182, 212), "hex": "#06B6D4"},
        "teal": {"name": "Teal", "rgb": (20, 184, 166), "hex": "#14B8A6"},
        "navy": {"name": "Navy", "rgb": (30, 27, 75), "hex": "#1E1B4B"},
        "gold": {"name": "Gold", "rgb": (255, 215, 0), "hex": "#FFD700"},
        "maroon": {"name": "Maroon", "rgb": (128, 0, 0), "hex": "#800000"},
        "magenta": {"name": "Magenta", "rgb": (255, 0, 255), "hex": "#FF00FF"},
        "lime": {"name": "Lime", "rgb": (132, 204, 22), "hex": "#84CC16"},
        "amber": {"name": "Amber", "rgb": (245, 158, 11), "hex": "#F59E0B"},
        "neon green": {"name": "Neon Green", "rgb": (0, 255, 0), "hex": "#00FF00"},
        "neon yellow": {"name": "Neon Yellow", "rgb": (255, 255, 0), "hex": "#FFFF00"},
        "neon blue": {"name": "Neon Blue", "rgb": (0, 255, 255), "hex": "#00FFFF"},
    }

    # Match banned colors (e.g., "No Red and Blue", "prohibit yellow")
    for color_name, color_info in sorted(color_map.items(), key=lambda x: len(x[0]), reverse=True):
        pat = rf"(?:no|not|prohibit\w*|ban\w*|avoid)\s+(?:[\w\s,]*\s+)?{color_name}\b|{color_name}\b\s+[\w\s,]*\s+(?:prohibit\w*|ban\w*|not allowed|should not be used|is prohibited)"
        if re.search(pat, text_lower):
            if not any(b["hex"].upper() == color_info["hex"].upper() for b in banned_colors):
                banned_colors.append(color_info)

    # Valid hex code prohibitions (skip invalid hex like /* [INVALID HEX: ... skipped] */)
    hex_prohibits = re.findall(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b", text_lower)
    for h in hex_prohibits:
        if any(w in text_lower for w in ["prohibit", "ban", "avoid", "no ", "not allow"]):
            try:
                rgb = hex_to_rgb(h)
                if not any(b["hex"].upper() == h.upper() for b in banned_colors):
                    banned_colors.append({"name": f"Hex {h.upper()}", "rgb": rgb, "hex": h.upper()})
            except Exception:
                pass

    # Approved colors extraction
    approved_colors = []
    has_approved_keywords = any(w in text_lower for w in [
        "approved brand color", "primary brand palette", "approved palette", "official brand palette", "approved brand color palette"
    ])
    if has_approved_keywords:
        for line in text_lower.splitlines():
            if any(w in line for w in ["approved", "primary brand", "official brand", "wanted"]):
                for color_name, color_info in sorted(color_map.items(), key=lambda x: len(x[0]), reverse=True):
                    if re.search(rf"\b{color_name}\b", line):
                        if not any(a["hex"].upper() == color_info["hex"].upper() for a in approved_colors):
                            approved_colors.append(color_info)
                for h in re.findall(r"#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b", line):
                    try:
                        rgb = hex_to_rgb(h)
                        if not any(a["hex"].upper() == h.upper() for a in approved_colors):
                            approved_colors.append({"name": f"Hex {h.upper()}", "rgb": rgb, "hex": h.upper()})
                    except Exception:
                        pass

    # Color Spectrum / Shade Range extraction (e.g. "All Blue Shades", "Whole shade of Red", "Hue range 185-235")
    banned_ranges = []
    approved_ranges = []

    for family, range_info in STANDARD_COLOR_RANGES.items():
        # Prohibited whole shade / spectrum pattern
        banned_spectrum_pat = rf"(?:no|not|prohibit\w*|ban\w*|avoid)\s+[^.\n]*?(?:all\s+shades?\s+of\s+{family}|whole\s+shade\s+of\s+{family}|entire\s+{family}\s+(?:spectrum|range|family)|{family}\s+spectrum|{family}\s+shades?|shades?\s+of\s+{family})|(?:all\s+shades?\s+of\s+{family}|whole\s+shade\s+of\s+{family}|{family}\s+spectrum)\s+[^.\n]*?(?:prohibit\w*|ban\w*|not allowed|avoid)"
        if re.search(banned_spectrum_pat, text_lower):
            if not any(r["family"] == family for r in banned_ranges):
                banned_ranges.append(range_info)

        # Approved whole shade / spectrum pattern
        approved_spectrum_pat = rf"(?:approved|wanted|allow\w*|permitted)\s+[^.\n]*?(?:all\s+shades?\s+of\s+{family}|whole\s+shade\s+of\s+{family}|entire\s+{family}\s+(?:spectrum|range|family)|{family}\s+spectrum|{family}\s+shades?|shades?\s+of\s+{family})|(?:all\s+shades?\s+of\s+{family}|whole\s+shade\s+of\s+{family}|{family}\s+spectrum)\s+[^.\n]*?(?:approved|allowed|permitted|wanted)"
        if re.search(approved_spectrum_pat, text_lower):
            if not any(r["family"] == family for r in approved_ranges):
                approved_ranges.append(range_info)

    # Detect explicit Hue range X°-Y°
    custom_range_matches = re.finditer(r"(prohibit\w*|approved?|allow\w*)[^.\n]*?hue\s+range\s*(\d+)[°\s]*[-to\s]+(\d+)", text_lower)
    for m in custom_range_matches:
        action, h_min, h_max = m.group(1), int(m.group(2)), int(m.group(3))
        custom_item = {
            "id": f"custom_{h_min}_{h_max}",
            "name": f"Custom Spectrum ({h_min}°-{h_max}°)",
            "family": "custom",
            "hue_min": h_min,
            "hue_max": h_max,
            "gradient": f"linear-gradient(to right, hsl({h_min}, 80%, 50%), hsl({h_max}, 80%, 50%))"
        }
        if any(w in action for w in ["prohibit", "ban"]):
            if not any(r["hue_min"] == h_min and r["hue_max"] == h_max for r in banned_ranges):
                banned_ranges.append(custom_item)
        else:
            if not any(r["hue_min"] == h_min and r["hue_max"] == h_max for r in approved_ranges):
                approved_ranges.append(custom_item)

    # Determine Governance Mode:
    # 1) 'approved': Strict Allowlist (everything outside approved colors/ranges is prohibited)
    # 2) 'prohibited': Strict Blocklist (only prohibited colors/ranges are banned, everything outside is approved)
    # 3) 'tiered': Preferred & Not Preferred (unlisted colors are considered neutral)
    color_mode = "tiered"
    has_approved = bool(approved_colors) or bool(approved_ranges)
    has_banned = bool(banned_colors) or bool(banned_ranges)

    if "strict allowlist" in text_lower or (has_approved and not has_banned):
        color_mode = "approved"
    elif "strict blocklist" in text_lower or (has_banned and not has_approved):
        color_mode = "prohibited"
    else:
        color_mode = "tiered"

    return {
        "banned_colors": banned_colors,
        "approved_colors": approved_colors,
        "banned_ranges": banned_ranges,
        "approved_ranges": approved_ranges,
        "color_mode": color_mode,
        "has_wcag_rule": any(w in text_lower for w in ["wcag", "contrast", "accessibility", "iso/iec 40500"]),
        "has_neon_rule": any(w in text_lower for w in ["neon", "fluorescent", "saturated"]),
        "has_approved_palette": has_approved or has_approved_keywords
    }


class VisualBrandEngine:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        self.vision_model = "gemini-3.5-flash-lite"
        self.approved_palette = DEFAULT_APPROVED_PALETTE

    def extract_dominant_colors(self, image: Image.Image, num_colors: int = 5) -> List[Dict]:
        """
        Extract dominant color palette using Pillow quantization and histogram
        Returns list of colors with hex, rgb, and percentage of image
        """
        # Convert to RGB and resize for speed and noise reduction
        img = image.convert("RGB")
        img = img.resize((150, 150))
        
        # Quantize image to num_colors palette
        quantized = img.quantize(colors=num_colors, method=Image.Quantize.MEDIANCUT)
        palette = quantized.getpalette()[:num_colors * 3]
        
        # Count frequency of each color
        color_counts = quantized.getcolors()
        total_pixels = 150 * 150
        
        colors = []
        if color_counts:
            # Sort by frequency descending
            color_counts.sort(key=lambda x: x[0], reverse=True)
            for count, idx in color_counts:
                r = palette[idx * 3]
                g = palette[idx * 3 + 1]
                b = palette[idx * 3 + 2]
                hex_code = rgb_to_hex(r, g, b)
                pct = round((count / total_pixels) * 100, 1)
                colors.append({
                    "hex": hex_code,
                    "rgb": [r, g, b],
                    "percentage": pct
                })
        return colors

    def audit_color_palette(self, extracted_colors: List[Dict], guidelines_text: Optional[str] = None, include_standard_rules: bool = False) -> List[Dict]:
        """
        Audit extracted colors against active brand guidelines using the selected Governance Mode:
        - Mode 1 ('approved'): Strict Allowlist. Outside of approved colors, all colors are prohibited.
        - Mode 2 ('prohibited'): Strict Blocklist. Only prohibited colors are banned; everything outside is approved.
        - Mode 3 ('tiered'): Preferred & Not Preferred. Unlisted colors are considered neutral.
        """
        flags = []
        rules = parse_color_rules_from_text(guidelines_text) if guidelines_text else {
            "banned_colors": [], "approved_colors": [], "color_mode": "tiered", "has_wcag_rule": False, "has_neon_rule": True, "has_approved_palette": True
        }
        color_mode = rules.get("color_mode", "tiered")

        for c in extracted_colors:
            rgb = tuple(c["rgb"])
            hex_code = c["hex"]
            pct = c["percentage"]

            # Standard Baseline Neon Check
            if include_standard_rules or rules["has_neon_rule"]:
                for neon in PROHIBITED_NEONS:
                    dist = color_distance(rgb, neon["rgb"])
                    if dist < 45 and pct > 1.5:
                        flags.append({
                            "issue_type": "Prohibited Color Usage",
                            "severity": "critical",
                            "flagged_text": f"Prohibited {neon['name']} ({hex_code})",
                            "rule_citation": "Section 12.1: Prohibited Background Colors",
                            "explanation": f"Detected {pct}% of image using prohibited high-saturation color {hex_code}. Guidelines ban fluorescent neons.",
                            "suggested_fix": "Replace with approved brand colors.",
                            "confidence": "high"
                        })

            # =========================================================================
            # OPTION 1: Strict Approved (Allowlist Mode)
            # Apart from selected approved colors & shade ranges, everything else is strictly prohibited!
            # =========================================================================
            if color_mode == "approved" and (rules.get("approved_colors") or rules.get("approved_ranges")):
                if not is_neutral_grayscale(rgb):
                    is_approved = False
                    if rules.get("approved_colors"):
                        closest_approved = min(
                            rules["approved_colors"],
                            key=lambda a: color_distance(rgb, a["rgb"])
                        )
                        min_dist = color_distance(rgb, closest_approved["rgb"])
                        if min_dist <= 70:
                            is_approved = True
                    if not is_approved and rules.get("approved_ranges"):
                        is_approved = any(check_color_in_range(rgb, r["hue_min"], r["hue_max"]) for r in rules["approved_ranges"])

                    if not is_approved and pct >= 1.5:
                        approved_labels = [p['hex'] for p in rules.get('approved_colors', [])] + [r['name'] for r in rules.get('approved_ranges', [])]
                        flags.append({
                            "issue_type": "Prohibited Color Usage",
                            "severity": "critical",
                            "flagged_text": f"Unapproved Color ({hex_code})",
                            "rule_citation": "Color Governance: Strict Approved Allowlist",
                            "explanation": f"Guidelines enforce Strict Approved mode ({', '.join(approved_labels)}). Non-approved color {hex_code} ({pct}% coverage) is strictly prohibited.",
                            "suggested_fix": "Replace with an approved brand color or shade range.",
                            "confidence": "high"
                        })

            # =========================================================================
            # OPTION 2: Strict Prohibited (Blocklist Mode)
            # Only prohibited colors and shade spectrums are banned; everything outside it will be approved!
            # =========================================================================
            elif color_mode == "prohibited" and (rules.get("banned_colors") or rules.get("banned_ranges")):
                for banned in rules.get("banned_colors", []):
                    if is_color_match(rgb, banned["rgb"]) and pct > 1.5:
                        flags.append({
                            "issue_type": "Prohibited Color Usage",
                            "severity": "critical",
                            "flagged_text": f"Prohibited {banned['name']} ({hex_code})",
                            "rule_citation": "Color Governance: Strict Prohibited Blocklist",
                            "explanation": f"Detected {pct}% of image using prohibited color {banned['name']} ({hex_code}). Guidelines strictly ban this color.",
                            "suggested_fix": f"Remove {banned['name']} ({hex_code}). All other colors outside this prohibited list are approved.",
                            "confidence": "high"
                        })
                for rng in rules.get("banned_ranges", []):
                    if check_color_in_range(rgb, rng["hue_min"], rng["hue_max"]) and pct > 1.5:
                        flags.append({
                            "issue_type": "Prohibited Color Usage",
                            "severity": "critical",
                            "flagged_text": f"Prohibited {rng['name']} ({hex_code})",
                            "rule_citation": "Color Governance: Prohibited Shade Spectrum",
                            "explanation": f"Detected {pct}% of image using prohibited shade of {rng['name']} ({hex_code}). Guidelines strictly ban the whole spectrum ({rng['hue_min']}°- {rng['hue_max']}°).",
                            "suggested_fix": f"Remove {hex_code}. All other colors outside this prohibited shade range are approved.",
                            "confidence": "high"
                        })

            # =========================================================================
            # OPTION 3: Preferred & Not Preferred (Tiered Mode)
            # Preferred + Not Preferred. If not mentioned in either, consider as Neutral!
            # =========================================================================
            else:
                # Flag explicitly banned/not-preferred colors
                for banned in rules.get("banned_colors", []):
                    if is_color_match(rgb, banned["rgb"]) and pct > 1.5:
                        flags.append({
                            "issue_type": "Prohibited Color Usage",
                            "severity": "critical",
                            "flagged_text": f"Prohibited {banned['name']} ({hex_code})",
                            "rule_citation": "Color Governance: Not Preferred Color",
                            "explanation": f"Detected {pct}% of image using not-preferred color {banned['name']} ({hex_code}).",
                            "suggested_fix": f"Remove {banned['name']} ({hex_code}).",
                            "confidence": "high"
                        })
                for rng in rules.get("banned_ranges", []):
                    if check_color_in_range(rgb, rng["hue_min"], rng["hue_max"]) and pct > 1.5:
                        flags.append({
                            "issue_type": "Prohibited Color Usage",
                            "severity": "critical",
                            "flagged_text": f"Prohibited {rng['name']} ({hex_code})",
                            "rule_citation": "Color Governance: Not Preferred Shade Spectrum",
                            "explanation": f"Detected {pct}% of image using not-preferred shade from {rng['name']} ({hex_code}).",
                            "suggested_fix": f"Remove {hex_code}.",
                            "confidence": "high"
                        })
                # In Option 3, unlisted colors are considered NEUTRAL.
                # Only if a color is a major dominant area (> 25%) and noticeably off-palette, suggest aligning.
                if rules.get("approved_colors") and pct > 25.0 and not is_neutral_grayscale(rgb):
                    closest_approved = min(
                        rules["approved_colors"],
                        key=lambda a: color_distance(rgb, a["rgb"])
                    )
                    min_dist = color_distance(rgb, closest_approved["rgb"])
                    if min_dist > 85:
                        flags.append({
                            "issue_type": "Off-Brand Color Palette",
                            "severity": "warning",
                            "flagged_text": f"Off-Brand Dominant Color ({hex_code})",
                            "rule_citation": "Color Governance: Preferred Voice",
                            "explanation": f"Dominant color {hex_code} ({pct}%) is not in preferred palette ({', '.join(p['hex'] for p in rules['approved_colors'][:3])}). Unlisted colors are considered neutral, but preferred palette is recommended.",
                            "suggested_fix": f"Consider realigning with preferred brand color '{closest_approved['name']}' ({closest_approved['hex']}).",
                            "confidence": "medium"
                        })

        return flags

    def audit_wcag_contrast(self, extracted_colors: List[Dict], guidelines_text: Optional[str] = None, include_standard_rules: bool = False) -> Dict:
        """
        Calculate contrast ratio between top dominant foreground and background colors.
        """
        if len(extracted_colors) < 2:
            return {"contrast_ratio": 21.0, "wcag_aa_pass": True, "wcag_aaa_pass": True, "flags": []}

        bg_rgb = tuple(extracted_colors[0]["rgb"])
        fg_rgb = tuple(extracted_colors[1]["rgb"])
        
        ratio = calculate_wcag_contrast(bg_rgb, fg_rgb)
        
        aa_pass = ratio >= 4.5
        large_text_pass = ratio >= 3.0
        aaa_pass = ratio >= 7.0

        flags = []
        rules = parse_color_rules_from_text(guidelines_text) if guidelines_text else {"has_wcag_rule": True}
        should_enforce_wcag = include_standard_rules or rules["has_wcag_rule"] or not guidelines_text

        if should_enforce_wcag and not aa_pass:
            severity = "critical" if not large_text_pass else "warning"
            flags.append({
                "issue_type": "WCAG Contrast Failure",
                "severity": severity,
                "flagged_text": f"Contrast Ratio {ratio}:1 ({extracted_colors[0]['hex']} on {extracted_colors[1]['hex']})",
                "rule_citation": "Section 12.2: WCAG Accessibility Standards",
                "explanation": f"Dominant foreground/background contrast is {ratio}:1, failing the WCAG 2.1 AA minimum threshold of 4.5:1 for standard text.",
                "suggested_fix": f"Increase lightness contrast between {extracted_colors[0]['hex']} and {extracted_colors[1]['hex']} to achieve at least 4.5:1 contrast ratio.",
                "confidence": "high"
            })

        return {
            "contrast_ratio": ratio,
            "background_hex": extracted_colors[0]["hex"],
            "foreground_hex": extracted_colors[1]["hex"],
            "wcag_aa_pass": aa_pass,
            "wcag_aa_large_pass": large_text_pass,
            "wcag_aaa_pass": aaa_pass,
            "flags": flags
        }

    def audit_visual_semantic(self, image_bytes: bytes, mime_type: str = "image/png", guidelines_text: Optional[str] = None, include_standard_rules: bool = False) -> Dict:
        """
        Use Gemini Multi-Modal Vision to audit image against active brand guidelines.
        """
        if not self.client:
            return {"ocr_text": "", "logo_detected": False, "flags": []}

        rules_context = []
        if guidelines_text and guidelines_text.strip():
            rules_context.append(f"ACTIVE BRAND GUIDELINE:\n{guidelines_text.strip()[:3000]}")
        else:
            rules_context.append("ACTIVE BRAND GUIDELINE: General enterprise brand standards.")

        if include_standard_rules:
            rules_context.append("""STANDARD GOVERNANCE BASELINE (ACTIVE):
- Section 12.1: Approved Brand Colors (Indigo #4F46E5, Deep Navy #1E1B4B, Violet #7C3AED, Slate #1E293B, Off-White #F8FAFC). Banned: fluorescent neons, aggressive reds.
- Section 12.2: WCAG 2.1 text contrast (minimum 4.5:1). Overlaid text must be legible with clear backgrounds.
- Section 12.3: Logo integrity. Logo must be clear, unobstructed, not distorted or rotated.
- Section 2-3: Marketing copy embedded in image must not contain banned guarantees ("100%", "guaranteed"), superlatives ("best"), or missing disclaimers.""")

        guideline_context = "\n\n".join(rules_context)

        prompt = f"""You are an expert visual brand governance auditor.
Analyze the provided marketing image STRICTLY against the active brand guidelines below.

{guideline_context}

CRITICAL AUDIT INSTRUCTIONS:
1. STRICT ADHERENCE: Only flag violations that explicitly break the ACTIVE BRAND GUIDELINE (or the STANDARD GOVERNANCE BASELINE if provided above).
2. DO NOT hallucinate or enforce unmentioned rules. If the active guideline does NOT prohibit competitor names, guarantees, or particular colors, DO NOT flag them.
3. BRAND AMBASSADOR EXCEPTION: If the guideline prohibits person names but explicitly permits a brand ambassador (e.g. Hritik Roshan), DO NOT flag the brand ambassador's name.

TASK:
1. Extract any readable text embedded in the image (OCR).
2. Check if a logo is present, clear, and well-positioned.
3. Identify any brand compliance issues according ONLY to the active guidelines above.

Return ONLY a valid JSON object in this exact schema:
{{
  "ocr_text": "all extracted text found in image",
  "logo_detected": true or false,
  "logo_assessment": "brief assessment of logo placement and clear space",
  "flags": [
    {{
      "issue_type": "...",
      "severity": "critical" or "warning" or "suggestion",
      "flagged_text": "...",
      "rule_citation": "...",
      "explanation": "...",
      "suggested_fix": "..."
    }}
  ]
}}

If no violations exist, return "flags": [].
"""

        try:
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            response = self.client.models.generate_content(
                model=self.vision_model,
                contents=[image_part, prompt]
            )

            text_resp = response.text.strip()
            if text_resp.startswith("```json"):
                text_resp = text_resp.split("```json")[1].split("```")[0].strip()
            elif text_resp.startswith("```"):
                text_resp = text_resp.split("```")[1].split("```")[0].strip()

            import json
            data = json.loads(text_resp)
            for f in data.get("flags", []):
                f["confidence"] = "medium"
            return data
        except Exception as e:
            print(f"Gemini Vision audit skipped/failed: {e}")
            return {"ocr_text": "", "logo_detected": False, "flags": []}

    def audit_image(self, image_bytes: bytes, mime_type: str = "image/png", guidelines_text: Optional[str] = None, include_standard_rules: bool = False) -> Dict:
        """
        Complete Hybrid Visual Audit:
        1. Deterministic Dominant Color Extraction (PIL)
        2. Deterministic WCAG 2.1 Contrast Calculation
        3. Deterministic Palette Rule Verification (scoped to guideline)
        4. Gemini Semantic Multi-Modal Vision Audit (OCR, Logo, Tone strictly scoped to guideline)
        """
        # Load PIL image
        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as img_err:
            raise ValueError(f"Invalid image file: {img_err}")

        # 1. Deterministic dominant colors
        dominant_colors = self.extract_dominant_colors(image, num_colors=5)
        color_rules = parse_color_rules_from_text(guidelines_text) if guidelines_text else {}
        color_mode = color_rules.get("color_mode", "tiered")

        # 2. Deterministic palette check
        palette_flags = self.audit_color_palette(dominant_colors, guidelines_text=guidelines_text, include_standard_rules=include_standard_rules)

        # 3. Deterministic WCAG contrast
        wcag_result = self.audit_wcag_contrast(dominant_colors, guidelines_text=guidelines_text, include_standard_rules=include_standard_rules)
        contrast_flags = wcag_result.get("flags", [])

        # 4. Gemini Multi-Modal Vision
        semantic_result = self.audit_visual_semantic(image_bytes, mime_type=mime_type, guidelines_text=guidelines_text, include_standard_rules=include_standard_rules)
        semantic_flags = semantic_result.get("flags", [])

        # Combine all flags
        all_flags = palette_flags + contrast_flags + semantic_flags

        # Calculate Visual Brand Trust Score
        critical_count = sum(1 for f in all_flags if f['severity'] == 'critical')
        warning_count = sum(1 for f in all_flags if f['severity'] == 'warning')
        suggestion_count = sum(1 for f in all_flags if f['severity'] == 'suggestion')
        trust_score = max(0, 100 - (critical_count * 20) - (warning_count * 7) - (suggestion_count * 2))

        return {
            "image_dimensions": f"{image.width}x{image.height}",
            "dominant_palette": dominant_colors,
            "color_governance_mode": color_mode,
            "approved_colors": [a["hex"] for a in color_rules.get("approved_colors", [])],
            "banned_colors": [b["hex"] for b in color_rules.get("banned_colors", [])],
            "approved_ranges": color_rules.get("approved_ranges", []),
            "banned_ranges": color_rules.get("banned_ranges", []),
            "wcag_analysis": {
                "contrast_ratio": wcag_result["contrast_ratio"],
                "wcag_aa_pass": wcag_result["wcag_aa_pass"],
                "wcag_aaa_pass": wcag_result["wcag_aaa_pass"],
                "background_hex": wcag_result.get("background_hex"),
                "foreground_hex": wcag_result.get("foreground_hex")
            },
            "ocr_text": semantic_result.get("ocr_text", ""),
            "logo_detected": semantic_result.get("logo_detected", False),
            "logo_assessment": semantic_result.get("logo_assessment", "Not analyzed"),
            "brand_trust_score": trust_score,
            "flags": all_flags,
            "total_issues": len(all_flags)
        }
