'use client';

/**
 * Brand Guidelines Directory & Rule Inspector - VeriBrand Enterprise
 * Interactive guideline library: select any guideline to inspect its extracted rules,
 * enforcement categories, severity weights, and raw source text.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://veribrand-backend.onrender.com';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Sparkles,
  Layers,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  FileCode,
  Calendar,
  Plus,
  X,
  Sliders,
  Palette,
  Eye,
  CheckSquare,
  Trash2,
  Edit3,
  Wand2,
  RefreshCw,
  Volume2,
  Building2,
  Users,
  Hash,
  MessageSquare,
} from 'lucide-react';

interface ExtractedRule {
  section: string;
  category: string;
  rule: string;
  enforcement: 'Deterministic' | 'Semantic RAG';
  severity: 'Critical' | 'Warning' | 'Suggestion';
}

interface GuidelineItem {
  id: string;
  filename: string;
  uploaded_at: string;
}

interface GuidelineDetail {
  id: string;
  filename: string;
  uploaded_at: string;
  content_preview?: string;
  full_content?: string;
  rules_count: number;
  rules: ExtractedRule[];
}

const DEFAULT_TECHCORP_RULES: ExtractedRule[] = [
  {
    section: 'Section 1.2',
    category: 'Tone & Voice',
    rule: 'Avoid absolute promises (e.g., "guarantee", "100%", "best in the world"). Voice must remain objective and data-backed.',
    enforcement: 'Deterministic',
    severity: 'Critical',
  },
  {
    section: 'Section 3.1',
    category: 'Competitive Claims',
    rule: 'Never mention competitors by name directly without documented benchmark citations and legal clearance.',
    enforcement: 'Semantic RAG',
    severity: 'Critical',
  },
  {
    section: 'Section 4.4',
    category: 'Legal Disclaimers',
    rule: 'All promotional claims regarding free tiers or pricing trials must carry the standard disclaimer: "Terms and conditions apply."',
    enforcement: 'Deterministic',
    severity: 'Critical',
  },
  {
    section: 'Section 6.2',
    category: 'Brand Naming',
    rule: 'Always use proper CamelCase "TechCorp" with capital T and C. Never format as "techcorp" or "Tech Corp".',
    enforcement: 'Deterministic',
    severity: 'Warning',
  },
  {
    section: 'Section 12.1',
    category: 'Color & Accessibility',
    rule: 'Primary brand palette strictly restricted to TechCorp Navy (#1E1B4B) and Indigo (#4F46E5). Prohibit neon green (#00FF00) and electric yellow.',
    enforcement: 'Deterministic',
    severity: 'Critical',
  },
  {
    section: 'Section 12.3',
    category: 'WCAG Contrast',
    rule: 'All typography against background color swatches must maintain minimum ISO/IEC 40500 WCAG 2.1 Level AA contrast ratio (4.5:1).',
    enforcement: 'Deterministic',
    severity: 'Critical',
  },
];

function parseGuidelineTextClient(text: string): ExtractedRule[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rules: ExtractedRule[] = [];

  lines.forEach((line) => {
    const numberedMatch = line.match(/^(\d+)[\.\)]\s*(.+)$/i);
    const bulletMatch = line.match(/^[-*•]\s*(.+)$/i);
    const sectionMatch = line.match(/^(?:Section|Rule)\s*([\d\.]+):?\s*(.+)$/i);

    let sectionName = '';
    let ruleText = '';

    if (numberedMatch) {
      sectionName = `Rule ${numberedMatch[1]}`;
      ruleText = numberedMatch[2].trim();
    } else if (sectionMatch) {
      sectionName = `Section ${sectionMatch[1]}`;
      ruleText = sectionMatch[2].trim();
    } else if (bulletMatch) {
      sectionName = `Rule ${rules.length + 1}`;
      ruleText = bulletMatch[1].trim();
    } else if (line.length > 5 && !line.toLowerCase().endsWith('rules:')) {
      sectionName = `Rule ${rules.length + 1}`;
      ruleText = line;
    }

    if (!ruleText) return;

    const lower = ruleText.toLowerCase();
    let category = 'Brand Compliance';
    let enforcement: 'Deterministic' | 'Semantic RAG' = 'Deterministic';
    let severity: 'Critical' | 'Warning' | 'Suggestion' = 'Critical';

    if (lower.includes('100%') || lower.includes('guarantee') || lower.includes('best') || lower.includes('claim')) {
      category = 'Tone & Claims';
      enforcement = 'Deterministic';
      severity = 'Critical';
    } else if (lower.includes('name of') || lower.includes('person') || lower.includes('ambassador') || lower.includes('roshan') || lower.includes('competitor')) {
      category = 'Entity & Endorsements';
      enforcement = 'Semantic RAG';
      severity = lower.includes('can be') ? 'Warning' : 'Critical';
    } else if (lower.includes('red') || lower.includes('blue') || lower.includes('colour') || lower.includes('color') || lower.includes('poster') || lower.includes('wcag')) {
      category = 'Visual & Palette';
      enforcement = 'Deterministic';
      severity = 'Critical';
    } else if (lower.includes('question') || lower.includes('?')) {
      category = 'Punctuation & Style';
      enforcement = 'Deterministic';
      severity = 'Critical';
    } else if (lower.includes('exclamation') || lower.includes('exclainmation') || lower.includes('!')) {
      category = 'Punctuation & Formatting';
      enforcement = 'Deterministic';
      severity = 'Critical';
    } else if (lower.includes('disclaimer') || lower.includes('terms and conditions')) {
      category = 'Legal Disclaimers';
      enforcement = 'Deterministic';
      severity = 'Critical';
    }

    rules.push({
      section: sectionName,
      category,
      rule: ruleText,
      enforcement,
      severity,
    });
  });

  return rules.length > 0 ? rules : DEFAULT_TECHCORP_RULES;
}

// ─── Standard Enterprise Governance Dimensions ─────────────────────────────
const STANDARD_SYMBOLS = [
  { symbol: '!', label: 'Exclamation (!)', desc: 'Prevents shouty, over-hyped marketing claims' },
  { symbol: '?', label: 'Question (?)', desc: 'Bans rhetorical or uncertain interrogative copy' },
  { symbol: '%', label: 'Percent (%)', desc: 'Restricts statistical/absolute percentage claims' },
  { symbol: '$', label: 'Currency ($)', desc: 'Restricts unapproved price points & financial claims' },
  { symbol: '*', label: 'Asterisk (*)', desc: 'Disallows fine-print footnote disclaimers' },
  { symbol: '#', label: 'Hashtag (#)', desc: 'Prevents social media tags in corporate copy' },
  { symbol: '@', label: 'Mention (@)', desc: 'Blocks social handles and tag spamming' },
  { symbol: 'Emoji', label: 'Emojis', desc: 'Maintains formal corporate communication standards' },
];

const STANDARD_PREFERRED_TONES = [
  'Professional & Authoritative',
  'Objective & Data-Backed',
  'Empathetic & Customer-Centric',
  'Clear & Transparent',
  'Inspiring & Purpose-Driven',
  'Calm & Direct',
];

const STANDARD_PROHIBITED_TONES = [
  'Aggressive / High-Pressure',
  'Uncertain / Questioning',
  'Casual / Slang',
  'Sensationalist / Clickbait',
  'Sarcastic / Humorous',
  'Informal / Colloquial',
  'Unsubstantiated / Superlative',
];

const SUGGESTED_BANNED_WORDS = [
  '100%', 'guarantee', 'guaranteed', 'risk-free', 'miracle', 'best in the world', 'cheapest', 'unlimited'
];

interface ColorRangeItem {
  id: string;
  name: string;
  family: string;
  hueMin: number;
  hueMax: number;
  desc?: string;
  gradient: string;
}

const STANDARD_SHADE_RANGES: ColorRangeItem[] = [
  {
    id: 'blue',
    name: 'All Blue Shades',
    family: 'blue',
    hueMin: 185,
    hueMax: 235,
    desc: 'Covers Royal Blue, Sky Blue, Cobalt, Navy-Blue',
    gradient: 'linear-gradient(to right, #BAE6FD, #38BDF8, #2563EB, #1E3A8A)'
  },
  {
    id: 'red',
    name: 'All Red Shades',
    family: 'red',
    hueMin: 345,
    hueMax: 15,
    desc: 'Covers Crimson, Scarlet, Ruby, Cherry',
    gradient: 'linear-gradient(to right, #FECACA, #EF4444, #B91C1C, #7F1D1D)'
  },
  {
    id: 'green',
    name: 'All Green Shades',
    family: 'green',
    hueMin: 80,
    hueMax: 160,
    desc: 'Covers Mint, Emerald, Lime, Forest',
    gradient: 'linear-gradient(to right, #A7F3D0, #10B981, #047857, #064E3B)'
  },
  {
    id: 'yellow',
    name: 'All Yellow & Amber Shades',
    family: 'yellow',
    hueMin: 40,
    hueMax: 65,
    desc: 'Covers Lemon, Amber, Gold, Mustard',
    gradient: 'linear-gradient(to right, #FEF08A, #FACC15, #D97706)'
  },
  {
    id: 'purple',
    name: 'All Purple & Indigo Shades',
    family: 'purple',
    hueMin: 235,
    hueMax: 290,
    desc: 'Covers Indigo, Violet, Lavender, Plum',
    gradient: 'linear-gradient(to right, #DDD6FE, #8B5CF6, #6D28D9, #4C1D95)'
  },
  {
    id: 'orange',
    name: 'All Orange Shades',
    family: 'orange',
    hueMin: 15,
    hueMax: 40,
    desc: 'Covers Peach, Tangerine, Coral, Rust',
    gradient: 'linear-gradient(to right, #FED7AA, #FB923C, #EA580C, #9A3412)'
  },
  {
    id: 'pink',
    name: 'All Pink & Magenta Shades',
    family: 'pink',
    hueMin: 290,
    hueMax: 345,
    desc: 'Covers Rose, Fuchsia, Hot Pink',
    gradient: 'linear-gradient(to right, #FBCFE8, #EC4899, #BE185D)'
  },
  {
    id: 'cyan',
    name: 'All Cyan & Teal Shades',
    family: 'cyan',
    hueMin: 160,
    hueMax: 190,
    desc: 'Covers Aqua, Turquoise, Teal',
    gradient: 'linear-gradient(to right, #99F6E4, #14B8A6, #0F766E)'
  }
];

function parseHexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map(x => x + x).join('');
  if (clean.length !== 6) return [59, 130, 246];
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// ─── Standard Enterprise Color Dictionary & Hex Resolver ────────────────────
const STANDARD_COLOR_MAP: Record<string, string> = {
  // Base hues
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#EAB308',
  purple: '#A855F7',
  orange: '#F97316',
  pink: '#EC4899',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#6B7280',
  grey: '#6B7280',
  navy: '#1E1B4B',
  indigo: '#4F46E5',
  violet: '#7C3AED',
  cyan: '#06B6D4',
  teal: '#14B8A6',
  magenta: '#FF00FF',
  lime: '#84CC16',
  amber: '#F59E0B',
  rose: '#F43F5E',
  emerald: '#10B981',
  sky: '#0EA5E9',
  maroon: '#800000',
  crimson: '#DC143C',
  coral: '#FF7F50',
  gold: '#FFD700',
  silver: '#C0C0C0',
  brown: '#78350F',
  olive: '#84CC16',
  burgundy: '#800020',
  turquoise: '#06B6D4',
  fuchsia: '#FF00FF',
  aqua: '#06B6D4',
  beige: '#F5F5DC',
  khaki: '#F0E68C',
  plum: '#DDA0DD',
  salmon: '#FA8072',
  charcoal: '#334155',
  slate: '#64748B',
  // Neon variants
  'neon green': '#00FF00',
  'neon yellow': '#FFFF00',
  'neon blue': '#00FFFF',
  'neon pink': '#FF007F',
  'neon orange': '#FF5F00',
  'neon purple': '#B026FF',
  'electric yellow': '#FFFF00',
  'electric magenta': '#FF00FF',
  'electric blue': '#00FBFF',
  'harsh yellow': '#FFFF00',
  // Modifiers & brand composites
  'dark red': '#991B1B',
  'light red': '#FCA5A5',
  'dark blue': '#1E3A8A',
  'light blue': '#93C5FD',
  'deep blue': '#1D4ED8',
  'deep navy': '#1E1B4B',
  'dark green': '#14532D',
  'light green': '#86EFAC',
  'forest green': '#166534',
  'royal blue': '#2563EB',
  'primary indigo': '#4F46E5',
  'accent violet': '#7C3AED',
  'slate dark': '#0F172A',
};

function resolveColorToHex(input: string): string | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  // 1. Direct hex match
  const hexMatch = clean.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) return clean.toUpperCase();

  // 2. Direct dictionary lookup
  if (STANDARD_COLOR_MAP[clean]) {
    return STANDARD_COLOR_MAP[clean];
  }

  // 3. Normalized stripped lookup
  const stripped = clean.replace(/[-_\s]+/g, ' ');
  if (STANDARD_COLOR_MAP[stripped]) {
    return STANDARD_COLOR_MAP[stripped];
  }

  // 4. Browser native CSS color resolution (works for all 148 standard SVG/CSS color names)
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = clean;
        ctx.fillRect(0, 0, 1, 1);
        const p = ctx.getImageData(0, 0, 1, 1).data;
        // Verify that the color actually changed canvas from black (or test with another fill)
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = clean;
        ctx.fillRect(0, 0, 1, 1);
        const p2 = ctx.getImageData(0, 0, 1, 1).data;
        if (p2[3] > 0) {
          const r = p2[0].toString(16).padStart(2, '0');
          const g = p2[1].toString(16).padStart(2, '0');
          const b = p2[2].toString(16).padStart(2, '0');
          return `#${r}${g}${b}`.toUpperCase();
        }
      }
    } catch {}
  }

  return null;
}

function annotateInvalidHexInText(text: string): string {
  if (!text) return '';
  return text.replace(/(?:\/\*\s*\[INVALID HEX:\s*([^\]]+?)\s*skipped\]\s*\*\/)|(#([A-Za-z0-9]+))/g, (fullMatch, existingComment, hexMatch, hexDigits) => {
    if (existingComment) {
      return fullMatch;
    }
    if (hexDigits && (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hexDigits))) {
      return fullMatch;
    }
    return `/* [INVALID HEX: ${hexMatch} skipped] */`;
  });
}

export default function GuidelinesDirectoryPage() {
  const [guidelines, setGuidelines] = useState<GuidelineItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedDetail, setSelectedDetail] = useState<GuidelineDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showRawSource, setShowRawSource] = useState(false);

  // Brand Policy Studio State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderTab, setBuilderTab] = useState<'form' | 'document'>('form');
  const [builderSubmitting, setBuilderSubmitting] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [builderSuccess, setBuilderSuccess] = useState<string | null>(null);

  // Policy Identity
  const [policyTitle, setPolicyTitle] = useState('Enterprise Brand Governance Policy');
  const [policyVersion, setPolicyVersion] = useState('1.0');
  const [policyDescription, setPolicyDescription] = useState('Corporate brand governance standards for marketing copy and visual creatives.');

  // Color Governance (Wanted / Approved) - Clean initial state
  const [approvedColors, setApprovedColors] = useState<{ hex: string; name: string }[]>([]);
  const [approvedRanges, setApprovedRanges] = useState<ColorRangeItem[]>([]);
  const [newColorHex, setNewColorHex] = useState('#4F46E5');
  const [newColorName, setNewColorName] = useState('');

  // Prohibited Colors (Unwanted) - Clean initial state
  const [prohibitedColors, setProhibitedColors] = useState<{ hex: string; name: string }[]>([]);
  const [prohibitedRanges, setProhibitedRanges] = useState<ColorRangeItem[]>([]);
  const [newProhibitHex, setNewProhibitHex] = useState('#EF4444');
  const [newProhibitName, setNewProhibitName] = useState('');

  // Custom Color Range / Shade Spectrum state
  const [customRangeTarget, setCustomRangeTarget] = useState<'approved' | 'prohibited' | null>(null);
  const [customRangeBase, setCustomRangeBase] = useState('#3B82F6');
  const [customRangeTolerance, setCustomRangeTolerance] = useState(25);
  const [customRangeName, setCustomRangeName] = useState('');

  // 3-Option Governance Modes: 'approved' | 'prohibited' | 'tiered'
  // Option 1) Approved Only (Strict Allowlist: everything outside is prohibited)
  // Option 2) Prohibited Only (Strict Blocklist: everything outside is approved)
  // Option 3) Preferred & Not Preferred (Tiered: unlisted items are neutral)
  const [colorMode, setColorMode] = useState<'approved' | 'prohibited' | 'tiered'>('tiered');
  const [companyMode, setCompanyMode] = useState<'approved' | 'prohibited' | 'tiered'>('tiered');
  const [personMode, setPersonMode] = useState<'approved' | 'prohibited' | 'tiered'>('tiered');
  const [symbolMode, setSymbolMode] = useState<'approved' | 'prohibited' | 'tiered'>('prohibited');
  const [toneMode, setToneMode] = useState<'approved' | 'prohibited' | 'tiered'>('tiered');

  // Standards Baseline
  const [includeStandardRules, setIncludeStandardRules] = useState(false);

  // 1. Brand Voice & Tone Governance
  const [preferredTones, setPreferredTones] = useState<string[]>([
    'Professional & Authoritative',
    'Objective & Data-Backed',
  ]);
  const [prohibitedTones, setProhibitedTones] = useState<string[]>([]);

  // 2. Prohibited Symbols & Punctuation
  const [prohibitedSymbols, setProhibitedSymbols] = useState<string[]>([]);
  const [customSymbolInput, setCustomSymbolInput] = useState('');

  // 3. Company & Brand Governance (Approved Partners vs Prohibited Competitors)
  const [approvedCompanies, setApprovedCompanies] = useState<string[]>([]);
  const [newApprovedCompany, setNewApprovedCompany] = useState('');
  const [prohibitedCompanies, setProhibitedCompanies] = useState<string[]>([]);
  const [newProhibitedCompany, setNewProhibitedCompany] = useState('');

  // 4. Person & Entity Governance (Approved Spokespersons vs Prohibited Names)
  const [approvedPersons, setApprovedPersons] = useState<string[]>([]);
  const [newApprovedPerson, setNewApprovedPerson] = useState('');
  const [prohibitedPersons, setProhibitedPersons] = useState<string[]>([]);
  const [newProhibitedPerson, setNewProhibitedPerson] = useState('');

  // 5. Prohibited Vocabulary & Banned Words
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');

  // 6. Legal Disclaimers & Absolute Claims
  const [requireTermsDisclaimer, setRequireTermsDisclaimer] = useState(false);
  const [prohibitGuarantees, setProhibitGuarantees] = useState(false);

  // Custom Raw Document Text
  const [rawDocumentContent, setRawDocumentContent] = useState('');

  // Helper toggle handlers for standard chips
  const togglePreferredTone = (tone: string) => {
    setPreferredTones(prev =>
      prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone]
    );
  };

  const toggleProhibitedTone = (tone: string) => {
    setProhibitedTones(prev =>
      prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone]
    );
  };

  const toggleProhibitedSymbol = (symbol: string) => {
    setProhibitedSymbols(prev =>
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  const addCustomSymbol = () => {
    const sym = customSymbolInput.trim();
    if (sym && !prohibitedSymbols.includes(sym)) {
      setProhibitedSymbols(prev => [...prev, sym]);
      setCustomSymbolInput('');
    }
  };

  const addApprovedCompany = () => {
    const c = newApprovedCompany.trim();
    if (c && !approvedCompanies.includes(c)) {
      setApprovedCompanies(prev => [...prev, c]);
      setNewApprovedCompany('');
    }
  };
  const removeApprovedCompany = (item: string) => {
    setApprovedCompanies(prev => prev.filter(c => c !== item));
  };

  const addProhibitedCompany = () => {
    const c = newProhibitedCompany.trim();
    if (c && !prohibitedCompanies.includes(c)) {
      setProhibitedCompanies(prev => [...prev, c]);
      setNewProhibitedCompany('');
    }
  };
  const removeProhibitedCompany = (item: string) => {
    setProhibitedCompanies(prev => prev.filter(c => c !== item));
  };

  const addApprovedPerson = () => {
    const p = newApprovedPerson.trim();
    if (p && !approvedPersons.includes(p)) {
      setApprovedPersons(prev => [...prev, p]);
      setNewApprovedPerson('');
    }
  };
  const removeApprovedPerson = (item: string) => {
    setApprovedPersons(prev => prev.filter(p => p !== item));
  };

  const addProhibitedPerson = () => {
    const p = newProhibitedPerson.trim();
    if (p && !prohibitedPersons.includes(p)) {
      setProhibitedPersons(prev => [...prev, p]);
      setNewProhibitedPerson('');
    }
  };
  const removeProhibitedPerson = (item: string) => {
    setProhibitedPersons(prev => prev.filter(p => p !== item));
  };

  const addApprovedRange = (item: ColorRangeItem) => {
    if (!approvedRanges.some(r => r.id === item.id)) {
      setApprovedRanges(prev => [...prev, item]);
    }
  };
  const removeApprovedRange = (id: string) => {
    setApprovedRanges(prev => prev.filter(r => r.id !== id));
  };

  const addProhibitedRange = (item: ColorRangeItem) => {
    if (!prohibitedRanges.some(r => r.id === item.id)) {
      setProhibitedRanges(prev => [...prev, item]);
    }
  };
  const removeProhibitedRange = (id: string) => {
    setProhibitedRanges(prev => prev.filter(r => r.id !== id));
  };

  const addCustomRange = (target: 'approved' | 'prohibited') => {
    const rgb = parseHexToRgb(customRangeBase);
    const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    const hRound = Math.round(h);
    const hueMin = Math.round((hRound - customRangeTolerance + 360) % 360);
    const hueMax = Math.round((hRound + customRangeTolerance) % 360);
    const name = customRangeName.trim() || `Custom Shade (${customRangeBase} ±${customRangeTolerance}°)`;
    const customItem: ColorRangeItem = {
      id: `custom_${Date.now()}`,
      name,
      family: 'custom',
      hueMin,
      hueMax,
      desc: `Hue range ${hueMin}°–${hueMax}° around ${customRangeBase}`,
      gradient: `linear-gradient(to right, hsl(${hueMin}, 75%, 65%), ${customRangeBase}, hsl(${hueMax}, 75%, 35%))`
    };

    if (target === 'approved') {
      setApprovedRanges(prev => [...prev, customItem]);
    } else {
      setProhibitedRanges(prev => [...prev, customItem]);
    }
    setCustomRangeTarget(null);
    setCustomRangeName('');
  };

  const getCustomSpectrumPreview = () => {
    const rgb = parseHexToRgb(customRangeBase);
    const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max !== min) {
      const d = max - min;
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    const hRound = Math.round(h);
    const hueMin = Math.round((hRound - customRangeTolerance + 360) % 360);
    const hueMax = Math.round((hRound + customRangeTolerance) % 360);
    return {
      hue: hRound,
      hueMin,
      hueMax,
      gradient: `linear-gradient(to right, hsl(${hueMin}, 75%, 65%), ${customRangeBase}, hsl(${hueMax}, 75%, 35%))`
    };
  };

  // 1. Fetch guideline list
  useEffect(() => {
    fetch(`${API_BASE}/api/guidelines`)
      .then(res => res.ok ? res.json() : [])
      .then((data: GuidelineItem[]) => {
        // Also check if localStorage has newly uploaded guideline
        let combined = [...data];
        try {
          const stored = localStorage.getItem('active_guideline_rules');
          if (stored) {
            const parsedStored = JSON.parse(stored);
            if (parsedStored?.id && !combined.some(g => g.id === parsedStored.id)) {
              combined.unshift({
                id: parsedStored.id,
                filename: parsedStored.filename || 'Custom Brand Guideline',
                uploaded_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
              });
            }
          }
        } catch {}

        // Add default sample guideline if list is empty
        if (combined.length === 0) {
          combined = [
            {
              id: 'demo-sample-default',
              filename: 'Demo Brand Guideline (Sample).txt',
              uploaded_at: '2026-11-23 10:00:00',
            },
          ];
        }

        setGuidelines(combined);
        if (combined.length > 0) {
          setSelectedId(combined[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        const fallback = [
          {
            id: 'demo-sample-default',
            filename: 'Demo Brand Guideline (Sample).txt',
            uploaded_at: '2026-11-23 10:00:00',
          },
        ];
        setGuidelines(fallback);
        setSelectedId(fallback[0].id);
        setLoading(false);
      });
  }, []);

  // 2. Fetch or compute detail when selectedId changes
  useEffect(() => {
    if (!selectedId) return;

    setDetailLoading(true);

    fetch(`${API_BASE}/api/guidelines/${selectedId}`)
      .then(res => res.ok ? res.json() : null)
      .then((detail: GuidelineDetail | null) => {
        if (detail && detail.rules && detail.rules.length > 0) {
          setSelectedDetail(detail);
          setDetailLoading(false);
        } else {
          loadFallbackDetail(selectedId);
        }
      })
      .catch(() => {
        loadFallbackDetail(selectedId);
      });
  }, [selectedId, guidelines]);

  const loadFallbackDetail = (id: string) => {
    const item = guidelines.find(g => g.id === id);
    const filename = item ? item.filename : 'Brand Guideline Document';

    try {
      const stored = localStorage.getItem('active_guideline_rules');
      if (stored) {
        const parsedStored = JSON.parse(stored);
        if (parsedStored.id === id || parsedStored.filename === filename) {
          setSelectedDetail({
            id,
            filename,
            uploaded_at: item?.uploaded_at || 'Recently Ingested',
            rules_count: parsedStored.rules?.length || 6,
            rules: parsedStored.rules || DEFAULT_TECHCORP_RULES,
            content_preview: 'Custom uploaded brand guideline rules parsed and active.',
          });
          setDetailLoading(false);
          return;
        }
      }
    } catch {}

    setSelectedDetail({
      id,
      filename,
      uploaded_at: item?.uploaded_at || 'Default Guideline',
      rules_count: DEFAULT_TECHCORP_RULES.length,
      rules: DEFAULT_TECHCORP_RULES,
      content_preview: 'Standard TechCorp enterprise governance specifications covering Sections 1–12.',
    });
    setDetailLoading(false);
  };

  const compileFormToDocumentText = () => {
    const lines: string[] = [];
    lines.push(`${policyTitle.toUpperCase()} — BRAND GOVERNANCE SPECIFICATION`);
    lines.push(`Specification Version: ${policyVersion || '1.0'}`);
    lines.push(`Generated: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`);
    lines.push('------------------------------------------------------------');

    if (policyDescription.trim()) {
      lines.push(`\n1. EXECUTIVE POLICY OVERVIEW\n${policyDescription.trim()}`);
    }

    let ruleNum = 1;
    const rulesList: string[] = [];

    // Standard Governance Baseline
    if (includeStandardRules) {
      rulesList.push(`${ruleNum}. Maintain minimum ISO/IEC 40500 WCAG 2.1 Level AA text contrast ratio (4.5:1 minimum).`);
      ruleNum++;
    }

    // 1. Brand Voice & Tone Governance
    if (toneMode === 'approved' && preferredTones.length > 0) {
      rulesList.push(`${ruleNum}. Brand Voice & Tone (Strict Allowlist): Primary voice must remain ${preferredTones.join(', ')}. All other tones are strictly prohibited.`);
      ruleNum++;
    } else if (toneMode === 'prohibited' && prohibitedTones.length > 0) {
      rulesList.push(`${ruleNum}. Prohibited Tones (Strict Blocklist): Marketing copy must not use ${prohibitedTones.join(', ')} tone.`);
      ruleNum++;
    } else {
      if (preferredTones.length > 0) {
        rulesList.push(`${ruleNum}. Brand Voice & Tone: Approved primary voice must remain ${preferredTones.join(', ')}.`);
        ruleNum++;
      }
      if (prohibitedTones.length > 0) {
        rulesList.push(`${ruleNum}. Prohibited Tones: Marketing copy must not use ${prohibitedTones.join(', ')} tone. Unlisted tones are considered neutral.`);
        ruleNum++;
      }
    }

    // 2. Prohibited Symbols & Punctuation
    if (prohibitedSymbols.length > 0) {
      const symList = prohibitedSymbols.map(s => s === 'Emoji' ? 'Emojis' : `'${s}'`).join(', ');
      if (symbolMode === 'approved') {
        rulesList.push(`${ruleNum}. Approved Symbols & Punctuation (Strict Allowlist): Only ${symList} permitted. All other symbols are strictly prohibited.`);
      } else {
        rulesList.push(`${ruleNum}. Prohibited Symbols & Punctuation (Strict Blocklist): Use of ${symList} is strictly prohibited in marketing copy. Standard punctuation is permitted.`);
      }
      ruleNum++;
    }

    // 3. Prohibited Vocabulary & Banned Words
    if (bannedWords.length > 0) {
      rulesList.push(`${ruleNum}. Prohibited Vocabulary: Banned terms ${bannedWords.map(w => `'${w}'`).join(', ')} must not appear in marketing claims.`);
      ruleNum++;
    }

    // 4. Company & Brand Governance
    if (companyMode === 'approved' && approvedCompanies.length > 0) {
      rulesList.push(`${ruleNum}. Approved Brand Partners & Collaborations (Strict Allowlist): Marketing copy may only reference authorized partners: ${approvedCompanies.join(', ')}. All other external company or competitor mentions are strictly prohibited.`);
      ruleNum++;
    } else if (companyMode === 'prohibited' && prohibitedCompanies.length > 0) {
      rulesList.push(`${ruleNum}. Prohibited Competitor Brands (Strict Blocklist): Mentions of competitor companies: ${prohibitedCompanies.join(', ')} are strictly prohibited. Non-competitor brands are permitted.`);
      ruleNum++;
    } else {
      if (approvedCompanies.length > 0 && prohibitedCompanies.length > 0) {
        rulesList.push(`${ruleNum}. Company Governance (Preferred & Not Preferred): Preferred partners: ${approvedCompanies.join(', ')}. Prohibited competitors: ${prohibitedCompanies.join(', ')}. Unlisted companies are considered neutral.`);
        ruleNum++;
      } else {
        if (approvedCompanies.length > 0) {
          rulesList.push(`${ruleNum}. Approved Brand Partners & Collaborations: Marketing copy may reference authorized partners: ${approvedCompanies.join(', ')}.`);
          ruleNum++;
        }
        if (prohibitedCompanies.length > 0) {
          rulesList.push(`${ruleNum}. Prohibited Competitor Brands: Mentions of competitor companies: ${prohibitedCompanies.join(', ')} are strictly prohibited.`);
          ruleNum++;
        }
      }
    }

    // 5. Person & Entity Governance
    if (personMode === 'approved' && approvedPersons.length > 0) {
      rulesList.push(`${ruleNum}. Approved Brand Spokespersons (Strict Allowlist): Only authorized brand ambassadors and leadership: ${approvedPersons.join(', ')} may be mentioned. Names of any other individual persons are strictly prohibited.`);
      ruleNum++;
    } else if (personMode === 'prohibited' && prohibitedPersons.length > 0) {
      rulesList.push(`${ruleNum}. Prohibited Person Names (Strict Blocklist): Unauthorized individual person names: ${prohibitedPersons.join(', ')} must not be mentioned in marketing copy.`);
      ruleNum++;
    } else {
      if (approvedPersons.length > 0 && prohibitedPersons.length > 0) {
        rulesList.push(`${ruleNum}. Entity Governance (Preferred & Not Preferred): Preferred ambassadors: ${approvedPersons.join(', ')}. Prohibited persons: ${prohibitedPersons.join(', ')}. Unlisted names are considered neutral.`);
        ruleNum++;
      } else {
        if (approvedPersons.length > 0) {
          rulesList.push(`${ruleNum}. Approved Brand Spokespersons: Authorized brand ambassadors and leadership: ${approvedPersons.join(', ')}.`);
          ruleNum++;
        }
        if (prohibitedPersons.length > 0) {
          rulesList.push(`${ruleNum}. Prohibited Person Names: Unauthorized person names: ${prohibitedPersons.join(', ')} must not be mentioned in marketing copy.`);
          ruleNum++;
        }
      }
    }

    // 6. Legal Disclaimers & Absolute Claims
    if (prohibitGuarantees) {
      rulesList.push(`${ruleNum}. Absolute Claims: Unsubstantiated guarantees and absolute promises are strictly prohibited.`);
      ruleNum++;
    }
    if (requireTermsDisclaimer) {
      rulesList.push(`${ruleNum}. Legal Disclaimers: All promotional claims must include mandatory "Terms and conditions apply" disclaimer.`);
      ruleNum++;
    }

    // 7. Visual & Color Governance
    const aNames = approvedColors.map(c => `${c.name} (${c.hex})`).join(', ');
    const aRangeNames = approvedRanges.map(r => `${r.name} (Hue range ${r.hueMin}°- ${r.hueMax}°)`).join(', ');
    const allApprovedDesc = [aRangeNames, aNames].filter(Boolean).join(' and ');

    const pNames = prohibitedColors.map(c => `${c.name} (${c.hex})`).join(', ');
    const pRangeNames = prohibitedRanges.map(r => `${r.name} (Hue range ${r.hueMin}°- ${r.hueMax}°)`).join(', ');
    const allProhibitedDesc = [pRangeNames, pNames].filter(Boolean).join(' and ');

    if (colorMode === 'approved' && allApprovedDesc) {
      rulesList.push(`${ruleNum}. Approved Brand Color Palette & Spectrums (Strict Allowlist): ${allApprovedDesc}. All other colors outside this approved palette and spectrums are strictly prohibited.`);
      ruleNum++;
    } else if (colorMode === 'prohibited' && allProhibitedDesc) {
      rulesList.push(`${ruleNum}. Prohibited Color Spectrum (Strict Blocklist): No ${allProhibitedDesc} should be used in posters or creative assets. All other colors outside this prohibited list are approved.`);
      ruleNum++;
    } else {
      if (allApprovedDesc && allProhibitedDesc) {
        rulesList.push(`${ruleNum}. Color Governance (Preferred & Not Preferred): Preferred brand colors & spectrums: ${allApprovedDesc}. Prohibited colors: ${allProhibitedDesc}. All other unlisted colors are considered neutral.`);
        ruleNum++;
      } else {
        if (allApprovedDesc) {
          rulesList.push(`${ruleNum}. Approved Brand Color Palette & Spectrums: ${allApprovedDesc}.`);
          ruleNum++;
        }
        if (allProhibitedDesc) {
          rulesList.push(`${ruleNum}. Prohibited Color Spectrum: No ${allProhibitedDesc} should be used in posters or creative assets.`);
          ruleNum++;
        }
      }
    }

    lines.push('\n2. ENFORCEABLE GOVERNANCE RULES');
    lines.push(...rulesList);

    return lines.join('\n');
  };

  // ─── Dynamic Guideline Text to Form Parser ────────────────────────────────
  const parseTextIntoFormState = (text: string) => {
    if (!text || !text.trim()) {
      setApprovedColors([]);
      setProhibitedColors([]);
      return;
    }

    const textClean = annotateInvalidHexInText(text);
    const textLower = textClean.toLowerCase();
    const lines = textClean.split(/\r?\n/);

    // 1. Color Extraction with Section Block Tracking
    const parsedApproved: { hex: string; name: string }[] = [];
    const parsedProhibited: { hex: string; name: string }[] = [];
    let currentSectionBlock: 'approved_colors' | 'prohibited_colors' | 'none' = 'none';

    lines.forEach(line => {
      const trimmed = line.trim();
      const lLower = trimmed.toLowerCase();

      // Heading detection to switch currentSectionBlock - supports both US "color" and UK "colour", as well as palette/swatches/hues/shades
      if (/(?:approved|official|primary|preferred|wanted)\s+(?:brand\s+)?colou?r|(?:brand\s+)?colou?r\s+(?:palette|swatches|hues|shades)|official\s+palette|12\.1\s+approved/i.test(lLower)) {
        currentSectionBlock = 'approved_colors';
      } else if (/(?:prohibited|banned|unwanted|avoid|forbidden|disallowed|restricted|no)\s+(?:background\s+|poster\s+|brand\s+)?colou?rs?|banned\s+colou?rs?|unwanted\s+colou?rs?|avoid\s+colou?rs?/i.test(lLower)) {
        currentSectionBlock = 'prohibited_colors';
      } else if (/^section\s+(?!12\b)\d+/i.test(trimmed) || /^appendix/i.test(trimmed)) {
        currentSectionBlock = 'none';
      }

      const isExplicitBanned = /prohibit|avoid|ban\b|banned|never|unwanted|disallow|forbid|restrict|no\s+/i.test(lLower);
      const isExplicitApproved = /approv|wanted|allow|restricted to|primary|permit|authoriz|prefer/i.test(lLower);

      const labeledMatch = trimmed.match(/^(?:[-*•]\s*)?([A-Za-z0-9\s&/-]+?)\s*:\s*(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b/);
      const banLabelMatch = trimmed.match(/^(?:[-*•]\s*)?([A-Za-z0-9\s&/-]+?)\s*\(/);
      const lineHexes = trimmed.match(/#([0-9a-fA-F]{6}|#[0-9a-fA-F]{3})\b/g) || [];

      lineHexes.forEach(h => {
        const cleanH = h.toUpperCase();
        let extractedLabel = '';
        if (labeledMatch && labeledMatch[2].toUpperCase() === cleanH) {
          extractedLabel = labeledMatch[1].replace(/^[-*•]\s*/, '').trim();
        } else if (banLabelMatch) {
          extractedLabel = banLabelMatch[1].replace(/^[-*•]\s*/, '').trim();
        }

        if (isExplicitBanned || currentSectionBlock === 'prohibited_colors') {
          if (!parsedProhibited.some(c => c.hex === cleanH)) {
            parsedProhibited.push({
              hex: cleanH,
              name: extractedLabel || (cleanH === '#FF0000' ? 'Saturated Red' : cleanH === '#00FF00' ? 'Neon Green' : cleanH === '#FF00FF' ? 'Fluorescent Magenta' : 'Banned Swatch')
            });
          }
        } else if (isExplicitApproved || currentSectionBlock === 'approved_colors') {
          if (!parsedApproved.some(c => c.hex === cleanH)) {
            parsedApproved.push({
              hex: cleanH,
              name: extractedLabel || (cleanH === '#1E1B4B' ? 'Deep Navy' : cleanH === '#4F46E5' ? 'Primary Brand Indigo' : cleanH === '#7C3AED' ? 'Accent Violet' : cleanH === '#1E293B' ? 'Slate Dark' : cleanH === '#F8FAFC' ? 'Surface Light' : 'Brand Swatch')
            });
          }
        }
      });

      // Named colors in prohibition context
      if (isExplicitBanned || currentSectionBlock === 'prohibited_colors') {
        ['neon green', 'electric yellow', 'red', 'yellow', 'blue', 'orange', 'pink'].forEach(col => {
          if (new RegExp(`\\b${col}\\b`, 'i').test(trimmed) && !lineHexes.length) {
            const hex = resolveColorToHex(col);
            if (hex && !parsedProhibited.some(c => c.hex === hex)) {
              parsedProhibited.push({ hex, name: col.replace(/\b\w/g, l => l.toUpperCase()) });
            }
          }
        });
      }
    });

    setProhibitedColors(parsedProhibited);
    setApprovedColors(parsedApproved);

    // 2.1 Color Spectrum / Shade Range Extraction
    const parsedProhibitedRanges: ColorRangeItem[] = [];
    const parsedApprovedRanges: ColorRangeItem[] = [];

    STANDARD_SHADE_RANGES.forEach(range => {
      const fam = range.family;
      const banRegex = new RegExp(`(?:no|not|prohibit\\w*|ban\\w*|avoid|disallow\\w*)\\s+[^.\\n]*?(?:all\\s+shades?\\s+of\\s+${fam}|whole\\s+shade\\s+of\\s+${fam}|entire\\s+${fam}\\s+(?:spectrum|range|family)|${fam}\\s+(?:spectrum|shades?|colou?rs?)|shades?\\s+of\\s+${fam})|(?:all\\s+shades?\\s+of\\s+${fam}|whole\\s+shade\\s+of\\s+${fam}|${fam}\\s+(?:spectrum|shades?|colou?rs?))\\s+[^.\\n]*?(?:prohibit\\w*|ban\\w*|not allowed|avoid|disallow\\w*)`, 'i');
      if (banRegex.test(textClean)) {
        if (!parsedProhibitedRanges.some(r => r.id === range.id)) {
          parsedProhibitedRanges.push(range);
        }
      }
      const appRegex = new RegExp(`(?:approved|wanted|allow\\w*|permitted|preferred)\\s+[^.\\n]*?(?:all\\s+shades?\\s+of\\s+${fam}|whole\\s+shade\\s+of\\s+${fam}|entire\\s+${fam}\\s+(?:spectrum|range|family)|${fam}\\s+(?:spectrum|shades?|colou?rs?)|shades?\\s+of\\s+${fam})|(?:all\\s+shades?\\s+of\\s+${fam}|whole\\s+shade\\s+of\\s+${fam}|${fam}\\s+(?:spectrum|shades?|colou?rs?))\\s+[^.\\n]*?(?:approved|allowed|permitted|wanted|preferred)`, 'i');
      if (appRegex.test(textClean)) {
        if (!parsedApprovedRanges.some(r => r.id === range.id)) {
          parsedApprovedRanges.push(range);
        }
      }
    });

    setProhibitedRanges(parsedProhibitedRanges);
    setApprovedRanges(parsedApprovedRanges);

    // 3. Prohibited Symbols & Punctuation (Context-Aware to prevent false bans on '%', '#', '@')
    const parsedSymbols: string[] = [];
    if (/(?:no\s+multiple\s+question|question\s+mark\s+is\s+prohibited|no\s+question|ban\w*\s+question|avoid\s+question)/i.test(textClean)) {
      parsedSymbols.push('?');
    }
    if (/(?:no\s+multiple\s+exclamation|exclamation\s+mark\s+is\s+prohibited|no\s+exclamation|ban\w*\s+exclamation|avoid\s+exclamation|maximum\s+one\s+exclamation)/i.test(textClean)) {
      parsedSymbols.push('!');
    }
    if (/(?:prohibit\w*|ban\w*|never\s+use|avoid|disallow\w*)\s+[^.\n]*?(?:percent(?:age)?|\s+%\b)/i.test(textClean)) {
      parsedSymbols.push('%');
    }
    if (/(?:prohibit\w*|ban\w*|never\s+use|avoid|disallow\w*)\s+[^.\n]*?(?:currency|dollar|\s+\$\b)/i.test(textClean)) {
      parsedSymbols.push('$');
    }
    if (/(?:prohibit\w*|ban\w*|never\s+use|avoid|disallow\w*)\s+[^.\n]*?(?:hashtag|\s+#\s)/i.test(textClean)) {
      parsedSymbols.push('#');
    }
    if (/(?:prohibit\w*|ban\w*|never\s+use|avoid|disallow\w*)\s+[^.\n]*?(?:asterisk|\s+\*\b)/i.test(textClean)) {
      parsedSymbols.push('*');
    }
    if (/(?:prohibit\w*|ban\w*|never\s+use|avoid|disallow\w*)\s+[^.\n]*?(?:mention|social\s+handle|\s+@\s)/i.test(textClean)) {
      parsedSymbols.push('@');
    }
    if (/(?:prohibit\w*|ban\w*|never\s+use|avoid|no)\s+[^.\n]*?emoji/i.test(textClean)) {
      parsedSymbols.push('Emoji');
    }
    setProhibitedSymbols(parsedSymbols);

    // Auto-detect governance modes
    const hasApprovedColors = parsedApproved.length > 0 || parsedApprovedRanges.length > 0;
    const hasBannedColors = parsedProhibited.length > 0 || parsedProhibitedRanges.length > 0;
    if (textLower.includes('strict allowlist') || (hasApprovedColors && !hasBannedColors)) {
      setColorMode('approved');
    } else if (textLower.includes('strict blocklist') || (hasBannedColors && !hasApprovedColors)) {
      setColorMode('prohibited');
    } else {
      setColorMode('tiered');
    }

    setSymbolMode(parsedSymbols.length > 0 ? 'prohibited' : 'tiered');

    // 4. Tone Governance
    const parsedProhibitedTones: string[] = [];
    if (textLower.includes('exclam') || textLower.includes('exclai') || textLower.includes('hype') || textLower.includes('aggressive')) {
      parsedProhibitedTones.push('Aggressive / High-Pressure');
    }
    if (textLower.includes('question') || textLower.includes('uncertain')) {
      parsedProhibitedTones.push('Uncertain / Questioning');
    }
    if (textLower.includes('slang') || textLower.includes('casual')) {
      parsedProhibitedTones.push('Casual / Slang');
    }
    if (textLower.includes('sensational') || textLower.includes('clickbait')) {
      parsedProhibitedTones.push('Sensationalist / Clickbait');
    }
    if (textLower.includes('sarcas') || textLower.includes('humor')) {
      parsedProhibitedTones.push('Sarcastic / Humorous');
    }
    if (textLower.includes('informal') || textLower.includes('colloquial')) {
      parsedProhibitedTones.push('Informal / Colloquial');
    }
    if (textLower.includes('superlative') || textLower.includes('unsubstantiated')) {
      parsedProhibitedTones.push('Unsubstantiated / Superlative');
    }
    setProhibitedTones(parsedProhibitedTones);

    const parsedPreferredTones: string[] = [];
    if (textLower.includes('objective') || textLower.includes('data-backed') || textLower.includes('data backed')) {
      parsedPreferredTones.push('Objective & Data-Backed');
    }
    if (textLower.includes('professional') || textLower.includes('authoritative')) {
      parsedPreferredTones.push('Professional & Authoritative');
    }
    if (textLower.includes('empath') || textLower.includes('customer-centric')) {
      parsedPreferredTones.push('Empathetic & Customer-Centric');
    }
    if (textLower.includes('clear') || textLower.includes('transparent')) {
      parsedPreferredTones.push('Clear & Transparent');
    }
    if (textLower.includes('inspir') || textLower.includes('purpose-driven')) {
      parsedPreferredTones.push('Inspiring & Purpose-Driven');
    }
    if (parsedPreferredTones.length === 0) {
      parsedPreferredTones.push('Professional & Authoritative');
    }
    setPreferredTones(parsedPreferredTones);

    // 5. Company & Brand Governance
    const parsedApprovedCompanies: string[] = [];
    const parsedProhibitedCompanies: string[] = [];

    const partnerMatch = textClean.match(/(?:partner|collaborat\w*|sponsor\w*)[^.\n]*?(?:such as|including|namely|:|is|are)\s*([A-Za-z0-9\s,]+?)(?:[.\n]|$)/i);
    if (partnerMatch && partnerMatch[1]) {
      partnerMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(c => {
        if (!parsedApprovedCompanies.includes(c)) parsedApprovedCompanies.push(c);
      });
    }

    const compMatch = textClean.match(/(?:competitor|other company|rivals?)[^.\n]*?(?:such as|including|namely|:|is)\s*([A-Za-z0-9\s,]+?)(?:[.\n]|$)/i);
    if (compMatch && compMatch[1]) {
      compMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(c => {
        if (!parsedProhibitedCompanies.includes(c)) parsedProhibitedCompanies.push(c);
      });
    } else if (textLower.includes('competitor') || textLower.includes('other company') || textLower.includes('rival')) {
      parsedProhibitedCompanies.push('Direct competitors and rival brands');
    }
    setApprovedCompanies(parsedApprovedCompanies);
    setProhibitedCompanies(parsedProhibitedCompanies);

    // 6. Person & Entity Governance
    const parsedApprovedPersons: string[] = [];
    const parsedProhibitedPersons: string[] = [];

    const entityMatch = textClean.match(/(?:brand ambassador|ambassador|spokesperson|spokespersons?|endorser)[^.\n]*?(?:which is|:|is|are)\s*([A-Za-z\s,]+?)(?:[.,\n]|$)/i);
    if (entityMatch && entityMatch[1]) {
      entityMatch[1].split(',').map(s => s.trim()).filter(Boolean).forEach(p => {
        if (!parsedApprovedPersons.includes(p)) parsedApprovedPersons.push(p);
      });
    }

    if (
      textLower.includes('name of any person') ||
      textLower.includes('person name') ||
      textLower.includes('individual name') ||
      textLower.includes('celebrity')
    ) {
      parsedProhibitedPersons.push('All unapproved individual person names');
    }
    setApprovedPersons(parsedApprovedPersons);
    setProhibitedPersons(parsedProhibitedPersons);

    // 6. Prohibited Vocabulary & Banned Words
    const extractedWords: string[] = [];
    if (textLower.includes('100%')) {
      extractedWords.push('100%');
    }
    if (textLower.includes('guarantee')) {
      extractedWords.push('guarantee');
    }
    const quoteMatches = textClean.matchAll(/['"]([^'"]+?)['"]/g);
    for (const q of quoteMatches) {
      const w = q[1].trim();
      if (w.length > 1 && !extractedWords.includes(w) && !STANDARD_COLOR_MAP[w.toLowerCase()]) {
        extractedWords.push(w);
      }
    }
    setBannedWords(extractedWords);

    // 7. Legal Disclaimers & Guarantees
    setRequireTermsDisclaimer(textLower.includes('terms and conditions') || textLower.includes('terms disclaimer'));
    setProhibitGuarantees(textLower.includes('guarantee'));

    // Auto-detect 3-Option Governance Modes: 'approved' | 'prohibited' | 'tiered'
    const hasAnyApprovedColor = parsedApproved.length > 0 || parsedApprovedRanges.length > 0;
    const hasAnyBannedColor = parsedProhibited.length > 0 || parsedProhibitedRanges.length > 0;

    if (textLower.includes('strict allowlist') || (hasAnyApprovedColor && !hasAnyBannedColor)) {
      setColorMode('approved');
    } else if (textLower.includes('strict blocklist') || (hasAnyBannedColor && !hasAnyApprovedColor)) {
      setColorMode('prohibited');
    } else {
      setColorMode('tiered');
    }

    if (textLower.includes('strict allowlist') || (parsedApprovedCompanies.length > 0 && parsedProhibitedCompanies.length === 0)) {
      setCompanyMode('approved');
    } else if (textLower.includes('strict blocklist') || (parsedProhibitedCompanies.length > 0 && parsedApprovedCompanies.length === 0)) {
      setCompanyMode('prohibited');
    } else {
      setCompanyMode('tiered');
    }

    if (textLower.includes('strict allowlist') || (parsedApprovedPersons.length > 0 && parsedProhibitedPersons.length === 0)) {
      setPersonMode('approved');
    } else if (textLower.includes('strict blocklist') || (parsedProhibitedPersons.length > 0 && parsedApprovedPersons.length === 0)) {
      setPersonMode('prohibited');
    } else {
      setPersonMode('tiered');
    }

    setSymbolMode(textLower.includes('strict allowlist') ? 'approved' : 'prohibited');
    setToneMode(parsedPreferredTones.length > 0 && parsedProhibitedTones.length > 0 ? 'tiered' : parsedPreferredTones.length > 0 ? 'approved' : 'prohibited');

    const hasStandardSection =
      textLower.includes('section 1') ||
      textLower.includes('wcag 2.1') ||
      textLower.includes('iso/iec 40500');
    setIncludeStandardRules(hasStandardSection);
  };

  const handleOpenBuilder = (existing?: GuidelineDetail) => {
    setBuilderError(null);
    setBuilderSuccess(null);
    if (existing) {
      const rawName = existing.filename.replace(/\.[^/.]+$/, "");
      const versionMatch = rawName.match(/_v?(\d+(?:\.\d+)?)$/i);
      let nextVersion = '1.1';
      let cleanTitle = rawName;
      if (versionMatch) {
        const vNum = parseFloat(versionMatch[1]);
        nextVersion = (vNum + 0.1).toFixed(1);
        cleanTitle = rawName.slice(0, versionMatch.index);
      }
      setPolicyTitle(cleanTitle.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      setPolicyVersion(nextVersion);
      setPolicyDescription(`Version ${nextVersion} updated from ${existing.filename}.`);

      let content = existing.full_content || '';
      if (!content.trim() && existing.rules && existing.rules.length > 0) {
        content = existing.rules.map((r, i) => `${i + 1}. ${r.rule}`).join('\n');
      }
      if (!content.trim() && existing.content_preview) {
        content = existing.content_preview;
      }

      const annotated = annotateInvalidHexInText(content);
      setRawDocumentContent(annotated);
      // Automatically parse the file content into Visual Form state
      parseTextIntoFormState(annotated);
      setBuilderTab('form');
    } else {
      setPolicyTitle('Enterprise Brand Governance Policy');
      setPolicyVersion('1.0');
      setPolicyDescription('Official corporate brand identity, copy compliance, and creative asset governance policy.');
      setIncludeStandardRules(false);
      setPreferredTones(['Professional & Authoritative', 'Objective & Data-Backed']);
      setProhibitedTones([]);
      setProhibitedSymbols([]);
      setApprovedCompanies([]);
      setProhibitedCompanies([]);
      setApprovedPersons([]);
      setProhibitedPersons([]);
      setRequireTermsDisclaimer(false);
      setProhibitGuarantees(false);
      setApprovedColors([]);
      setApprovedRanges([]);
      setProhibitedColors([]);
      setProhibitedRanges([]);
      setCustomRangeTarget(null);
      setBannedWords([]);
      setBuilderTab('form');
      setRawDocumentContent('');
    }
    setIsBuilderOpen(true);
  };

  const addApprovedColor = () => {
    const rawName = newColorName.trim();
    let hex = newColorHex;
    let name = rawName;

    if (rawName) {
      const resolved = resolveColorToHex(rawName);
      if (resolved) {
        hex = resolved;
        setNewColorHex(resolved);
      }
    }
    if (!hex) return;
    if (!name) {
      name = `Color ${hex.toUpperCase()}`;
    }

    setApprovedColors(prev => [...prev, { hex, name }]);
    setNewColorName('');
  };

  const removeApprovedColor = (index: number) => {
    setApprovedColors(prev => prev.filter((_, i) => i !== index));
  };

  const addProhibitedColor = () => {
    const rawName = newProhibitName.trim();
    let hex = newProhibitHex;
    let name = rawName;

    if (rawName) {
      const resolved = resolveColorToHex(rawName);
      if (resolved) {
        hex = resolved;
        setNewProhibitHex(resolved);
      }
    }
    if (!hex) return;
    if (!name) {
      name = `Prohibited ${hex.toUpperCase()}`;
    }

    setProhibitedColors(prev => [...prev, { hex, name }]);
    setNewProhibitName('');
  };

  const removeProhibitedColor = (index: number) => {
    setProhibitedColors(prev => prev.filter((_, i) => i !== index));
  };

  const addBannedWord = () => {
    if (!newWord.trim()) return;
    const clean = newWord.trim().toLowerCase();
    if (!bannedWords.includes(clean)) {
      setBannedWords(prev => [...prev, clean]);
    }
    setNewWord('');
  };

  const removeBannedWord = (word: string) => {
    setBannedWords(prev => prev.filter(w => w !== word));
  };

  const mergeVisualRulesIntoDocument = (originalText: string): string => {
    const aNames = approvedColors.map(c => `- ${c.name}: ${c.hex}`).join('\n');
    const aRangeNames = approvedRanges.map(r => `- ${r.name} (Hue ${r.hueMin}°–${r.hueMax}°)`).join('\n');
    const allApproved = [aNames, aRangeNames].filter(Boolean).join('\n');

    const pNames = prohibitedColors.map(c => `- ${c.name}: ${c.hex}`).join('\n');
    const pRangeNames = prohibitedRanges.map(r => `- ${r.name} (Hue ${r.hueMin}°–${r.hueMax}°)`).join('\n');
    const allProhibited = [pNames, pRangeNames].filter(Boolean).join('\n');

    let modeDesc = '';
    if (colorMode === 'approved') {
      modeDesc = 'Restricted to approved brand colors (Strict Allowlist). All unlisted colors are prohibited.';
    } else if (colorMode === 'prohibited') {
      modeDesc = 'Prohibited poster colors & shade spectrums (Strict Blocklist). All unlisted colors are approved.';
    } else {
      modeDesc = 'Preferred colors are approved, prohibited shades are banned, and unlisted colors are considered neutral.';
    }

    const updatedVisualBlock = [
      `SECTION 12: VISUAL BRAND & ASSET GUIDELINES (Updated v${policyVersion})`,
      `-------------------------------------------`,
      ``,
      `12.1 Approved Brand Color Palette & Governance (${colorMode.toUpperCase()} MODE)`,
      modeDesc,
      ``,
      `Approved Brand Palette (Wanted):`,
      allApproved || '- None specified',
      ``,
      `Prohibited Background & Poster Colors (Unwanted):`,
      allProhibited || '- None specified',
      ``,
      `12.2 Accessibility & WCAG Contrast Standards`,
      `- Text overlaid on image backgrounds MUST meet ISO/IEC 40500 WCAG 2.1 AA accessibility standards (minimum 4.5:1 contrast ratio).`,
    ].join('\n');

    const sec12Match = originalText.match(/(?:SECTION\s+12[^\n]*\n[-=\s]*\n|(?:12\.1\s+)?(?:approved\s+)?brand\s+colou?r\s+palette|visual\s+brand\s+&\s+asset)/i);
    if (sec12Match && sec12Match.index !== undefined) {
      const afterMatch = originalText.slice(sec12Match.index).search(/\n\s*(?:APPENDIX|SECTION\s+13)/i);
      if (afterMatch !== -1) {
        const prefix = originalText.slice(0, sec12Match.index);
        const suffix = originalText.slice(sec12Match.index + afterMatch);
        return `${prefix.trimEnd()}\n\n${updatedVisualBlock}\n\n${suffix.trimStart()}`;
      } else {
        const prefix = originalText.slice(0, sec12Match.index);
        return `${prefix.trimEnd()}\n\n${updatedVisualBlock}\n`;
      }
    }

    return `${originalText.trimEnd()}\n\n---\n\n${updatedVisualBlock}\n`;
  };

  const handleSavePolicy = async () => {
    if (!policyTitle.trim()) {
      setBuilderError('Please provide a policy title');
      return;
    }
    setBuilderSubmitting(true);
    setBuilderError(null);

    let finalContent = rawDocumentContent.trim();
    if (builderTab === 'document') {
      finalContent = rawDocumentContent.trim();
    } else {
      if (finalContent.length > 200) {
        finalContent = mergeVisualRulesIntoDocument(finalContent);
      } else {
        finalContent = compileFormToDocumentText();
      }
    }

    try {
      const payload = {
        title: policyTitle.trim(),
        version: policyVersion.trim() || '1.0',
        description: policyDescription.trim(),
        include_standard_rules: includeStandardRules,
        color_mode: colorMode,
        company_mode: companyMode,
        person_mode: personMode,
        symbol_mode: symbolMode,
        tone_mode: toneMode,
        preferred_tones: preferredTones,
        prohibited_tones: prohibitedTones,
        prohibited_symbols: prohibitedSymbols,
        approved_companies: approvedCompanies,
        prohibited_companies: prohibitedCompanies,
        approved_persons: approvedPersons,
        prohibited_persons: prohibitedPersons,
        prohibited_words: bannedWords,
        require_terms_disclaimer: requireTermsDisclaimer,
        prohibit_guarantees: prohibitGuarantees,
        prohibited_colors: prohibitedColors.map(c => c.name),
        approved_palette: approvedColors.map(c => c.hex),
        approved_ranges: approvedRanges,
        prohibited_ranges: prohibitedRanges,
        // Legacy fields for backward compatibility
        allowed_ambassadors: approvedPersons,
        whitelisted_entities: approvedPersons,
        prohibit_person_names: prohibitedPersons.length > 0,
        blocked_competitors: prohibitedCompanies,
        prohibit_competitor_mentions: prohibitedCompanies.length > 0,
        prohibit_competitor_claims: prohibitedCompanies.length > 0,
        prohibit_questions: prohibitedSymbols.includes('?'),
        prohibit_exclamations: prohibitedSymbols.includes('!'),
        prohibit_100_percent: bannedWords.includes('100%') || prohibitedSymbols.includes('%'),
        raw_content: finalContent,
        raw_text: finalContent,
      };

      const res = await fetch(`${API_BASE}/api/guidelines/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to create guideline version');
      }

      const data = await res.json();
      const newGuidelineItem: GuidelineItem = {
        id: data.guideline_id,
        filename: data.filename,
        uploaded_at: 'Just now',
      };

      setGuidelines(prev => [newGuidelineItem, ...prev]);
      setSelectedId(data.guideline_id);
      setSelectedDetail({
        id: data.guideline_id,
        filename: data.filename,
        uploaded_at: 'Just now',
        rules_count: data.rules_count,
        rules: data.extracted_rules,
        full_content: data.raw_text,
        content_preview: data.raw_text?.slice(0, 300),
      });

      setBuilderSuccess(`Policy version "${data.filename}" created and indexed successfully!`);
      setTimeout(() => {
        setIsBuilderOpen(false);
        setBuilderSuccess(null);
      }, 1000);
    } catch (e: any) {
      setBuilderError(e.message || 'An error occurred while saving policy');
    } finally {
      setBuilderSubmitting(false);
    }
  };

  const handleCopyRaw = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const filteredGuidelines = guidelines.filter(g =>
    g.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRules = selectedDetail?.rules || [];
  const deterministicCount = activeRules.filter(r => r.enforcement === 'Deterministic').length;
  const semanticCount = activeRules.filter(r => r.enforcement === 'Semantic RAG').length;
  const criticalCount = activeRules.filter(r => r.severity === 'Critical').length;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>Knowledge Base</span>
            <span className="text-indigo-300">/</span>
            <span>Guideline Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Brand Guidelines &amp; Extracted Rule Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Click any guideline below to inspect its extracted compliance rules, enforcement classifications, and active policy constraints.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/guidelines/builder"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Create / Version Policy</span>
          </Link>

          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>+ Upload File</span>
          </Link>
        </div>
      </div>

      {/* Main Master-Detail Split Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Guideline Directory List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Guideline Library
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {guidelines.length} Available
              </span>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search guidelines by filename..."
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 bg-slate-50/50"
              />
            </div>

            {/* List */}
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Loading guidelines...
              </div>
            ) : filteredGuidelines.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No guidelines matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredGuidelines.map(g => {
                  const isSelected = g.id === selectedId;

                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedId(g.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/50 border-indigo-400 shadow-2xs ring-1 ring-indigo-400/30'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`font-bold text-xs truncate ${
                              isSelected ? 'text-indigo-950' : 'text-slate-900'
                            }`}
                          >
                            {g.filename}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{g.uploaded_at?.slice(0, 16) || 'Active'}</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-2 transition-transform ${
                          isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upload Shortcut Box */}
          <div className="bg-slate-100/60 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block">Need a custom guideline?</span>
              <span className="text-[11px] text-slate-500">Upload PDF, TXT or DOCX files.</span>
            </div>
            <Link
              href="/upload"
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold rounded-lg text-xs transition-colors shadow-2xs"
            >
              Upload
            </Link>
          </div>
        </div>

        {/* Right Column: Selected Guideline Detail & Extracted Rule Matrix (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {detailLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-500">Extracting and loading policy constraints...</p>
            </div>
          ) : selectedDetail ? (
            <>
              {/* Selected Guideline Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active In Knowledge Base
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        ID: {selectedDetail.id.slice(0, 12)}...
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {selectedDetail.filename}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Ingested {selectedDetail.uploaded_at?.slice(0, 16)} • Verified by Deterministic Engine &amp; Gemini 2.5 Flash RAG
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/guidelines/builder?id=${selectedDetail.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit &amp; Version</span>
                    </Link>

                    <Link
                      href={`/submit?guideline=${selectedDetail.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-2xs transition-colors"
                    >
                      <span>Audit Copy</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* KPI stats ribbon for this specific guideline */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Total Rules
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {activeRules.length}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Deterministic
                    </span>
                    <span className="text-xl font-extrabold text-slate-800 font-mono">
                      {deterministicCount}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Semantic RAG
                    </span>
                    <span className="text-xl font-extrabold text-indigo-700 font-mono">
                      {semanticCount}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Critical Severity
                    </span>
                    <span className="text-xl font-extrabold text-rose-600 font-mono">
                      {criticalCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Extracted Governance Rule Matrix Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Extracted Policy Constraint Matrix
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Active compliance rules parsed from <strong className="text-slate-700 font-mono">{selectedDetail.filename}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {activeRules.length} Active Rules
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-3">Section</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Extracted Policy Constraint</th>
                        <th className="px-6 py-3 text-center">Engine</th>
                        <th className="px-6 py-3 text-center">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeRules.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5 font-mono font-bold text-slate-700 text-[11px] shrink-0 whitespace-nowrap">
                            {item.section}
                          </td>
                          <td className="px-6 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                            {item.category}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600 leading-relaxed max-w-md">
                            {item.rule}
                          </td>
                          <td className="px-6 py-3.5 text-center whitespace-nowrap">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                item.enforcement === 'Deterministic'
                                  ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {item.enforcement}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                item.severity === 'Critical'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {item.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Collapsible Raw Source Viewer */}
              {selectedDetail.full_content && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowRawSource(!showRawSource)}
                      className="text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-900 flex items-center gap-1.5"
                    >
                      <FileCode className="w-4 h-4 text-slate-500" />
                      <span>{showRawSource ? 'Hide Raw Guideline Document' : 'View Raw Guideline Source Text'}</span>
                    </button>
                    {showRawSource && (
                      <button
                        type="button"
                        onClick={() => handleCopyRaw(selectedDetail.full_content!)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Source</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {showRawSource && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed shadow-inner">
                      {selectedDetail.full_content}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs text-slate-400">
              Select a brand guideline from the library on the left to inspect its active policy constraints.
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BRAND POLICY STUDIO & VERSIONING MODAL */}
      {/* ===================================================================== */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col my-8">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-200/80 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Brand Policy Studio — Visual Builder &amp; Versioning
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Design custom governance rules, define color palettes, and edit specification documents.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Mode Switcher Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      if (builderTab === 'document') {
                        // User switched from Document Editor to Visual Builder
                        parseTextIntoFormState(rawDocumentContent);
                      }
                      setBuilderTab('form');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      builderTab === 'form'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Visual Builder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (builderTab === 'form') {
                        // Sync visual form selections to document editor if document is empty
                        if (!rawDocumentContent.trim()) {
                          setRawDocumentContent(compileFormToDocumentText());
                        }
                      }
                      setBuilderTab('document');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      builderTab === 'document'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Document Editor</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {builderError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{builderError}</span>
                </div>
              )}

              {builderSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{builderSuccess}</span>
                </div>
              )}

              {/* 1. Policy Identity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Policy Title
                  </label>
                  <input
                    type="text"
                    value={policyTitle}
                    onChange={e => setPolicyTitle(e.target.value)}
                    placeholder="e.g. Enterprise Brand Governance Policy"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    value={policyVersion}
                    onChange={e => setPolicyVersion(e.target.value)}
                    placeholder="e.g. 1.0, 1.1, 2.0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  />
                </div>
              </div>

              {/* TAB 1: VISUAL FORM BUILDER */}
              {builderTab === 'form' && (
                <div className="space-y-6">
                  {/* Standard Baseline Card */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Include Enterprise Standard Baseline
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Automatically extends custom rules with: ISO/IEC 40500 WCAG 2.1 AA text contrast (4.5:1), unprovable guarantees prohibition, competitor benchmarking, and standard terms disclaimers.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={includeStandardRules}
                        onChange={e => setIncludeStandardRules(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Color Governance Matrix */}
                  <div className="space-y-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-indigo-600" />
                          <span>Color Governance Matrix</span>
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Choose governance mode: Approved allowlist, Prohibited blocklist, or Preferred &amp; Not Preferred.
                        </p>
                      </div>

                      {/* 3-Mode Selector */}
                      <div className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-xl border border-slate-300/80 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setColorMode('approved')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            colorMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>1) Approved Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setColorMode('prohibited')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            colorMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>2) Prohibited Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setColorMode('tiered')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            colorMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Sliders className="w-3 h-3" />
                          <span>3) Preferred &amp; Not Preferred</span>
                        </button>
                      </div>
                    </div>

                    {/* Mode Notice Banner */}
                    <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                      colorMode === 'approved'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : colorMode === 'prohibited'
                        ? 'bg-rose-50 text-rose-900 border-rose-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      <span className="font-bold shrink-0">
                        {colorMode === 'approved' ? '🟢 Option 1 (Strict Approved):' : colorMode === 'prohibited' ? '🔴 Option 2 (Strict Prohibited):' : '⚖️ Option 3 (Preferred & Not Preferred):'}
                      </span>
                      <span>
                        {colorMode === 'approved'
                          ? 'Only colors added to the Approved Palette below are permitted. Everything outside this list is strictly prohibited during visual audits.'
                          : colorMode === 'prohibited'
                          ? 'Only the colors added to the Prohibited list below are banned. All other colors outside this list are automatically considered approved.'
                          : 'Preferred colors are approved, not-preferred colors are prohibited, and any color unlisted in both will be considered Neutral.'}
                      </span>
                    </div>

                    {/* Dynamic Color Gradient Preview Bar (Visible when approved colors or ranges exist) */}
                    {(colorMode === 'approved' || colorMode === 'tiered') && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                          <span>Brand Color Spectrum &amp; Gradient Preview</span>
                          <span className={`font-mono text-xs font-bold ${approvedColors.length > 0 || approvedRanges.length > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {approvedColors.length} Approved Colors {approvedRanges.length > 0 ? `· ${approvedRanges.length} Shade Spectrums` : ''}
                          </span>
                        </div>
                        <div
                          className={`min-h-[44px] w-full rounded-xl border transition-all flex flex-wrap items-center gap-2 p-2.5 ${
                            approvedColors.length === 0 && approvedRanges.length === 0
                              ? 'bg-slate-100/80 border-dashed border-slate-300 justify-center text-slate-400 text-xs font-medium'
                              : 'border-slate-300/80 bg-slate-900/5'
                          }`}
                        >
                          {approvedColors.length === 0 && approvedRanges.length === 0 ? (
                            <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                              <Palette className="w-3.5 h-3.5" />
                              No approved brand palette or shade spectrum specified in this guideline (0 colors)
                            </span>
                          ) : (
                            <>
                              {approvedColors.map((col, idx) => (
                                <span
                                  key={`col-${idx}`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white text-slate-900 shadow-2xs border border-slate-200"
                                >
                                  <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: col.hex }} />
                                  {col.name ? `${col.name} (${col.hex})` : col.hex}
                                </span>
                              ))}
                              {approvedRanges.map((range, idx) => (
                                <span
                                  key={`range-${idx}`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-indigo-950 shadow-2xs border border-indigo-200"
                                >
                                  <span className="w-4 h-3 rounded-md shrink-0 shadow-2xs" style={{ background: range.gradient }} />
                                  {range.name} ({range.hueMin}°–{range.hueMax}°)
                                </span>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Conditional Grid: Approved vs Prohibited */}
                    <div className={`grid gap-4 pt-1 ${colorMode === 'tiered' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {/* Approved Palette (Wanted) */}
                      {(colorMode === 'approved' || colorMode === 'tiered') && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {colorMode === 'approved' ? 'Approved Brand Palette (Strict Allowlist)' : 'Approved Brand Palette (Wanted)'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {approvedColors.length} colors · {approvedRanges.length} ranges
                            </span>
                          </div>

                          {/* 1. Single Hex Swatches */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Specific Brand Hex Colors
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                              {approvedColors.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">No specific hex colors defined.</p>
                              ) : (
                                approvedColors.map((color, index) => (
                                  <div
                                    key={index}
                                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 shadow-2xs"
                                  >
                                    <span
                                      className="w-3.5 h-3.5 rounded-md border border-black/10 shrink-0"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="font-medium">{color.name}</span>
                                    <span className="font-mono text-[10px] text-slate-500">{color.hex}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeApprovedColor(index)}
                                      className="text-slate-400 hover:text-rose-600 transition-colors ml-1"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add Approved Color */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                              <input
                                type="color"
                                value={newColorHex}
                                onChange={e => setNewColorHex(e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white shrink-0"
                                title="Pick color"
                              />
                              <input
                                type="text"
                                value={newColorName}
                                onChange={e => setNewColorName(e.target.value)}
                                placeholder="Color label (e.g. Electric Violet, Teal)"
                                className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-slate-900"
                              />
                              <button
                                type="button"
                                onClick={addApprovedColor}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Prohibited Colors (Unwanted) */}
                      {(colorMode === 'prohibited' || colorMode === 'tiered') && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              {colorMode === 'prohibited' ? 'Prohibited Poster Colors (Strict Blocklist)' : 'Prohibited Poster Colors (Unwanted)'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {prohibitedColors.length} colors · {prohibitedRanges.length} ranges
                            </span>
                          </div>

                          {/* 1. Single Hex Swatches */}
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Specific Banned Hex Colors
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                              {prohibitedColors.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">No specific hex colors banned.</p>
                              ) : (
                                prohibitedColors.map((color, index) => (
                                  <div
                                    key={index}
                                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/60 text-xs text-rose-900 shadow-2xs"
                                  >
                                    <span
                                      className="w-3.5 h-3.5 rounded-md border border-black/10 shrink-0"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                    <span className="font-medium">{color.name}</span>
                                    <span className="font-mono text-[10px] text-rose-600">{color.hex}</span>
                                    <button
                                      type="button"
                                      onClick={() => removeProhibitedColor(index)}
                                      className="text-rose-400 hover:text-rose-700 transition-colors ml-1"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add Prohibited Color */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                              <input
                                type="color"
                                value={newProhibitHex}
                                onChange={e => setNewProhibitHex(e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white shrink-0"
                                title="Pick prohibited color"
                              />
                              <input
                                type="text"
                                value={newProhibitName}
                                onChange={e => setNewProhibitName(e.target.value)}
                                placeholder="Name (e.g. Neon Green, Red)"
                                className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-slate-900"
                              />
                              <button
                                type="button"
                                onClick={addProhibitedColor}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                              >
                                <Plus className="w-3 h-3" />
                                Ban
                              </button>
                            </div>
                          </div>

                          {/* 2. Whole Shade Spectrums / Color Ranges */}
                          <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                                <Layers className="w-3 h-3 text-rose-600" />
                                <span>Whole Shade Spectrums (Bans Entire Color Families)</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{prohibitedRanges.length} active</span>
                            </div>

                            {/* Active Prohibited Ranges */}
                            <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                              {prohibitedRanges.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">
                                  No shade spectrum banned. Choose a whole color family below to ban all its shades (e.g. All Blue Shades, All Red Shades).
                                </p>
                              ) : (
                                prohibitedRanges.map((range) => (
                                  <div
                                    key={range.id}
                                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-xs text-rose-950 shadow-2xs"
                                  >
                                    <span
                                      className="w-5 h-3.5 rounded-md shrink-0 shadow-2xs border border-black/10"
                                      style={{ background: range.gradient }}
                                    />
                                    <span className="font-bold">{range.name}</span>
                                    <span className="font-mono text-[10px] text-rose-700">Hue {range.hueMin}°–{range.hueMax}°</span>
                                    <button
                                      type="button"
                                      onClick={() => removeProhibitedRange(range.id)}
                                      className="text-rose-500 hover:text-rose-800 transition-colors ml-1"
                                      title="Remove banned spectrum"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Quick-Add Spectrum Chips */}
                            <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 space-y-2">
                              <div className="text-[10px] font-semibold text-rose-900">
                                Quick-Add Spectrum Range (Ban Entire Shade Family):
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {STANDARD_SHADE_RANGES.map((std) => {
                                  const isSelected = prohibitedRanges.some(r => r.id === std.id);
                                  return (
                                    <button
                                      key={std.id}
                                      type="button"
                                      onClick={() => isSelected ? removeProhibitedRange(std.id) : addProhibitedRange(std)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1.5 transition-all ${
                                        isSelected
                                          ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                          : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                                      }`}
                                    >
                                      <span className="w-3 h-2 rounded-sm shrink-0" style={{ background: std.gradient }} />
                                      <span>{std.name}</span>
                                      {isSelected && <Check className="w-2.5 h-2.5 ml-0.5" />}
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => setCustomRangeTarget(customRangeTarget === 'prohibited' ? null : 'prohibited')}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                                    customRangeTarget === 'prohibited'
                                      ? 'bg-rose-600 text-white border-rose-700'
                                      : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                                  }`}
                                >
                                  <Sliders className="w-2.5 h-2.5" />
                                  <span>+ Custom Spectrum...</span>
                                </button>
                              </div>
                            </div>

                            {/* Custom Spectrum Builder (Prohibited) */}
                            {customRangeTarget === 'prohibited' && (
                              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3 mt-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                                    <Sliders className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Build Custom Shade Spectrum (Prohibited)</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setCustomRangeTarget(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                      Center Base Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={customRangeBase}
                                        onChange={e => setCustomRangeBase(e.target.value)}
                                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                                      />
                                      <input
                                        type="text"
                                        value={customRangeBase}
                                        onChange={e => setCustomRangeBase(e.target.value)}
                                        className="w-24 px-2 py-1 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                                        Hue Spectrum Tolerance
                                      </label>
                                      <span className="text-[10px] font-mono font-bold text-rose-600">
                                        ±{customRangeTolerance}° (Total {customRangeTolerance * 2}°)
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min={10}
                                      max={50}
                                      step={5}
                                      value={customRangeTolerance}
                                      onChange={e => setCustomRangeTolerance(Number(e.target.value))}
                                      className="w-full accent-rose-600 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                                      <span>Narrow (±10°)</span>
                                      <span>Wide (±50°)</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Dynamic Gradient Preview */}
                                <div>
                                  <div className="text-[10px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                                    <span>Calculated Hue Spectrum:</span>
                                    <span className="font-mono text-[10px] text-rose-700">
                                      Hue {getCustomSpectrumPreview().hueMin}° – {getCustomSpectrumPreview().hueMax}°
                                    </span>
                                  </div>
                                  <div
                                    className="h-7 w-full rounded-lg border border-black/10 shadow-inner flex items-center justify-center text-[10px] font-bold text-white drop-shadow"
                                    style={{ background: getCustomSpectrumPreview().gradient }}
                                  >
                                    Banned Spectrum Preview
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={customRangeName}
                                    onChange={e => setCustomRangeName(e.target.value)}
                                    placeholder="Spectrum Name (e.g. Neon to Electric Green)"
                                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => addCustomRange('prohibited')}
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Ban Spectrum</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1. Brand Voice & Tone Governance Card */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-indigo-600" />
                          <span>Brand Voice &amp; Tone Standards</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Choose governance mode: Approved allowlist, Prohibited blocklist, or Preferred &amp; Not Preferred.
                        </p>
                      </div>

                      {/* 3-Mode Selector */}
                      <div className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-xl border border-slate-300/80 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setToneMode('approved')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            toneMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>1) Approved Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setToneMode('prohibited')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            toneMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>2) Prohibited Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setToneMode('tiered')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            toneMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Sliders className="w-3 h-3" />
                          <span>3) Preferred &amp; Not Preferred</span>
                        </button>
                      </div>
                    </div>

                    {/* Mode Notice Banner */}
                    <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                      toneMode === 'approved'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : toneMode === 'prohibited'
                        ? 'bg-rose-50 text-rose-900 border-rose-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      <span className="font-bold shrink-0">
                        {toneMode === 'approved' ? '🟢 Option 1 (Strict Approved):' : toneMode === 'prohibited' ? '🔴 Option 2 (Strict Prohibited):' : '⚖️ Option 3 (Preferred & Not Preferred):'}
                      </span>
                      <span>
                        {toneMode === 'approved'
                          ? 'Only selected tones are permitted. All other tones outside this list are strictly prohibited in marketing copy.'
                          : toneMode === 'prohibited'
                          ? 'Only selected tones are banned. All other tones outside this list are automatically approved.'
                          : 'Preferred tones are approved, prohibited tones are banned, and unlisted tones are considered Neutral.'}
                      </span>
                    </div>

                    <div className={`grid gap-4 pt-1 ${toneMode === 'tiered' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {/* Preferred Brand Voice */}
                      {(toneMode === 'approved' || toneMode === 'tiered') && (
                        <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {toneMode === 'approved' ? 'Approved Tone (Strict Allowlist)' : 'Preferred Tone (Approved Voice)'}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-mono font-bold">{preferredTones.length} selected</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {STANDARD_PREFERRED_TONES.map(tone => {
                              const isSelected = preferredTones.includes(tone);
                              return (
                                <button
                                  key={tone}
                                  type="button"
                                  onClick={() => togglePreferredTone(tone)}
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-40" />}
                                  <span>{tone}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Prohibited Tones */}
                      {(toneMode === 'prohibited' || toneMode === 'tiered') && (
                        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              {toneMode === 'prohibited' ? 'Prohibited Tones (Strict Blocklist)' : 'Prohibited Tones (Unwanted Voice)'}
                            </span>
                            <span className="text-[10px] text-rose-700 font-mono font-bold">{prohibitedTones.length} banned</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {STANDARD_PROHIBITED_TONES.map(tone => {
                              const isSelected = prohibitedTones.includes(tone);
                              return (
                                <button
                                  key={tone}
                                  type="button"
                                  onClick={() => toggleProhibitedTone(tone)}
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {isSelected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-40" />}
                                  <span>{tone}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Prohibited Symbols & Characters Card */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3.5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <Hash className="w-4 h-4 text-indigo-600" />
                          <span>Symbols &amp; Punctuation Governance</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Choose governance mode: Approved allowlist, Prohibited blocklist, or Preferred &amp; Not Preferred.
                        </p>
                      </div>

                      {/* 3-Mode Selector */}
                      <div className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-xl border border-slate-300/80 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setSymbolMode('approved')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            symbolMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>1) Approved Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSymbolMode('prohibited')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            symbolMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>2) Prohibited Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSymbolMode('tiered')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            symbolMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Sliders className="w-3 h-3" />
                          <span>3) Preferred &amp; Not Preferred</span>
                        </button>
                      </div>
                    </div>

                    {/* Mode Notice Banner */}
                    <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                      symbolMode === 'approved'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : symbolMode === 'prohibited'
                        ? 'bg-rose-50 text-rose-900 border-rose-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      <span className="font-bold shrink-0">
                        {symbolMode === 'approved' ? '🟢 Option 1 (Strict Approved):' : symbolMode === 'prohibited' ? '🔴 Option 2 (Strict Prohibited):' : '⚖️ Option 3 (Preferred & Not Preferred):'}
                      </span>
                      <span>
                        {symbolMode === 'approved'
                          ? 'Only selected symbols/punctuation below are permitted. All other symbols outside this list are strictly prohibited in marketing copy.'
                          : symbolMode === 'prohibited'
                          ? 'Only selected symbols below are banned. All other standard punctuation outside this list is permitted.'
                          : 'Selected symbols are prohibited, and unlisted standard punctuation marks are considered Neutral.'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{symbolMode === 'approved' ? 'Permitted Symbols (Allowlist):' : 'Prohibited Symbols (Blocklist):'}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {prohibitedSymbols.length} {symbolMode === 'approved' ? 'permitted' : 'banned'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {STANDARD_SYMBOLS.map(item => {
                        const isBanned = prohibitedSymbols.includes(item.symbol);
                        return (
                          <button
                            key={item.symbol}
                            type="button"
                            onClick={() => toggleProhibitedSymbol(item.symbol)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                              isBanned
                                ? symbolMode === 'approved'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs ring-1 ring-emerald-200'
                                  : 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs ring-1 ring-rose-200'
                                : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              isBanned
                                ? symbolMode === 'approved'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}>
                              {item.symbol === 'Emoji' ? '😊' : item.symbol}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold block leading-tight truncate">{item.label}</span>
                              <span className="text-[10px] text-slate-500 leading-tight block mt-0.5 line-clamp-1">{item.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Symbol Input */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <input
                        type="text"
                        value={customSymbolInput}
                        onChange={e => setCustomSymbolInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomSymbol();
                          }
                        }}
                        placeholder="Add custom character or symbol (e.g. '~', '^', '&') and press Enter"
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={addCustomSymbol}
                        className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0 ${
                          symbolMode === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {symbolMode === 'approved' ? 'Allow Symbol' : 'Ban Symbol'}
                      </button>
                    </div>
                  </div>

                  {/* 3. Company & Brand Governance Matrix */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          <span>Company &amp; Brand Governance Matrix</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Choose governance mode: Approved allowlist, Prohibited blocklist, or Preferred &amp; Not Preferred.
                        </p>
                      </div>

                      {/* 3-Mode Selector */}
                      <div className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-xl border border-slate-300/80 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setCompanyMode('approved')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            companyMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>1) Approved Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompanyMode('prohibited')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            companyMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>2) Prohibited Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCompanyMode('tiered')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            companyMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Sliders className="w-3 h-3" />
                          <span>3) Preferred &amp; Not Preferred</span>
                        </button>
                      </div>
                    </div>

                    {/* Mode Notice Banner */}
                    <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                      companyMode === 'approved'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : companyMode === 'prohibited'
                        ? 'bg-rose-50 text-rose-900 border-rose-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      <span className="font-bold shrink-0">
                        {companyMode === 'approved' ? '🟢 Option 1 (Strict Approved):' : companyMode === 'prohibited' ? '🔴 Option 2 (Strict Prohibited):' : '⚖️ Option 3 (Preferred & Not Preferred):'}
                      </span>
                      <span>
                        {companyMode === 'approved'
                          ? 'Only authorized brand partners below may be referenced. All other external companies or competitor mentions are strictly prohibited.'
                          : companyMode === 'prohibited'
                          ? 'Only the competitor brands listed below are banned. All other external company mentions outside this list are approved.'
                          : 'Approved partners are allowed, banned competitors are prohibited, and unlisted companies are considered Neutral.'}
                      </span>
                    </div>

                    <div className={`grid gap-4 pt-1 ${companyMode === 'tiered' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {/* Approved Brand Partners & Collaborations */}
                      {(companyMode === 'approved' || companyMode === 'tiered') && (
                        <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {companyMode === 'approved' ? 'Approved Partners & Collaborations (Strict Allowlist)' : 'Approved Partners & Collaborations (Allowed)'}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-mono font-bold">{approvedCompanies.length} approved</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                            {approvedCompanies.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-1">No approved partners defined.</p>
                            ) : (
                              approvedCompanies.map(c => (
                                <span
                                  key={c}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold shadow-2xs"
                                >
                                  <Building2 className="w-3 h-3 text-emerald-600" />
                                  {c}
                                  <button
                                    type="button"
                                    onClick={() => removeApprovedCompany(c)}
                                    className="text-emerald-500 hover:text-emerald-800 transition-colors ml-0.5"
                                    title="Remove partner"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <input
                              type="text"
                              value={newApprovedCompany}
                              onChange={e => setNewApprovedCompany(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addApprovedCompany();
                                }
                              }}
                              placeholder="Partner or authorized brand (e.g. Acme Corp, Nvidia)"
                              className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-slate-900"
                            />
                            <button
                              type="button"
                              onClick={addApprovedCompany}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Prohibited Competitor Brands */}
                      {(companyMode === 'prohibited' || companyMode === 'tiered') && (
                        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              {companyMode === 'prohibited' ? 'Prohibited Competitor Brands (Strict Blocklist)' : 'Prohibited Competitor Brands (Banned)'}
                            </span>
                            <span className="text-[10px] text-rose-700 font-mono font-bold">{prohibitedCompanies.length} banned</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                            {prohibitedCompanies.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-1">No competitor brands explicitly prohibited.</p>
                            ) : (
                              prohibitedCompanies.map(c => (
                                <span
                                  key={c}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold shadow-2xs"
                                >
                                  <Building2 className="w-3 h-3 text-rose-600" />
                                  {c}
                                  <button
                                    type="button"
                                    onClick={() => removeProhibitedCompany(c)}
                                    className="text-rose-500 hover:text-rose-800 transition-colors ml-0.5"
                                    title="Remove banned competitor"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <input
                              type="text"
                              value={newProhibitedCompany}
                              onChange={e => setNewProhibitedCompany(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addProhibitedCompany();
                                }
                              }}
                              placeholder="Competitor or brand to ban (e.g. RivalTech, Brand X)"
                              className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-slate-900"
                            />
                            <button
                              type="button"
                              onClick={addProhibitedCompany}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              Ban
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Entity & Spokesperson Governance Matrix */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span>Entity &amp; Spokesperson Governance Matrix</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Choose governance mode: Approved allowlist, Prohibited blocklist, or Preferred &amp; Not Preferred.
                        </p>
                      </div>

                      {/* 3-Mode Selector */}
                      <div className="inline-flex items-center p-0.5 bg-slate-200/80 rounded-xl border border-slate-300/80 shrink-0 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setPersonMode('approved')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            personMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>1) Approved Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersonMode('prohibited')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            personMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>2) Prohibited Only</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersonMode('tiered')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            personMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Sliders className="w-3 h-3" />
                          <span>3) Preferred &amp; Not Preferred</span>
                        </button>
                      </div>
                    </div>

                    {/* Mode Notice Banner */}
                    <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                      personMode === 'approved'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : personMode === 'prohibited'
                        ? 'bg-rose-50 text-rose-900 border-rose-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      <span className="font-bold shrink-0">
                        {personMode === 'approved' ? '🟢 Option 1 (Strict Approved):' : personMode === 'prohibited' ? '🔴 Option 2 (Strict Prohibited):' : '⚖️ Option 3 (Preferred & Not Preferred):'}
                      </span>
                      <span>
                        {personMode === 'approved'
                          ? 'Only authorized brand ambassadors below are permitted. All other individual person names are strictly prohibited in marketing creatives.'
                          : personMode === 'prohibited'
                          ? 'Only the person names listed below are banned. All other person names outside this list are approved.'
                          : 'Authorized ambassadors are approved, banned names are prohibited, and unlisted entities are considered Neutral.'}
                      </span>
                    </div>

                    <div className={`grid gap-4 pt-1 ${personMode === 'tiered' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {/* Approved Brand Ambassadors & Leadership */}
                      {(personMode === 'approved' || personMode === 'tiered') && (
                        <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {personMode === 'approved' ? 'Approved Brand Ambassadors (Strict Allowlist)' : 'Approved Brand Ambassadors (Allowed)'}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-mono font-bold">{approvedPersons.length} approved</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                            {approvedPersons.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-1">No approved ambassadors defined.</p>
                            ) : (
                              approvedPersons.map(p => (
                                <span
                                  key={p}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold shadow-2xs"
                                >
                                  <Users className="w-3 h-3 text-emerald-600" />
                                  {p}
                                  <button
                                    type="button"
                                    onClick={() => removeApprovedPerson(p)}
                                    className="text-emerald-500 hover:text-emerald-800 transition-colors ml-0.5"
                                    title="Remove ambassador"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <input
                              type="text"
                              value={newApprovedPerson}
                              onChange={e => setNewApprovedPerson(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addApprovedPerson();
                                }
                              }}
                              placeholder="Approved spokesperson (e.g. Hritik Roshan, CEO Name)"
                              className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-slate-900"
                            />
                            <button
                              type="button"
                              onClick={addApprovedPerson}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Prohibited Person Names */}
                      {(personMode === 'prohibited' || personMode === 'tiered') && (
                        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              {personMode === 'prohibited' ? 'Prohibited Person Names (Strict Blocklist)' : 'Prohibited Person Names (Banned)'}
                            </span>
                            <span className="text-[10px] text-rose-700 font-mono font-bold">{prohibitedPersons.length} banned</span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!prohibitedPersons.includes('All unapproved individual person names') && (
                              <button
                                type="button"
                                onClick={() => setProhibitedPersons(prev => [...prev, 'All unapproved individual person names'])}
                                className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors inline-flex items-center gap-0.5"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                + Ban All Unapproved Names
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                            {prohibitedPersons.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-1">No individual person names banned.</p>
                            ) : (
                              prohibitedPersons.map(p => (
                                <span
                                  key={p}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold shadow-2xs"
                                >
                                  <Users className="w-3 h-3 text-rose-600" />
                                  {p}
                                  <button
                                    type="button"
                                    onClick={() => removeProhibitedPerson(p)}
                                    className="text-rose-500 hover:text-rose-800 transition-colors ml-0.5"
                                    title="Remove banned person"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>

                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <input
                              type="text"
                              value={newProhibitedPerson}
                              onChange={e => setNewProhibitedPerson(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addProhibitedPerson();
                                }
                              }}
                              placeholder="Person name to ban (or 'All unapproved names')"
                              className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-slate-900"
                            />
                            <button
                              type="button"
                              onClick={addProhibitedPerson}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              Ban
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Prohibited Vocabulary & Banned Words Card */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                          <span>Prohibited Vocabulary &amp; Banned Claims</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Restricted phrases deterministically intercepted across marketing copy, slogans, and image OCR.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{bannedWords.length} terms</span>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Quick Add:</span>
                      {SUGGESTED_BANNED_WORDS.filter(w => !bannedWords.includes(w)).map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setBannedWords(prev => [...prev, suggestion])}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0 flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          {suggestion}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                      {bannedWords.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1">No custom banned terms added. Type below or use quick add chips.</p>
                      ) : (
                        bannedWords.map((word) => (
                          <span
                            key={word}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-medium shadow-2xs"
                          >
                            {word}
                            <button
                              type="button"
                              onClick={() => removeBannedWord(word)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <input
                        type="text"
                        value={newWord}
                        onChange={e => setNewWord(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addBannedWord();
                          }
                        }}
                        placeholder="Add banned word or phrase (e.g. '100%', 'risk-free', 'unlimited') and press Enter"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                      />
                      <button
                        type="button"
                        onClick={addBannedWord}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Word
                      </button>
                    </div>
                  </div>

                  {/* 5. Legal Disclaimers & Absolute Claims Card */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-2xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>Legal Compliance &amp; Disclaimer Standards</span>
                    </h4>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Require Mandatory Terms Disclaimer</span>
                          <span className="text-[11px] text-slate-500">Demands &quot;Terms and conditions apply&quot; on promotional copy</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={requireTermsDisclaimer}
                          onChange={e => setRequireTermsDisclaimer(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Prohibit Absolute Guarantees</span>
                          <span className="text-[11px] text-slate-500">Bans unverifiable &quot;guaranteed&quot; / &quot;guarantee&quot; claims</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={prohibitGuarantees}
                          onChange={e => setProhibitGuarantees(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DIRECT DOCUMENT EDITOR (TXT / MARKDOWN) */}
              {builderTab === 'document' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">
                          Direct Document Editor (TXT / Markdown)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Write or paste custom brand guideline rules. Invalid hex codes are safely annotated and standard color names resolve dynamically.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const annotated = annotateInvalidHexInText(rawDocumentContent);
                          setRawDocumentContent(annotated);
                          parseTextIntoFormState(annotated);
                          setBuilderTab('form');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all shadow-2xs"
                        title="Parse document rules directly into the Visual Form builder"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Parse to Visual Form</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const annotated = annotateInvalidHexInText(rawDocumentContent);
                          setRawDocumentContent(annotated);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-all shadow-2xs"
                        title="Check for and annotate any malformed hex codes like #GG1234"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Annotate Invalid Hex</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRawDocumentContent(compileFormToDocumentText())}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition-all shadow-2xs"
                        title="Regenerate document from visual form selections"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sync from Visual Form</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={16}
                      value={rawDocumentContent}
                      onChange={e => setRawDocumentContent(e.target.value)}
                      placeholder={`Enter brand guideline rules here, for example:\n\n6 Rules:\n1. 100% should not be written.\n2. Name of any person should not be mentioned.\n3. Name of Our brand ambassador can be mentioned, which is Hritik Roshan.\n4. No Red and Blue colour should be used in posters.\n5. Question should not be added.\n6. Use of exclamation is prohibited.`}
                      className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-mono text-slate-900 bg-slate-900/5 focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all leading-relaxed"
                    />
                    <div className="absolute bottom-3 right-4 text-[10px] font-mono text-slate-400 bg-white/90 px-2 py-0.5 rounded border border-slate-200 backdrop-blur-xs">
                      {rawDocumentContent.length} chars · {rawDocumentContent.split('\n').filter(Boolean).length} lines
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-b-3xl">
              <div className="text-xs text-slate-500">
                Indexed in <span className="font-semibold text-slate-700">ChromaDB Vector Store</span> + <span className="font-semibold text-slate-700">Deterministic Engine</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={builderSubmitting}
                  onClick={handleSavePolicy}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xs"
                >
                  {builderSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving &amp; Indexing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Save &amp; Index Version</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
