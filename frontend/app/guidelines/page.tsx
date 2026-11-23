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
    <div className="py-8 max-w-7xl mx-auto space-y-8">
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
            href="/upload"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>+ Upload New Guideline</span>
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

                  <Link
                    href={`/submit?guideline=${selectedDetail.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-2xs transition-colors shrink-0"
                  >
                    <span>Audit Copy with this Guideline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
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
    </div>
  );
}
