'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Check,
  ChevronRight,
  Plus,
  X,
  Sliders,
  Palette,
  Volume2,
  Building2,
  Users,
  Hash,
  Sparkles,
  ArrowLeft,
  Layers,
  Wand2,
  FileCode,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Copy
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Shared Color & Punctuation Constants ───────────────────────────────────
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

function parseHexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map(x => x + x).join('');
  if (clean.length !== 6) return [59, 130, 246];
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

const STANDARD_COLOR_MAP: Record<string, string> = {
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
  crimson: '#DC143C',
  'neon green': '#00FF00',
  'neon yellow': '#FFFF00',
  'neon blue': '#00FFFF',
  'electric yellow': '#FFFF00',
};

function resolveColorToHex(input: string): string | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  const hexMatch = clean.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) return clean.toUpperCase();
  if (STANDARD_COLOR_MAP[clean]) return STANDARD_COLOR_MAP[clean];
  const stripped = clean.replace(/[-_\s]+/g, ' ');
  if (STANDARD_COLOR_MAP[stripped]) return STANDARD_COLOR_MAP[stripped];
  return null;
}

function annotateInvalidHexInText(text: string): string {
  if (!text) return '';
  return text.replace(/(?:\/\*\s*\[INVALID HEX:\s*([^\]]+?)\s*skipped\]\s*\*\/)|(#([A-Za-z0-9]+))/g, (fullMatch, existingComment, hexMatch, hexDigits) => {
    if (existingComment) return fullMatch;
    if (hexDigits && (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hexDigits))) return fullMatch;
    return `/* [INVALID HEX: ${hexMatch} skipped] */`;
  });
}

function PolicyBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loadingEdit, setLoadingEdit] = useState(false);
  const [builderTab, setBuilderTab] = useState<'form' | 'document'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Policy Metadata
  const [policyTitle, setPolicyTitle] = useState('Brand Governance Specification');
  const [policyVersion, setPolicyVersion] = useState('1.0');
  const [policyDescription, setPolicyDescription] = useState('Enterprise brand standards, palette specifications, and compliance rules.');
  const [rawDocumentContent, setRawDocumentContent] = useState('');

  // 3-Mode Governance Settings
  const [colorMode, setColorMode] = useState<'approved' | 'prohibited' | 'tiered'>('tiered');
  const [toneMode, setToneMode] = useState<'approved' | 'prohibited' | 'tiered'>('tiered');
  const [symbolMode, setSymbolMode] = useState<'approved' | 'prohibited' | 'tiered'>('tiered');
  const [companyMode, setCompanyMode] = useState<'approved' | 'prohibited' | 'tiered'>('tiered');
  const [personMode, setPersonMode] = useState<'approved' | 'prohibited' | 'tiered'>('tiered');

  // Baseline standard toggle
  const [includeStandardRules, setIncludeStandardRules] = useState(false);

  // 1. Color Governance:
  // Approved: SPECIFIC SWATCHES ONLY (No shade spectrum)
  const [approvedColors, setApprovedColors] = useState<{ hex: string; name: string }[]>([]);
  const [newColorHex, setNewColorHex] = useState('#4F46E5');
  const [newColorName, setNewColorName] = useState('');

  // Prohibited: Specific swatches AND Shade Spectrums
  const [prohibitedColors, setProhibitedColors] = useState<{ hex: string; name: string }[]>([]);
  const [newProhibitHex, setNewProhibitHex] = useState('#EF4444');
  const [newProhibitName, setNewProhibitName] = useState('');
  const [prohibitedRanges, setProhibitedRanges] = useState<ColorRangeItem[]>([]);

  // Custom Banned Range Builder
  const [showCustomRangeBuilder, setShowCustomRangeBuilder] = useState(false);
  const [customRangeBase, setCustomRangeBase] = useState('#3B82F6');
  const [customRangeTolerance, setCustomRangeTolerance] = useState(25);
  const [customRangeName, setCustomRangeName] = useState('');

  // 2. Tone Governance
  const [preferredTones, setPreferredTones] = useState<string[]>([
    'Professional & Authoritative',
    'Objective & Data-Backed',
  ]);
  const [prohibitedTones, setProhibitedTones] = useState<string[]>([]);

  // 3. Symbols & Punctuation Governance (Approved AND Prohibited supported)
  const [approvedSymbols, setApprovedSymbols] = useState<string[]>([]);
  const [prohibitedSymbols, setProhibitedSymbols] = useState<string[]>([]);
  const [customSymbolInput, setCustomSymbolInput] = useState('');

  // 4. Company Governance
  const [approvedCompanies, setApprovedCompanies] = useState<string[]>([]);
  const [newApprovedCompany, setNewApprovedCompany] = useState('');
  const [prohibitedCompanies, setProhibitedCompanies] = useState<string[]>([]);
  const [newProhibitedCompany, setNewProhibitedCompany] = useState('');

  // 5. Spokesperson / Person Governance
  const [approvedPersons, setApprovedPersons] = useState<string[]>([]);
  const [newApprovedPerson, setNewApprovedPerson] = useState('');
  const [prohibitedPersons, setProhibitedPersons] = useState<string[]>([]);
  const [newProhibitedPerson, setNewProhibitedPerson] = useState('');

  // 6. Prohibited Vocabulary
  const [bannedWords, setBannedWords] = useState<string[]>([]);
  const [newBannedWord, setNewBannedWord] = useState('');

  // 7. Copy Baseline Toggles
  const [prohibit100Claims, setProhibit100Claims] = useState(true);
  const [prohibitGuarantees, setProhibitGuarantees] = useState(false);
  const [prohibitCompetitorClaims, setProhibitCompetitorClaims] = useState(false);
  const [requireTermsDisclaimer, setRequireTermsDisclaimer] = useState(false);

  // Dynamic Custom Spectrum Preview
  const customSpectrumPreview = useMemo(() => {
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
  }, [customRangeBase, customRangeTolerance]);

  // Load existing guideline if editing
  useEffect(() => {
    if (!editId) return;
    setLoadingEdit(true);

    fetch(`${API_BASE}/api/guidelines/${editId}`)
      .then(res => res.ok ? res.json() : null)
      .then(detail => {
        if (!detail) {
          // Check local storage fallback
          try {
            const stored = localStorage.getItem('active_guideline_rules');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.id === editId) {
                applyDetailToForm(parsed);
                setLoadingEdit(false);
                return;
              }
            }
          } catch {}
          setLoadingEdit(false);
          return;
        }
        applyDetailToForm(detail);
        setLoadingEdit(false);
      })
      .catch(() => {
        setLoadingEdit(false);
      });
  }, [editId]);

  const applyDetailToForm = (detail: any) => {
    const rawName = (detail.filename || 'Guideline').replace(/\.[^/.]+$/, '');
    const versionMatch = rawName.match(/_v?(\d+(?:\.\d+)?)$/i);
    let nextVersion = '1.1';
    let cleanTitle = rawName;
    if (versionMatch) {
      const vNum = parseFloat(versionMatch[1]);
      nextVersion = (vNum + 0.1).toFixed(1);
      cleanTitle = rawName.slice(0, versionMatch.index);
    }
    setPolicyTitle(cleanTitle.replace(/[_-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()));
    setPolicyVersion(nextVersion);
    setPolicyDescription(`Version ${nextVersion} updated from ${detail.filename || 'existing policy'}.`);

    let content = detail.full_content || '';
    if (!content.trim() && detail.rules && detail.rules.length > 0) {
      content = detail.rules.map((r: any, i: number) => `${i + 1}. ${r.rule}`).join('\n');
    }
    if (!content.trim() && detail.content_preview) {
      content = detail.content_preview;
    }

    const annotated = annotateInvalidHexInText(content);
    setRawDocumentContent(annotated);
    parseTextIntoFormState(annotated);
  };

  const parseTextIntoFormState = (text: string) => {
    const textClean = text.replace(/\/\*.*?\*\//g, '');
    const textLower = textClean.toLowerCase();

    // 1. Color Extraction
    const parsedApproved: { hex: string; name: string }[] = [];
    const parsedProhibited: { hex: string; name: string }[] = [];

    const hexMatches = textClean.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
    const foundApprovedHexes = new Set<string>();
    const foundBannedHexes = new Set<string>();

    const lines = textClean.split(/\r?\n/);
    lines.forEach(line => {
      const lLower = line.toLowerCase();
      const isBannedLine = lLower.includes('prohibit') || lLower.includes('avoid') || lLower.includes('ban') || lLower.includes('never') || lLower.includes('unwanted');
      const isApprovedLine = lLower.includes('approved') || lLower.includes('wanted') || lLower.includes('allow') || lLower.includes('restricted to') || lLower.includes('primary');

      const lineHexes = line.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
      lineHexes.forEach(h => {
        const cleanH = h.toUpperCase();
        if (isBannedLine) foundBannedHexes.add(cleanH);
        else if (isApprovedLine) foundApprovedHexes.add(cleanH);
      });

      ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'neon green', 'electric yellow'].forEach(col => {
        if (new RegExp(`\\b${col}\\b`, 'i').test(line)) {
          const hex = resolveColorToHex(col);
          if (hex) {
            const capitalized = col.replace(/\b\w/g, l => l.toUpperCase());
            if (isBannedLine) {
              if (!parsedProhibited.some(c => c.name.toLowerCase() === col.toLowerCase())) {
                parsedProhibited.push({ hex, name: capitalized });
              }
            } else if (isApprovedLine) {
              if (!parsedApproved.some(c => c.name.toLowerCase() === col.toLowerCase())) {
                parsedApproved.push({ hex, name: capitalized });
              }
            }
          }
        }
      });
    });

    foundApprovedHexes.forEach(hex => {
      if (!parsedApproved.some(c => c.hex === hex)) {
        parsedApproved.push({ hex, name: hex === '#1E1B4B' ? 'TechCorp Navy' : hex === '#4F46E5' ? 'TechCorp Indigo' : 'Brand Swatch' });
      }
    });
    foundBannedHexes.forEach(hex => {
      if (!parsedProhibited.some(c => c.hex === hex)) {
        parsedProhibited.push({ hex, name: hex === '#00FF00' ? 'Neon Green' : hex === '#FFFF00' ? 'Electric Yellow' : 'Banned Swatch' });
      }
    });

    // 2. Prohibited Shade Ranges
    const parsedProhibitedRanges: ColorRangeItem[] = [];
    STANDARD_SHADE_RANGES.forEach(range => {
      const fam = range.family;
      const banRegex = new RegExp(`(?:no|not|prohibit\\w*|ban\\w*|avoid)\\s+[^.\\n]*?(?:all\\s+shades?\\s+of\\s+${fam}|whole\\s+shade\\s+of\\s+${fam}|${fam}\\s+spectrum|${fam}\\s+shades?|shades?\\s+of\\s+${fam})|(?:all\\s+shades?\\s+of\\s+${fam}|whole\\s+shade\\s+of\\s+${fam}|${fam}\\s+spectrum)\\s+[^.\\n]*?(?:prohibit\\w*|ban\\w*|not allowed|avoid)`, 'i');
      if (banRegex.test(textClean)) {
        if (!parsedProhibitedRanges.some(r => r.id === range.id)) {
          parsedProhibitedRanges.push(range);
        }
      }
    });

    setProhibitedRanges(parsedProhibitedRanges);
    setApprovedColors(parsedApproved);
    setProhibitedColors(parsedProhibited);

    // Auto-detect Color Governance Mode
    const hasApproved = parsedApproved.length > 0;
    const hasBanned = parsedProhibited.length > 0 || parsedProhibitedRanges.length > 0;
    if (textLower.includes('strict allowlist') || (hasApproved && !hasBanned)) {
      setColorMode('approved');
    } else if (textLower.includes('strict blocklist') || (hasBanned && !hasApproved)) {
      setColorMode('prohibited');
    } else {
      setColorMode('tiered');
    }

    // 3. Symbols
    const pSymbols: string[] = [];
    const aSymbols: string[] = [];
    if (textLower.includes('question') || textClean.includes('?')) pSymbols.push('?');
    if (textLower.includes('exclamation') || textClean.includes('!')) pSymbols.push('!');
    if (textClean.includes('%') || textLower.includes('percent')) pSymbols.push('%');
    if (textClean.includes('$') || textLower.includes('currency') || textLower.includes('dollar')) pSymbols.push('$');
    if (textClean.includes('*') || textLower.includes('asterisk')) pSymbols.push('*');
    if (textClean.includes('#') || textLower.includes('hashtag')) pSymbols.push('#');
    if (textClean.includes('@') || textLower.includes('mention')) pSymbols.push('@');
    if (textLower.includes('emoji')) pSymbols.push('Emoji');

    setProhibitedSymbols(pSymbols);
    setApprovedSymbols(aSymbols);
    setSymbolMode(pSymbols.length > 0 && aSymbols.length > 0 ? 'tiered' : aSymbols.length > 0 ? 'approved' : 'prohibited');

    // 4. Persons / Ambasssadors
    const pPersons: string[] = [];
    const aPersons: string[] = [];
    if (textLower.includes('roshan') || textLower.includes('hritik')) aPersons.push('Hritik Roshan');
    setApprovedPersons(aPersons);
    setProhibitedPersons(pPersons);
    setPersonMode(aPersons.length > 0 && pPersons.length > 0 ? 'tiered' : aPersons.length > 0 ? 'approved' : 'prohibited');

    // 5. Baseline rules
    setProhibit100Claims(textLower.includes('100%'));
    setProhibitGuarantees(textLower.includes('guarantee'));
    setProhibitCompetitorClaims(textLower.includes('competitor'));
    setRequireTermsDisclaimer(textLower.includes('terms and conditions') || textLower.includes('disclaimer'));
  };

  // Compile Form State to Document Text
  const compileFormToDocumentText = () => {
    const rulesList: string[] = [];
    let ruleNum = 1;

    // 1. Voice & Tone
    if (toneMode === 'approved' && preferredTones.length > 0) {
      rulesList.push(`${ruleNum}. Tone & Voice (Strict Allowlist): Copy must exclusively reflect: ${preferredTones.join(', ')}. All unlisted tones are prohibited.`);
      ruleNum++;
    } else if (toneMode === 'prohibited' && prohibitedTones.length > 0) {
      rulesList.push(`${ruleNum}. Tone & Voice (Strict Blocklist): Prohibited emotional tones: ${prohibitedTones.join(', ')}. All other professional tones permitted.`);
      ruleNum++;
    } else if (preferredTones.length > 0 || prohibitedTones.length > 0) {
      rulesList.push(`${ruleNum}. Tone & Voice (Preferred & Not Preferred): Approved voice: ${preferredTones.join(', ') || 'Professional'}. Unwanted tones: ${prohibitedTones.join(', ') || 'Aggressive'}. Unlisted tones are considered neutral.`);
      ruleNum++;
    }

    // 2. Symbols & Punctuation
    if (symbolMode === 'approved' && approvedSymbols.length > 0) {
      rulesList.push(`${ruleNum}. Approved Symbols & Punctuation (Strict Allowlist): Only ${approvedSymbols.map(s => `'${s}'`).join(', ')} permitted. All other symbols are strictly prohibited.`);
      ruleNum++;
    } else if (symbolMode === 'prohibited' && prohibitedSymbols.length > 0) {
      rulesList.push(`${ruleNum}. Prohibited Symbols & Punctuation (Strict Blocklist): Use of ${prohibitedSymbols.map(s => `'${s}'`).join(', ')} is strictly prohibited. Standard punctuation is permitted.`);
      ruleNum++;
    } else if (symbolMode === 'tiered' && (approvedSymbols.length > 0 || prohibitedSymbols.length > 0)) {
      const aList = approvedSymbols.length > 0 ? approvedSymbols.map(s => `'${s}'`).join(', ') : 'None specified';
      const pList = prohibitedSymbols.length > 0 ? prohibitedSymbols.map(s => `'${s}'`).join(', ') : 'None specified';
      rulesList.push(`${ruleNum}. Symbols & Punctuation (Preferred & Not Preferred): Approved symbols: ${aList}. Prohibited symbols: ${pList}. Unlisted standard punctuation is considered neutral.`);
      ruleNum++;
    }

    // 3. Prohibited Vocabulary
    if (bannedWords.length > 0) {
      rulesList.push(`${ruleNum}. Prohibited Vocabulary: Banned terms ${bannedWords.map(w => `'${w}'`).join(', ')} must not appear in marketing copy.`);
      ruleNum++;
    }

    // 4. Company Mentions
    if (companyMode === 'approved' && approvedCompanies.length > 0) {
      rulesList.push(`${ruleNum}. Approved Brand Partners (Strict Allowlist): Only authorized partners: ${approvedCompanies.join(', ')}. All other company mentions are strictly prohibited.`);
      ruleNum++;
    } else if (companyMode === 'prohibited' && prohibitedCompanies.length > 0) {
      rulesList.push(`${ruleNum}. Prohibited Competitor Brands (Strict Blocklist): Mentions of competitors: ${prohibitedCompanies.join(', ')} are strictly prohibited. Other brands are permitted.`);
      ruleNum++;
    } else if (approvedCompanies.length > 0 || prohibitedCompanies.length > 0) {
      rulesList.push(`${ruleNum}. Company Mentions (Preferred & Not Preferred): Approved partners: ${approvedCompanies.join(', ') || 'None'}. Prohibited competitors: ${prohibitedCompanies.join(', ') || 'None'}. Unlisted companies are neutral.`);
      ruleNum++;
    }

    // 5. Spokespersons
    if (personMode === 'approved' && approvedPersons.length > 0) {
      rulesList.push(`${ruleNum}. Approved Brand Spokespersons (Strict Allowlist): Only authorized ambassadors: ${approvedPersons.join(', ')} may be mentioned. All other person names are prohibited.`);
      ruleNum++;
    } else if (personMode === 'prohibited' && prohibitedPersons.length > 0) {
      rulesList.push(`${ruleNum}. Prohibited Person Names (Strict Blocklist): Names: ${prohibitedPersons.join(', ')} are strictly prohibited.`);
      ruleNum++;
    } else if (approvedPersons.length > 0 || prohibitedPersons.length > 0) {
      rulesList.push(`${ruleNum}. Spokesperson Governance (Preferred & Not Preferred): Authorized ambassadors: ${approvedPersons.join(', ') || 'None'}. Prohibited names: ${prohibitedPersons.join(', ') || 'None'}.`);
      ruleNum++;
    }

    // 6. Copy Rules
    if (prohibit100Claims) {
      rulesList.push(`${ruleNum}. Absolute Claims: Avoid unprovable absolute promises or '100%' statistical claims.`);
      ruleNum++;
    }
    if (prohibitGuarantees) {
      rulesList.push(`${ruleNum}. Unsubstantiated Guarantees: Flags 'guarantee' or 'guaranteed' without legal substantiation.`);
      ruleNum++;
    }
    if (prohibitCompetitorClaims) {
      rulesList.push(`${ruleNum}. Competitive Benchmarking: Unapproved comparative benchmark claims are prohibited.`);
      ruleNum++;
    }
    if (requireTermsDisclaimer) {
      rulesList.push(`${ruleNum}. Legal Disclaimers: Free tier claims must carry 'Terms and conditions apply.'`);
      ruleNum++;
    }

    // 7. Visual & Color Governance
    const aNames = approvedColors.map(c => `${c.name} (${c.hex})`).join(', ');
    const pNames = prohibitedColors.map(c => `${c.name} (${c.hex})`).join(', ');
    const pRangeNames = prohibitedRanges.map(r => `${r.name} (Hue ${r.hueMin}°–${r.hueMax}°)`).join(', ');
    const allProhibitedDesc = [pRangeNames, pNames].filter(Boolean).join(' and ');

    if (colorMode === 'approved' && approvedColors.length > 0) {
      rulesList.push(`${ruleNum}. Brand Color Palette (Strict Allowlist): Restricted to approved brand palette: ${aNames}. All other colors outside this list are strictly prohibited.`);
      ruleNum++;
    } else if (colorMode === 'prohibited' && allProhibitedDesc) {
      rulesList.push(`${ruleNum}. Prohibited Poster Colors (Strict Blocklist): Use of ${allProhibitedDesc} is strictly prohibited. All other colors outside this list are approved.`);
      ruleNum++;
    } else if (colorMode === 'tiered' && (approvedColors.length > 0 || allProhibitedDesc)) {
      rulesList.push(`${ruleNum}. Color Governance (Preferred & Not Preferred): Preferred palette: ${aNames || 'None specified'}. Prohibited shades: ${allProhibitedDesc || 'None'}. Unlisted colors are considered neutral.`);
      ruleNum++;
    }

    if (includeStandardRules) {
      rulesList.push(`${ruleNum}. WCAG 2.1 Contrast Baseline: Minimum ISO/IEC 40500 AA contrast ratio (4.5:1) required.`);
      ruleNum++;
    }

    return [
      `# ${policyTitle}`,
      `# Version: ${policyVersion}`,
      `# Description: ${policyDescription}`,
      '',
      rulesList.join('\n')
    ].join('\n');
  };

  const handleSavePolicy = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const compiledDocumentText = builderTab === 'document' ? rawDocumentContent : compileFormToDocumentText();

    const payload = {
      title: policyTitle.trim() || 'Custom Policy',
      version: policyVersion.trim() || '1.0',
      description: policyDescription.trim(),
      raw_text: compiledDocumentText,
      include_standard_rules: includeStandardRules,
      color_mode: colorMode,
      tone_mode: toneMode,
      symbol_mode: symbolMode,
      company_mode: companyMode,
      person_mode: personMode,
      approved_palette: approvedColors.map(c => c.hex),
      prohibited_colors: prohibitedColors.map(c => c.name),
      prohibited_ranges: prohibitedRanges,
      preferred_tones: preferredTones,
      prohibited_tones: prohibitedTones,
      approved_symbols: approvedSymbols,
      prohibited_symbols: prohibitedSymbols,
      approved_companies: approvedCompanies,
      prohibited_companies: prohibitedCompanies,
      allowed_ambassadors: approvedPersons,
      prohibited_persons: prohibitedPersons,
      banned_words: bannedWords,
      prohibit_100_claims: prohibit100Claims,
      prohibit_guarantees: prohibitGuarantees,
      prohibit_competitor_claims: prohibitCompetitorClaims,
      require_terms_disclaimer: requireTermsDisclaimer,
    };

    try {
      const res = await fetch(`${API_BASE}/api/create-guideline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to save brand policy');
      }

      const data = await res.json();

      // Update localStorage for immediate frontend sync
      try {
        localStorage.setItem('active_guideline_rules', JSON.stringify({
          id: data.guideline_id,
          filename: data.filename,
          rules: data.extracted_rules,
          full_content: data.raw_text,
        }));
      } catch {}

      setSuccessMsg(`Policy "${data.filename}" saved and indexed successfully! Redirecting...`);
      setTimeout(() => {
        router.push(`/guidelines?saved=${encodeURIComponent(data.filename)}`);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving policy.');
      setSubmitting(false);
    }
  };

  // Helper actions
  const addApprovedColor = () => {
    if (!newColorHex) return;
    const cleanHex = newColorHex.toUpperCase();
    if (!approvedColors.some(c => c.hex === cleanHex)) {
      setApprovedColors(prev => [...prev, { hex: cleanHex, name: newColorName.trim() || cleanHex }]);
      setNewColorName('');
    }
  };
  const removeApprovedColor = (idx: number) => {
    setApprovedColors(prev => prev.filter((_, i) => i !== idx));
  };

  const addProhibitedColor = () => {
    if (!newProhibitHex) return;
    const cleanHex = newProhibitHex.toUpperCase();
    if (!prohibitedColors.some(c => c.hex === cleanHex)) {
      setProhibitedColors(prev => [...prev, { hex: cleanHex, name: newProhibitName.trim() || cleanHex }]);
      setNewProhibitName('');
    }
  };
  const removeProhibitedColor = (idx: number) => {
    setProhibitedColors(prev => prev.filter((_, i) => i !== idx));
  };

  const addProhibitedRange = (item: ColorRangeItem) => {
    if (!prohibitedRanges.some(r => r.id === item.id)) {
      setProhibitedRanges(prev => [...prev, item]);
    }
  };
  const removeProhibitedRange = (id: string) => {
    setProhibitedRanges(prev => prev.filter(r => r.id !== id));
  };

  const addCustomBannedRange = () => {
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
    const name = customRangeName.trim() || `Custom Banned Shade (${customRangeBase} ±${customRangeTolerance}°)`;

    const customItem: ColorRangeItem = {
      id: `custom_${Date.now()}`,
      name,
      family: 'custom',
      hueMin,
      hueMax,
      desc: `Hue range ${hueMin}°–${hueMax}° around ${customRangeBase}`,
      gradient: `linear-gradient(to right, hsl(${hueMin}, 75%, 65%), ${customRangeBase}, hsl(${hueMax}, 75%, 35%))`
    };

    setProhibitedRanges(prev => [...prev, customItem]);
    setShowCustomRangeBuilder(false);
    setCustomRangeName('');
  };

  const toggleApprovedSymbol = (sym: string) => {
    if (approvedSymbols.includes(sym)) {
      setApprovedSymbols(prev => prev.filter(s => s !== sym));
    } else {
      setApprovedSymbols(prev => [...prev, sym]);
      setProhibitedSymbols(prev => prev.filter(s => s !== sym));
    }
  };

  const toggleProhibitedSymbol = (sym: string) => {
    if (prohibitedSymbols.includes(sym)) {
      setProhibitedSymbols(prev => prev.filter(s => s !== sym));
    } else {
      setProhibitedSymbols(prev => [...prev, sym]);
      setApprovedSymbols(prev => prev.filter(s => s !== sym));
    }
  };

  const addCustomSymbol = (target: 'approved' | 'prohibited') => {
    const clean = customSymbolInput.trim();
    if (!clean) return;
    if (target === 'approved') {
      if (!approvedSymbols.includes(clean)) setApprovedSymbols(prev => [...prev, clean]);
      setProhibitedSymbols(prev => prev.filter(s => s !== clean));
    } else {
      if (!prohibitedSymbols.includes(clean)) setProhibitedSymbols(prev => [...prev, clean]);
      setApprovedSymbols(prev => prev.filter(s => s !== clean));
    }
    setCustomSymbolInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* ── Top Header Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/guidelines"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Return to Guidelines Library"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {editId ? 'Editing Policy Version' : 'New Policy Specification'}
                </span>
                <span className="text-xs text-slate-400 font-mono">v{policyVersion}</span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                {policyTitle || 'Brand Governance Policy Studio'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            {/* Visual Builder vs Document Editor Tab Switcher */}
            <div className="p-0.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (builderTab === 'document') {
                    parseTextIntoFormState(rawDocumentContent);
                  }
                  setBuilderTab('form');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  builderTab === 'form' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Visual Builder</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (builderTab === 'form') {
                    setRawDocumentContent(compileFormToDocumentText());
                  }
                  setBuilderTab('document');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  builderTab === 'document' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Document Editor</span>
              </button>
            </div>

            <Link
              href="/guidelines"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </Link>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSavePolicy}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving &amp; Indexing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Save &amp; Index Policy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Status Alerts ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* ── Main Workspace ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">
        {loadingEdit ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-xs text-slate-400 shadow-2xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <p>Loading guideline specification and parsing active rules...</p>
          </div>
        ) : builderTab === 'document' ? (
          /* ── Raw Document Text Editor ── */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Direct Guideline Document Text</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Edit the raw policy text directly. Switch to Visual Builder anytime to inspect parsed rules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => parseTextIntoFormState(rawDocumentContent)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Sync to Form</span>
              </button>
            </div>
            <textarea
              value={rawDocumentContent}
              onChange={e => setRawDocumentContent(e.target.value)}
              rows={20}
              className="w-full p-4 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 bg-slate-50/50 leading-relaxed focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:bg-white transition-all shadow-inner"
              placeholder="Paste or write guideline specification rules..."
            />
          </div>
        ) : (
          /* ── Full Spacious Visual Form Builder ── */
          <div className="space-y-6">
            {/* Policy Metadata Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Policy Specification Title
                  </label>
                  <input
                    type="text"
                    value={policyTitle}
                    onChange={e => setPolicyTitle(e.target.value)}
                    placeholder="e.g. TechCorp Global Brand Guidelines"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-semibold"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Version Number
                  </label>
                  <input
                    type="text"
                    value={policyVersion}
                    onChange={e => setPolicyVersion(e.target.value)}
                    placeholder="1.0"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono"
                  />
                </div>
                <div className="md:col-span-12">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Scope &amp; Description
                  </label>
                  <input
                    type="text"
                    value={policyDescription}
                    onChange={e => setPolicyDescription(e.target.value)}
                    placeholder="Brief description of brand rules, audience, and governance scope"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Standard Baseline Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mt-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Include Enterprise Standard Baseline</span>
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Automatically applies ISO/IEC 40500 WCAG 2.1 AA text contrast ratio (4.5:1), unprovable guarantee restrictions, and terms disclaimers.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={includeStandardRules}
                    onChange={e => setIncludeStandardRules(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* 1. COLOR GOVERNANCE MATRIX */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <span>Color Governance Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define approved brand palette swatches and prohibited colors/spectrum ranges.
                  </p>
                </div>

                {/* 3-Mode Selector */}
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setColorMode('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      colorMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>1) Approved Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('prohibited')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      colorMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <X className="w-3 h-3" />
                    <span>2) Prohibited Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('tiered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      colorMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>3) Preferred &amp; Not Preferred</span>
                  </button>
                </div>
              </div>

              {/* Mode Notice Banner */}
              <div className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                colorMode === 'approved'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : colorMode === 'prohibited'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}>
                <span className="font-bold shrink-0">
                  {colorMode === 'approved' ? 'Option 1 (Strict Allowlist):' : colorMode === 'prohibited' ? 'Option 2 (Strict Blocklist):' : 'Option 3 (Preferred & Not Preferred):'}
                </span>
                <span>
                  {colorMode === 'approved'
                    ? 'Only specific brand palette colors added below are permitted. Everything outside this list is strictly prohibited during visual audits.'
                    : colorMode === 'prohibited'
                    ? 'Only the colors and shade spectrums added below are banned. All other colors outside this list are automatically approved.'
                    : 'Preferred colors are approved, prohibited colors and shades are banned, and unlisted colors will be considered Neutral.'}
                </span>
              </div>

              {/* Dynamic Approved Palette Swatch Preview */}
              {(colorMode === 'approved' || colorMode === 'tiered') && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Approved Brand Palette Preview</span>
                    <span className="font-mono text-xs font-bold text-indigo-600">
                      {approvedColors.length} Colors Defined
                    </span>
                  </div>
                  <div className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 flex flex-wrap items-center gap-2">
                    {approvedColors.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No approved brand swatches specified (0 colors)</span>
                    ) : (
                      approvedColors.map((col, idx) => (
                        <span
                          key={`preview-${idx}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white text-slate-900 shadow-2xs border border-slate-200"
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: col.hex }} />
                          {col.name ? `${col.name} (${col.hex})` : col.hex}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Grid: Approved (Swatches only) vs Prohibited (Swatches + Spectrum) */}
              <div className={`grid gap-6 ${colorMode === 'tiered' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* ── Approved Colors (SPECIFIC SWATCHES ONLY - NO SPECTRUM) ── */}
                {(colorMode === 'approved' || colorMode === 'tiered') && (
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        {colorMode === 'approved' ? 'Approved Brand Palette (Strict Allowlist)' : 'Approved Brand Palette (Wanted)'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{approvedColors.length} colors</span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Specify exact official brand colors (e.g. Primary Indigo, Navy). In strict allowlist mode, any color outside these swatches is prohibited.
                    </p>

                    {/* Active Approved Swatches */}
                    <div className="flex flex-wrap gap-2 min-h-[44px] items-center">
                      {approvedColors.length === 0 ? (
                        <div className="w-full py-3 px-3 rounded-xl border border-dashed border-slate-200 bg-white text-center">
                          <p className="text-xs text-slate-400 italic">No approved colors defined yet. Add swatches below.</p>
                        </div>
                      ) : (
                        approvedColors.map((color, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 shadow-2xs"
                          >
                            <span
                              className="w-4 h-4 rounded-md border border-black/10 shrink-0"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="font-semibold">{color.name}</span>
                            <span className="font-mono text-[11px] text-slate-500">{color.hex}</span>
                            <button
                              type="button"
                              onClick={() => removeApprovedColor(index)}
                              className="text-slate-400 hover:text-rose-600 transition-colors ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Approved Swatch */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={e => setNewColorHex(e.target.value)}
                        className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                        title="Pick color"
                      />
                      <input
                        type="text"
                        value={newColorName}
                        onChange={e => setNewColorName(e.target.value)}
                        placeholder="Color label (e.g. Electric Violet, Teal, Navy)"
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:ring-1 focus:ring-slate-900"
                      />
                      <button
                        type="button"
                        onClick={addApprovedColor}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Swatch
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Prohibited Colors (SWATCHES + SPECTRUM/RANGE) ── */}
                {(colorMode === 'prohibited' || colorMode === 'tiered') && (
                  <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-200/80 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        {colorMode === 'prohibited' ? 'Prohibited Poster Colors (Strict Blocklist)' : 'Prohibited Poster Colors (Unwanted)'}
                      </span>
                      <span className="text-xs text-rose-500 font-mono">
                        {prohibitedColors.length} colors · {prohibitedRanges.length} spectrums
                      </span>
                    </div>

                    {/* 1. Specific Banned Hex Swatches */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        1. Specific Banned Hex Colors
                      </span>
                      <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                        {prohibitedColors.length === 0 ? (
                          <p className="text-xs text-rose-400 italic">No specific hex colors banned.</p>
                        ) : (
                          prohibitedColors.map((color, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-xs text-rose-950 shadow-2xs"
                            >
                              <span
                                className="w-4 h-4 rounded-md border border-black/10 shrink-0"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="font-semibold">{color.name}</span>
                              <span className="font-mono text-[11px] text-rose-600">{color.hex}</span>
                              <button
                                type="button"
                                onClick={() => removeProhibitedColor(index)}
                                className="text-rose-400 hover:text-rose-700 transition-colors ml-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Specific Prohibited Swatch */}
                      <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60">
                        <input
                          type="color"
                          value={newProhibitHex}
                          onChange={e => setNewProhibitHex(e.target.value)}
                          className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                          title="Pick prohibited color"
                        />
                        <input
                          type="text"
                          value={newProhibitName}
                          onChange={e => setNewProhibitName(e.target.value)}
                          placeholder="Name (e.g. Neon Green, Red)"
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:ring-1 focus:ring-slate-900"
                        />
                        <button
                          type="button"
                          onClick={addProhibitedColor}
                          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Ban Color
                        </button>
                      </div>
                    </div>

                    {/* 2. Whole Shade Spectrums / Color Ranges (Banned Families) */}
                    <div className="pt-3 border-t border-rose-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-rose-600" />
                          <span>2. Whole Shade Spectrums (Bans Entire Color Families)</span>
                        </span>
                        <span className="text-xs text-rose-500 font-mono">{prohibitedRanges.length} active</span>
                      </div>

                      {/* Active Banned Ranges */}
                      <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                        {prohibitedRanges.length === 0 ? (
                          <p className="text-xs text-rose-400 italic">
                            No shade spectrum banned. Choose a whole color family below to ban all its shades (e.g. All Blue Shades, All Red Shades).
                          </p>
                        ) : (
                          prohibitedRanges.map((range) => (
                            <div
                              key={range.id}
                              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white text-xs text-rose-950 shadow-2xs"
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
                                className="text-rose-400 hover:text-rose-800 transition-colors ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Preset Shade Spectrum Chips */}
                      <div className="bg-white p-3 rounded-xl border border-rose-200 space-y-2">
                        <div className="text-[10px] font-semibold text-rose-900">
                          Quick-Add Spectrum Range (Ban Entire Color Family):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {STANDARD_SHADE_RANGES.map((std) => {
                            const isSelected = prohibitedRanges.some(r => r.id === std.id);
                            return (
                              <button
                                key={std.id}
                                type="button"
                                onClick={() => isSelected ? removeProhibitedRange(std.id) : addProhibitedRange(std)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                                  isSelected
                                    ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
                                }`}
                              >
                                <span className="w-3.5 h-2 rounded-sm shrink-0" style={{ background: std.gradient }} />
                                <span>{std.name}</span>
                                {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setShowCustomRangeBuilder(!showCustomRangeBuilder)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                              showCustomRangeBuilder
                                ? 'bg-rose-600 text-white border-rose-700'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            <Sliders className="w-3 h-3" />
                            <span>+ Custom Spectrum...</span>
                          </button>
                        </div>
                      </div>

                      {/* Custom Spectrum Builder */}
                      {showCustomRangeBuilder && (
                        <div className="p-4 bg-white border border-rose-200 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-rose-600" />
                              <span>Build Custom Shade Spectrum (Prohibited)</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowCustomRangeBuilder(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                Center Base Color
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={customRangeBase}
                                  onChange={e => setCustomRangeBase(e.target.value)}
                                  className="w-9 h-9 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                                />
                                <input
                                  type="text"
                                  value={customRangeBase}
                                  onChange={e => setCustomRangeBase(e.target.value)}
                                  className="w-28 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50"
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-slate-600 uppercase">
                                  Hue Spectrum Tolerance
                                </label>
                                <span className="text-xs font-mono font-bold text-rose-600">
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
                              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>Narrow (±10°)</span>
                                <span>Wide (±50°)</span>
                              </div>
                            </div>
                          </div>

                          {/* Calculated Spectrum Preview */}
                          <div>
                            <div className="text-[10px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                              <span>Calculated Hue Spectrum:</span>
                              <span className="font-mono text-xs text-rose-700">
                                Hue {customSpectrumPreview.hueMin}° – {customSpectrumPreview.hueMax}°
                              </span>
                            </div>
                            <div
                              className="h-8 w-full rounded-xl border border-black/10 shadow-inner flex items-center justify-center text-xs font-bold text-white drop-shadow"
                              style={{ background: customSpectrumPreview.gradient }}
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
                              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={addCustomBannedRange}
                              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0 shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
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

            {/* 2. BRAND VOICE & TONE STANDARDS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span>Brand Voice &amp; Tone Standards</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select approved corporate voice traits and strictly banned emotional tones.
                  </p>
                </div>

                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setToneMode('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      toneMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>1) Approved Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToneMode('prohibited')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      toneMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <X className="w-3 h-3" />
                    <span>2) Prohibited Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToneMode('tiered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      toneMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>3) Preferred &amp; Not Preferred</span>
                  </button>
                </div>
              </div>

              <div className={`grid gap-6 ${toneMode === 'tiered' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {(toneMode === 'approved' || toneMode === 'tiered') && (
                  <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        {toneMode === 'approved' ? 'Approved Tone (Strict Allowlist)' : 'Preferred Tone (Approved Voice)'}
                      </span>
                      <span className="text-xs text-emerald-600 font-mono">{preferredTones.length} selected</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STANDARD_PREFERRED_TONES.map(tone => {
                        const isSelected = preferredTones.includes(tone);
                        return (
                          <button
                            key={tone}
                            type="button"
                            onClick={() => {
                              if (isSelected) setPreferredTones(prev => prev.filter(t => t !== tone));
                              else setPreferredTones(prev => [...prev, tone]);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{tone}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(toneMode === 'prohibited' || toneMode === 'tiered') && (
                  <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        {toneMode === 'prohibited' ? 'Prohibited Tones (Strict Blocklist)' : 'Prohibited Tones (Unwanted Voice)'}
                      </span>
                      <span className="text-xs text-rose-600 font-mono">{prohibitedTones.length} banned</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STANDARD_PROHIBITED_TONES.map(tone => {
                        const isSelected = prohibitedTones.includes(tone);
                        return (
                          <button
                            key={tone}
                            type="button"
                            onClick={() => {
                              if (isSelected) setProhibitedTones(prev => prev.filter(t => t !== tone));
                              else setProhibitedTones(prev => [...prev, tone]);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                            }`}
                          >
                            <span>{isSelected ? '✕' : '+'}</span>
                            <span>{tone}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. SYMBOLS & PUNCTUATION GOVERNANCE (WITH APPROVED FOR TIERED!) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    <span>Symbols &amp; Punctuation Governance</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure allowed punctuation marks and prohibited promotional symbols.
                  </p>
                </div>

                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSymbolMode('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      symbolMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>1) Approved Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSymbolMode('prohibited')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      symbolMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <X className="w-3 h-3" />
                    <span>2) Prohibited Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSymbolMode('tiered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      symbolMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>3) Preferred &amp; Not Preferred</span>
                  </button>
                </div>
              </div>

              {/* Mode Notice Banner */}
              <div className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                symbolMode === 'approved'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : symbolMode === 'prohibited'
                  ? 'bg-rose-50 text-rose-900 border-rose-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200'
              }`}>
                <span className="font-bold shrink-0">
                  {symbolMode === 'approved' ? 'Option 1 (Strict Allowlist):' : symbolMode === 'prohibited' ? 'Option 2 (Strict Blocklist):' : 'Option 3 (Preferred & Not Preferred):'}
                </span>
                <span>
                  {symbolMode === 'approved'
                    ? 'Only selected symbols are permitted. All unselected symbols/punctuation are strictly prohibited.'
                    : symbolMode === 'prohibited'
                    ? 'Selected symbols are prohibited. Standard punctuation marks outside this list are permitted.'
                    : 'Selected symbols in Approved are permitted, symbols in Prohibited are strictly banned, and unlisted standard punctuation marks are considered Neutral.'}
                </span>
              </div>

              {/* Grid: Approved vs Prohibited Symbols */}
              <div className={`grid gap-6 ${symbolMode === 'tiered' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* ── Approved / Allowed Symbols ── */}
                {(symbolMode === 'approved' || symbolMode === 'tiered') && (
                  <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        {symbolMode === 'approved' ? 'Approved Symbols (Strict Allowlist)' : 'Approved / Allowed Symbols'}
                      </span>
                      <span className="text-xs text-emerald-600 font-mono">{approvedSymbols.length} permitted</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {STANDARD_SYMBOLS.map(item => {
                        const isAllowed = approvedSymbols.includes(item.symbol);
                        return (
                          <button
                            key={`app-${item.symbol}`}
                            type="button"
                            onClick={() => toggleApprovedSymbol(item.symbol)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                              isAllowed
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              isAllowed ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.symbol === 'Emoji' ? '😊' : item.symbol}
                            </span>
                            <span className="text-xs font-semibold truncate">{item.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Allowed Symbol */}
                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
                      <input
                        type="text"
                        value={customSymbolInput}
                        onChange={e => setCustomSymbolInput(e.target.value)}
                        placeholder="Add custom allowed symbol (e.g. '&', '+')"
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => addCustomSymbol('approved')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                      >
                        + Allow
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Prohibited / Banned Symbols ── */}
                {(symbolMode === 'prohibited' || symbolMode === 'tiered') && (
                  <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        {symbolMode === 'prohibited' ? 'Prohibited Symbols (Strict Blocklist)' : 'Prohibited Symbols (Blocklist)'}
                      </span>
                      <span className="text-xs text-rose-600 font-mono">{prohibitedSymbols.length} banned</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {STANDARD_SYMBOLS.map(item => {
                        const isBanned = prohibitedSymbols.includes(item.symbol);
                        return (
                          <button
                            key={`ban-${item.symbol}`}
                            type="button"
                            onClick={() => toggleProhibitedSymbol(item.symbol)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                              isBanned
                                ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                              isBanned ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.symbol === 'Emoji' ? '😊' : item.symbol}
                            </span>
                            <span className="text-xs font-semibold truncate">{item.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Add Custom Banned Symbol */}
                    <div className="flex items-center gap-2 pt-2 border-t border-rose-200/60">
                      <input
                        type="text"
                        value={customSymbolInput}
                        onChange={e => setCustomSymbolInput(e.target.value)}
                        placeholder="Add custom banned symbol (e.g. '~', '^')"
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => addCustomSymbol('prohibited')}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                      >
                        + Ban
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. COMPANY & BRAND GOVERNANCE MATRIX */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Company &amp; Brand Governance Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Allow partner / collaboration mentions while prohibiting direct competitor names.
                  </p>
                </div>

                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setCompanyMode('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      companyMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>1) Approved Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyMode('prohibited')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      companyMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <X className="w-3 h-3" />
                    <span>2) Prohibited Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanyMode('tiered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      companyMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>3) Preferred &amp; Not Preferred</span>
                  </button>
                </div>
              </div>

              <div className={`grid gap-6 ${companyMode === 'tiered' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {(companyMode === 'approved' || companyMode === 'tiered') && (
                  <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Approved Brand Partners &amp; Collaborations
                    </span>
                    <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                      {approvedCompanies.length === 0 ? (
                        <p className="text-xs text-emerald-600/70 italic">No approved partner companies added.</p>
                      ) : (
                        approvedCompanies.map(c => (
                          <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs">
                            {c}
                            <button type="button" onClick={() => setApprovedCompanies(prev => prev.filter(x => x !== c))} className="text-emerald-500 hover:text-rose-600">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
                      <input
                        type="text"
                        value={newApprovedCompany}
                        onChange={e => setNewApprovedCompany(e.target.value)}
                        placeholder="Partner name (e.g. AWS, Stripe)"
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newApprovedCompany.trim()) {
                            setApprovedCompanies(prev => [...prev, newApprovedCompany.trim()]);
                            setNewApprovedCompany('');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        + Partner
                      </button>
                    </div>
                  </div>
                )}

                {(companyMode === 'prohibited' || companyMode === 'tiered') && (
                  <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-200/80 space-y-3">
                    <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Prohibited Competitor Brands (Banned)
                    </span>
                    <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                      {prohibitedCompanies.length === 0 ? (
                        <p className="text-xs text-rose-600/70 italic">No prohibited competitors added.</p>
                      ) : (
                        prohibitedCompanies.map(c => (
                          <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-900 shadow-2xs">
                            {c}
                            <button type="button" onClick={() => setProhibitedCompanies(prev => prev.filter(x => x !== c))} className="text-rose-500 hover:text-rose-700">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-rose-200/60">
                      <input
                        type="text"
                        value={newProhibitedCompany}
                        onChange={e => setNewProhibitedCompany(e.target.value)}
                        placeholder="Competitor name (e.g. Oracle, CompetitorX)"
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newProhibitedCompany.trim()) {
                            setProhibitedCompanies(prev => [...prev, newProhibitedCompany.trim()]);
                            setNewProhibitedCompany('');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                      >
                        + Ban Competitor
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. SPOKESPERSON & ENTITY GOVERNANCE MATRIX */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Entity &amp; Spokesperson Governance</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Allow official brand ambassadors while flagging unauthorized personal names.
                  </p>
                </div>

                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPersonMode('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      personMode === 'approved' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>1) Approved Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonMode('prohibited')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      personMode === 'prohibited' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <X className="w-3 h-3" />
                    <span>2) Prohibited Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonMode('tiered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      personMode === 'tiered' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>3) Preferred &amp; Not Preferred</span>
                  </button>
                </div>
              </div>

              <div className={`grid gap-6 ${personMode === 'tiered' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                {(personMode === 'approved' || personMode === 'tiered') && (
                  <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Approved Brand Ambassadors &amp; Spokespersons
                    </span>
                    <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                      {approvedPersons.length === 0 ? (
                        <p className="text-xs text-emerald-600/70 italic">No authorized ambassadors added.</p>
                      ) : (
                        approvedPersons.map(p => (
                          <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-bold text-emerald-900 shadow-2xs">
                            {p}
                            <button type="button" onClick={() => setApprovedPersons(prev => prev.filter(x => x !== p))} className="text-emerald-500 hover:text-rose-600">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
                      <input
                        type="text"
                        value={newApprovedPerson}
                        onChange={e => setNewApprovedPerson(e.target.value)}
                        placeholder="Ambassador name (e.g. Hritik Roshan)"
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newApprovedPerson.trim()) {
                            setApprovedPersons(prev => [...prev, newApprovedPerson.trim()]);
                            setNewApprovedPerson('');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        + Ambassador
                      </button>
                    </div>
                  </div>
                )}

                {(personMode === 'prohibited' || personMode === 'tiered') && (
                  <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-200/80 space-y-3">
                    <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Prohibited Person Names (Unauthorized Endorsements)
                    </span>
                    <div className="flex flex-wrap gap-2 min-h-[36px] items-center">
                      {prohibitedPersons.length === 0 ? (
                        <p className="text-xs text-rose-600/70 italic">No specific person names prohibited.</p>
                      ) : (
                        prohibitedPersons.map(p => (
                          <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-900 shadow-2xs">
                            {p}
                            <button type="button" onClick={() => setProhibitedPersons(prev => prev.filter(x => x !== p))} className="text-rose-500 hover:text-rose-700">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-rose-200/60">
                      <input
                        type="text"
                        value={newProhibitedPerson}
                        onChange={e => setNewProhibitedPerson(e.target.value)}
                        placeholder="Person name to prohibit"
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newProhibitedPerson.trim()) {
                            setProhibitedPersons(prev => [...prev, newProhibitedPerson.trim()]);
                            setNewProhibitedPerson('');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                      >
                        + Ban Name
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. PROHIBITED VOCABULARY & COPY CLAIMS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Banned Words Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                  Prohibited Vocabulary &amp; Banned Words
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bannedWords.map(w => (
                    <span key={w} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-900">
                      {w}
                      <button type="button" onClick={() => setBannedWords(prev => prev.filter(x => x !== w))} className="text-rose-400 hover:text-rose-700">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newBannedWord}
                    onChange={e => setNewBannedWord(e.target.value)}
                    placeholder="Add banned term (e.g. '100% free')"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newBannedWord.trim()) {
                        setBannedWords(prev => [...prev, newBannedWord.trim()]);
                        setNewBannedWord('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    + Ban Word
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 block mb-1">Suggested quick additions:</span>
                  <div className="flex flex-wrap gap-1">
                    {SUGGESTED_BANNED_WORDS.map(sw => (
                      <button
                        key={sw}
                        type="button"
                        onClick={() => {
                          if (!bannedWords.includes(sw)) setBannedWords(prev => [...prev, sw]);
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium"
                      >
                        + {sw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Baseline Copy & Claims Toggles */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
                  Copy &amp; Claim Rules Baseline
                </span>
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Prohibit 100% Absolute Claims</span>
                    <span className="text-[11px] text-slate-400">Bans absolute "100%" or superlative promises</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prohibit100Claims}
                    onChange={e => setProhibit100Claims(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Prohibit Guarantees</span>
                    <span className="text-[11px] text-slate-400">Flags "guaranteed" or "guarantee" promises</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prohibitGuarantees}
                    onChange={e => setProhibitGuarantees(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Prohibit Competitor Benchmarks</span>
                    <span className="text-[11px] text-slate-400">Restricts competitive comparison claims</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={prohibitCompetitorClaims}
                    onChange={e => setProhibitCompetitorClaims(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                  />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Require Terms Disclaimer</span>
                    <span className="text-[11px] text-slate-400">Demands "Terms and conditions apply" on promotions</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireTermsDisclaimer}
                    onChange={e => setRequireTermsDisclaimer(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PolicyBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-400">
        Loading Brand Policy Studio...
      </div>
    }>
      <PolicyBuilderInner />
    </Suspense>
  );
}
