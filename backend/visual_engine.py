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
from typing import List, Dict, Optional, Tuple
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


def color_distance(c1: Tuple[int, int, int], c2: Tuple[int, int, int]) -> float:
    """Euclidean distance in RGB space"""
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2)))


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

    def audit_color_palette(self, extracted_colors: List[Dict]) -> List[Dict]:
        """
        Audit extracted colors against approved brand palette and check for banned neon colors
        """
        flags = []
        for c in extracted_colors:
            rgb = tuple(c["rgb"])
            hex_code = c["hex"]
            pct = c["percentage"]

            # 1. Check for banned neon colors
            for neon in PROHIBITED_NEONS:
                dist = color_distance(rgb, neon["rgb"])
                if dist < 45 and pct > 3.0:
                    flags.append({
                        "issue_type": "Prohibited Color Usage",
                        "severity": "critical",
                        "flagged_text": f"Prohibited {neon['name']} ({hex_code})",
                        "rule_citation": "Section 12.1: Prohibited Background Colors",
                        "explanation": f"Detected {pct}% of image using prohibited high-saturation color {hex_code}. Guidelines ban fluorescent neons and harsh saturated backgrounds.",
                        "suggested_fix": "Replace background with approved primary Indigo (#4F46E5) or Slate Dark (#1E293B).",
                        "confidence": "high"
                    })

            # 2. Check if significant color matches approved brand palette
            if pct > 15.0:
                closest_approved = min(
                    self.approved_palette,
                    key=lambda a: color_distance(rgb, a["rgb"])
                )
                min_dist = color_distance(rgb, closest_approved["rgb"])
                if min_dist > 85:  # Noticeably off-brand color
                    flags.append({
                        "issue_type": "Off-Brand Color Palette",
                        "severity": "warning",
                        "flagged_text": f"Unapproved Dominant Color ({hex_code})",
                        "rule_citation": "Section 12.1: Approved Brand Color Palette",
                        "explanation": f"Dominant color {hex_code} ({pct}% coverage) deviates from the official brand palette ({', '.join(p['hex'] for p in self.approved_palette[:4])}).",
                        "suggested_fix": f"Realign with approved brand color '{closest_approved['name']}' ({closest_approved['hex']}).",
                        "confidence": "high"
                    })

        return flags

    def audit_wcag_contrast(self, extracted_colors: List[Dict]) -> Dict:
        """
        Calculate contrast ratio between top dominant foreground and background colors
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
        if not aa_pass:
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

    def audit_visual_semantic(self, image_bytes: bytes, mime_type: str = "image/png") -> Dict:
        """
        Use Gemini Multi-Modal Vision to audit image for:
        - OCR text extraction and text compliance
        - Logo detection and clear space
        - Visual layout and guideline conformance
        """
        if not self.client:
            return {"ocr_text": "", "logo_detected": False, "flags": []}

        prompt = """You are an expert visual brand governance auditor.
Analyze the provided marketing image against these brand guidelines:
- Section 12.1: Approved Brand Colors (Indigo #4F46E5, Deep Navy #1E1B4B, Violet #7C3AED, Slate #1E293B, Off-White #F8FAFC). Banned: fluorescent neons, aggressive reds.
- Section 12.2: WCAG 2.1 text contrast (minimum 4.5:1). Overlaid text must be legible with clear backgrounds.
- Section 12.3: Logo integrity. Logo must be clear, unobstructed, not distorted or rotated.
- Section 2-3: Marketing copy embedded in image must not contain banned guarantees ("100%", "guaranteed"), superlatives ("best"), or missing disclaimers.

TASK:
1. Extract any readable text embedded in the image (OCR).
2. Check if a logo is present, clear, and well-positioned.
3. Identify any brand compliance issues in the image.

Return ONLY a valid JSON object in this exact schema:
{
  "ocr_text": "all extracted text found in image",
  "logo_detected": true or false,
  "logo_assessment": "brief assessment of logo placement and clear space",
  "flags": [
    {
      "issue_type": "...",
      "severity": "critical" or "warning" or "suggestion",
      "flagged_text": "...",
      "rule_citation": "...",
      "explanation": "...",
      "suggested_fix": "..."
    }
  ]
}

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

    def audit_image(self, image_bytes: bytes, mime_type: str = "image/png") -> Dict:
        """
        Complete Hybrid Visual Audit:
        1. Deterministic Dominant Color Extraction (PIL)
        2. Deterministic WCAG 2.1 Contrast Calculation
        3. Deterministic Palette Rule Verification
        4. Gemini Semantic Multi-Modal Vision Audit (OCR, Logo, Tone)
        """
        # Load PIL image
        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as img_err:
            raise ValueError(f"Invalid image file: {img_err}")

        # 1. Deterministic dominant colors
        dominant_colors = self.extract_dominant_colors(image, num_colors=5)

        # 2. Deterministic palette check
        palette_flags = self.audit_color_palette(dominant_colors)

        # 3. Deterministic WCAG contrast
        wcag_result = self.audit_wcag_contrast(dominant_colors)
        contrast_flags = wcag_result.get("flags", [])

        # 4. Gemini Multi-Modal Vision
        semantic_result = self.audit_visual_semantic(image_bytes, mime_type=mime_type)
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
