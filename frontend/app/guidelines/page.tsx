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

export default function GuidelinesDirectoryPage() {
  const [guidelines, setGuidelines] = useState<GuidelineItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedDetail, setSelectedDetail] = useState<GuidelineDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showRawSource, setShowRawSource] = useState(false);

  // Brand Policy Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderSubmitting, setBuilderSubmitting] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [builderSuccess, setBuilderSuccess] = useState<string | null>(null);

  // Builder Form Fields
  const [policyTitle, setPolicyTitle] = useState('Custom Brand Policy');
  const [policyVersion, setPolicyVersion] = useState('1.0');
  const [policyDescription, setPolicyDescription] = useState('Standard brand governance rules for text copy and visual marketing assets.');
  const [includeStandardRules, setIncludeStandardRules] = useState(true);
  const [prohibit100Percent, setProhibit100Percent] = useState(true);
  const [prohibitPersonNames, setProhibitPersonNames] = useState(false);
  const [allowedAmbassadors, setAllowedAmbassadors] = useState('Hritik Roshan');
  const [prohibitQuestions, setProhibitQuestions] = useState(false);
  const [prohibitExclamations, setProhibitExclamations] = useState(false);
  const [prohibitedColors, setProhibitedColors] = useState<string[]>(['Red', 'Blue']);
  const [approvedPalette, setApprovedPalette] = useState('#4F46E5, #1E1B4B');
  const [prohibitedWords, setProhibitedWords] = useState('guarantee, always, never');
  const [customClauses, setCustomClauses] = useState('');
  const [showPreviewDoc, setShowPreviewDoc] = useState(false);

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
              id: 'techcorp-default',
              filename: 'TechCorp_Enterprise_Brand_Guidelines_v3.2.txt',
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
            id: 'techcorp-default',
            filename: 'TechCorp_Enterprise_Brand_Guidelines_v3.2.txt',
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

    // Try fetching detail from backend API
    fetch(`${API_BASE}/api/guidelines/${selectedId}`)
      .then(res => res.ok ? res.json() : null)
      .then((detail: GuidelineDetail | null) => {
        if (detail && detail.rules && detail.rules.length > 0) {
          setSelectedDetail(detail);
          setDetailLoading(false);
        } else {
          // Fallback: check localStorage or synthesize based on filename
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

    // Check localStorage
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

    // Fallback TechCorp rules
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

  const toggleColor = (colorName: string) => {
    setProhibitedColors(prev =>
      prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]
    );
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

      const content = (existing.full_content || '').toLowerCase();
      setProhibit100Percent(content.includes('100%'));
      setProhibitPersonNames(content.includes('person') || content.includes('anyone'));
      if (content.includes('hritik roshan') || content.includes('roshan')) {
        setAllowedAmbassadors('Hritik Roshan');
      }
      setProhibitQuestions(content.includes('question'));
      setProhibitExclamations(content.includes('exclamation') || content.includes('!'));
      
      const colors: string[] = [];
      if (content.includes('red')) colors.push('Red');
      if (content.includes('blue')) colors.push('Blue');
      if (content.includes('neon')) colors.push('Neon Green');
      setProhibitedColors(colors.length > 0 ? colors : ['Red', 'Blue']);
      setIncludeStandardRules(content.includes('wcag') || content.includes('guarantee'));
    } else {
      setPolicyTitle('Custom Brand Policy');
      setPolicyVersion('1.0');
      setPolicyDescription('Custom brand governance specification.');
      setIncludeStandardRules(true);
      setProhibit100Percent(true);
      setProhibitPersonNames(false);
      setAllowedAmbassadors('Hritik Roshan');
      setProhibitQuestions(false);
      setProhibitExclamations(false);
      setProhibitedColors(['Red', 'Blue']);
      setApprovedPalette('#4F46E5, #1E1B4B');
      setProhibitedWords('guarantee, always, never');
      setCustomClauses('');
    }
    setIsBuilderOpen(true);
  };

  const handleSavePolicy = async () => {
    if (!policyTitle.trim()) {
      setBuilderError('Please provide a policy title');
      return;
    }
    setBuilderSubmitting(true);
    setBuilderError(null);

    try {
      const payload = {
        title: policyTitle.trim(),
        version: policyVersion.trim() || '1.0',
        description: policyDescription.trim(),
        include_standard_rules: includeStandardRules,
        prohibit_100_percent: prohibit100Percent,
        prohibit_person_names: prohibitPersonNames,
        allowed_ambassadors: allowedAmbassadors.split(',').map(s => s.trim()).filter(Boolean),
        prohibit_questions: prohibitQuestions,
        prohibit_exclamations: prohibitExclamations,
        prohibited_colors: prohibitedColors,
        approved_palette: approvedPalette.split(',').map(s => s.trim()).filter(Boolean),
        prohibited_words: prohibitedWords.split(',').map(s => s.trim()).filter(Boolean),
        custom_rules_text: customClauses.trim() || undefined,
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
          <button
            type="button"
            onClick={() => handleOpenBuilder()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Create / Version Policy</span>
          </button>

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
                    <button
                      type="button"
                      onClick={() => handleOpenBuilder(selectedDetail)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit &amp; Version</span>
                    </button>

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
            <div className="flex items-center justify-between p-6 border-b border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Brand Policy Studio — Visual Builder &amp; Versioning
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize governance constraints, extend with industry baselines, and save indexed versions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
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
                    placeholder="e.g. TechCorp Brand Policy"
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

              {/* 2. Standard Baseline Card */}
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

              {/* 3. Custom Rule Constraints Grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Left: Copy & Tone Constraints */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Copy, Tone &amp; Punctuation Rules</span>
                  </h3>

                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Prohibit 100% Claims</span>
                        <span className="text-[11px] text-slate-500">Bans absolute &quot;100%&quot; promises</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={prohibit100Percent}
                        onChange={e => setProhibit100Percent(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Prohibit Person Names</span>
                        <span className="text-[11px] text-slate-500">Flags individual person names</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={prohibitPersonNames}
                        onChange={e => setProhibitPersonNames(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Prohibit Question Marks (?)</span>
                        <span className="text-[11px] text-slate-500">No rhetorical or interrogative copy</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={prohibitQuestions}
                        onChange={e => setProhibitQuestions(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Prohibit Exclamation Marks (!)</span>
                        <span className="text-[11px] text-slate-500">Maintains professional cadence</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={prohibitExclamations}
                        onChange={e => setProhibitExclamations(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Allowed Brand Ambassador(s)
                    </label>
                    <input
                      type="text"
                      value={allowedAmbassadors}
                      onChange={e => setAllowedAmbassadors(e.target.value)}
                      placeholder="e.g. Hritik Roshan, Sarah Connor"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Exempt from person name bans.</p>
                  </div>
                </div>

                {/* Right: Visual, Color & Words */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Visual &amp; Color Governance</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Prohibited Poster Colors
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {[
                        { name: 'Red', color: '#EF4444' },
                        { name: 'Blue', color: '#3B82F6' },
                        { name: 'Neon Green', color: '#00FF00' },
                        { name: 'Yellow', color: '#EAB308' },
                      ].map(item => {
                        const isSelected = prohibitedColors.includes(item.name);
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => toggleColor(item.name)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              isSelected
                                ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}</span>
                            {isSelected && <span className="text-[10px] text-rose-600 ml-0.5">✕</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Selected colors are deterministically detected and flagged during visual audits.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Approved Palette (Hex codes)
                    </label>
                    <input
                      type="text"
                      value={approvedPalette}
                      onChange={e => setApprovedPalette(e.target.value)}
                      placeholder="#4F46E5, #1E1B4B"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Additional Banned Terms
                    </label>
                    <input
                      type="text"
                      value={prohibitedWords}
                      onChange={e => setProhibitedWords(e.target.value)}
                      placeholder="guarantee, always, never"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Custom Policy Clauses (One per line)
                    </label>
                    <textarea
                      rows={2}
                      value={customClauses}
                      onChange={e => setCustomClauses(e.target.value)}
                      placeholder="e.g. Always include compliance badge on hero mockups."
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none font-mono"
                    />
                  </div>
                </div>
              </div>
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
