'use client';

/**
 * Compliance Audit Studio - VeriBrand Enterprise
 * Dual-Layer Text Copy Audit & Multi-Modal Visual Brand Governance
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://veribrand-backend.onrender.com';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Palette,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Copy,
  Check,
  ArrowRight,
  UploadCloud,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface AuditFlag {
  issue_type: string;
  severity: string;
  flagged_text: string;
  rule_citation: string;
  explanation: string;
  suggested_fix: string;
  replacement_text?: string;
  confidence: string;
}

interface AuditResponse {
  submission_id: string;
  brand_trust_score: number;
  flags: AuditFlag[];
  total_issues: number;
  rewritten_content?: string;
}

interface ColorItem {
  hex: string;
  rgb: number[];
  percentage: number;
}

interface WCAGResult {
  contrast_ratio: number;
  wcag_aa_pass: boolean;
  wcag_aaa_pass: boolean;
  background_hex?: string;
  foreground_hex?: string;
}

interface VisualAuditResponse {
  submission_id: string;
  image_dimensions: string;
  dominant_palette: ColorItem[];
  wcag_analysis: WCAGResult;
  ocr_text?: string;
  logo_detected: boolean;
  logo_assessment?: string;
  brand_trust_score: number;
  flags: AuditFlag[];
  total_issues: number;
}

interface Guideline {
  id: string;
  filename: string;
  uploaded_at: string;
}

// ─── Circular Trust Gauge ───────────────────────────────────────────────────
function TrustGauge({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = 64;
  const stroke = 8;
  const normalised = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalised;
  const progress = circumference - (displayed / 100) * circumference;

  const color =
    displayed >= 90 ? '#059669' : displayed >= 70 ? '#d97706' : '#dc2626';
  const label =
    displayed >= 90 ? 'Brand Compliant' : displayed >= 70 ? 'Review Recommended' : 'Critical Policy Drift';

  useEffect(() => {
    setDisplayed(0);
    let start = 0;
    const step = Math.max(1, Math.ceil(score / 35));
    const id = setInterval(() => {
      start += step;
      if (start >= score) {
        setDisplayed(score);
        clearInterval(id);
      } else {
        setDisplayed(start);
      }
    }, 25);
    return () => clearInterval(id);
  }, [score]);

  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative flex items-center justify-center">
        <svg width={radius * 2 + stroke} height={radius * 2 + stroke} className="-rotate-90">
          <circle
            cx={radius + stroke / 2}
            cy={radius + stroke / 2}
            r={normalised}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={stroke}
          />
          <circle
            cx={radius + stroke / 2}
            cy={radius + stroke / 2}
            r={normalised}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.05s ease' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-extrabold tracking-tight" style={{ color }}>
            {displayed}
          </span>
          <span className="text-[11px] font-medium text-slate-400">out of 100</span>
        </div>
      </div>
      <div className="text-xs font-bold uppercase tracking-wider mt-3" style={{ color }}>
        {label}
      </div>
    </div>
  );
}

// ─── Loading Pipeline Animation ─────────────────────────────────────────────
const TEXT_STEPS = [
  'Deterministic regex scan across Section 1–12 banned rules...',
  'Gemini 2.5 Flash semantic RAG grounding against ingested guidelines...',
  'Synthesizing intent-preserving compliant rewrite...',
  'Computing Brand Trust Score & generating citation matrix...',
];

const VISUAL_STEPS = [
  'Pillow quantization & dominant hex palette extraction...',
  'ISO/IEC 40500 WCAG 2.1 relative luminance contrast math...',
  'Gemini 2.5 Vision inspecting logo isolation & clear-space...',
  'OCR typography verification & claims compliance check...',
];

function AuditingAnimation({ mode }: { mode: 'text' | 'visual' }) {
  const steps = mode === 'visual' ? VISUAL_STEPS : TEXT_STEPS;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % steps.length), 1300);
    return () => clearInterval(id);
  }, [steps]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
      <div className="flex justify-center mb-6">
        <div className="w-12 h-12 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
      <p className="text-base font-bold text-slate-900 mb-1.5">
        {mode === 'visual' ? 'Auditing Visual Brand Asset...' : 'Analyzing Marketing Copy...'}
      </p>
      <p className="text-xs font-medium text-indigo-600 animate-pulse max-w-md mx-auto">
        {steps[step]}
      </p>
      <div className="flex justify-center mt-6 gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step ? 'bg-slate-900 scale-125' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Enterprise Flag Card ───────────────────────────────────────────────────
function FlagCard({
  flag,
  idx,
  onApplyFix,
}: {
  flag: AuditFlag;
  idx: number;
  onApplyFix?: (flag: AuditFlag) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isCritical = flag.severity === 'critical';
  const isWarning = flag.severity === 'warning';

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isCritical
          ? 'bg-rose-50/40 border-rose-200/80'
          : isWarning
          ? 'bg-amber-50/40 border-amber-200/80'
          : 'bg-sky-50/40 border-sky-200/80'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {isCritical ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : isWarning ? (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            ) : (
              <Info className="w-4 h-4 text-sky-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-xs text-slate-900">{flag.issue_type}</span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isCritical
                    ? 'bg-rose-100 text-rose-800'
                    : isWarning
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {flag.severity}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Confidence: <strong className="text-slate-600 capitalize">{flag.confidence}</strong>
              </span>
            </div>

            {flag.flagged_text && (
              <div className="mt-2 bg-white/90 border border-slate-200/80 rounded-md px-2.5 py-1 text-xs font-mono text-slate-800 inline-block">
                &ldquo;{flag.flagged_text}&rdquo;
              </div>
            )}

            <p className="mt-2 text-xs text-slate-600 leading-relaxed">{flag.explanation}</p>
            <p className="mt-1 text-[11px] text-slate-400 font-medium">
              Citation: <span className="text-slate-700 italic">{flag.rule_citation}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 shrink-0 ml-2 py-1 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
        >
          {expanded ? 'Hide Resolution' : 'View Fix'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-200/70 bg-white/70 rounded-lg p-3 text-xs space-y-2.5">
          <div>
            <span className="font-bold text-emerald-800 block mb-0.5">Recommended Resolution:</span>
            <p className="text-slate-700 leading-relaxed">{flag.suggested_fix}</p>
          </div>
          {onApplyFix && flag.flagged_text && (
            <button
              onClick={() => onApplyFix(flag)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Fix to Editor</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Submit Studio ─────────────────────────────────────────────────────
export default function SubmitPage() {
  const [auditMode, setAuditMode] = useState<'text' | 'visual'>('text');

  // Text State
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text');
  const [creatorName, setCreatorName] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showRewriteDiff, setShowRewriteDiff] = useState(false);
  const [copiedRewrite, setCopiedRewrite] = useState(false);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [selectedGuideline, setSelectedGuideline] = useState<string>('');
  const [includeStandardRules, setIncludeStandardRules] = useState<boolean>(false);

  // Visual State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visualResult, setVisualResult] = useState<VisualAuditResponse | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/guidelines`)
      .then(r => r.json())
      .then((data: Guideline[]) => {
        setGuidelines(data);
        if (data.length > 0) setSelectedGuideline(data[0].id);
      })
      .catch(() => {});
  }, []);

  const loadSampleBad = () => {
    setContent(
      `Introducing the BEST marketing tool you'll ever need!\n\nOur revolutionary platform GUARANTEES 100% success for your campaigns. It's absolutely FREE with no hidden costs - never worry about budget constraints again!\n\nJoin thousands of satisfied customers who have experienced unprecedented growth. We're the #1 choice for marketing professionals worldwide, and our unmatched features will transform your business overnight.\n\nGet started today and see results immediately!`
    );
    setSuccessMsg(null);
  };

  const loadSampleGood = () => {
    setContent(
      `TechCorp Analytics Platform\n\nOur marketing analytics platform helps businesses improve campaign ROI by an average of 23% (Source: TechCorp 2024 Customer Survey, n=1,200 responses, self-reported, conducted January-March 2024).\n\nKey capabilities include audience segmentation, A/B testing, and real-time performance dashboards. Over 5,000 companies use TechCorp to manage their marketing workflows.\n\nStart your 14-day pilot to evaluate fit for your team. Results may vary based on your specific use case. Terms and conditions apply. No credit card required for trial.`
    );
    setSuccessMsg(null);
  };

  const handleApplySingleFix = (flag: AuditFlag) => {
    if (!flag.flagged_text) return;
    const rep = flag.replacement_text || flag.suggested_fix;
    if (!rep) return;

    if (content.includes(flag.flagged_text)) {
      setContent(prev => prev.replace(flag.flagged_text, rep));
      setSuccessMsg(`Applied fix: Replaced "${flag.flagged_text}" with "${rep}". Re-run audit to view updated score!`);
    } else {
      const regex = new RegExp(flag.flagged_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      setContent(prev => prev.replace(regex, rep));
      setSuccessMsg(`Applied fix: "${rep}". Re-run audit to view updated score!`);
    }
  };

  const handleApplyFullRewrite = (rewritten: string) => {
    setContent(rewritten);
    setSuccessMsg('✨ Compliant rewrite applied to the editor. Click "Run Compliance Audit" to verify the updated score.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyRewrite = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRewrite(true);
    setTimeout(() => setCopiedRewrite(false), 2000);
  };

  const handleSubmitText = async () => {
    if (!content.trim()) {
      setError('Please provide marketing copy to audit');
      return;
    }
    setAuditing(true);
    setError(null);
    setResult(null);
    setSuccessMsg(null);
    try {
      const response = await fetch(`${API_BASE}/api/submit-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          content_type: contentType,
          creator_name: creatorName || 'Marketing Team',
          guideline_id: selectedGuideline || undefined,
          include_standard_rules: includeStandardRules,
        }),
      });
      if (!response.ok) throw new Error('Audit service unavailable');
      const data: AuditResponse = await response.json();
      setResult(data);
      localStorage.setItem('latest_audit', JSON.stringify({ ...data, original_content: content }));
    } catch {
      setError('Failed to reach audit backend. Ensure backend is running at ' + API_BASE);
    } finally {
      setAuditing(false);
    }
  };

  // ─── Visual Audit Handlers ────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setVisualResult(null);
      setError(null);
    }
  };

  const generateCanvasBanner = (isCompliant: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isCompliant) {
      ctx.fillStyle = '#1E1B4B'; // TechCorp Navy
      ctx.fillRect(0, 0, 640, 360);

      ctx.fillStyle = '#4F46E5'; // TechCorp Indigo
      ctx.fillRect(0, 0, 640, 60);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('TechCorp Cloud Platform', 30, 40);

      ctx.fillStyle = '#7C3AED';
      ctx.beginPath();
      ctx.roundRect(470, 16, 140, 30, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('ENTERPRISE TIER', 485, 36);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText('Secure Cloud Infrastructure', 30, 140);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Accelerate deployment with 99.9% uptime SLA.', 30, 180);
      ctx.fillText('Audited against SOC2 & ISO 27001 standards.', 30, 210);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Terms and conditions apply. Results may vary based on workload.', 30, 320);
    } else {
      ctx.fillStyle = '#00FF00'; // Prohibited electric neon green
      ctx.fillRect(0, 0, 640, 360);

      ctx.fillStyle = '#FFFF00'; // Illegible yellow contrast
      ctx.font = 'bold 32px system-ui, sans-serif';
      ctx.fillText('100% FREE CLOUD HOSTING!!', 30, 110);

      ctx.fillStyle = '#FF00FF'; // Prohibited Magenta
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('GUARANTEED ZERO DOWNTIME FOREVER', 30, 170);

      ctx.fillStyle = '#7CFC00';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('No credit card needed, beats Amazon, Google & Microsoft.', 30, 230);

      ctx.fillStyle = '#FF0000';
      ctx.font = 'italic bold 18px system-ui, sans-serif';
      ctx.fillText('[Unofficial Modified Logo]', 30, 310);
    }

    canvas.toBlob(blob => {
      if (blob) {
        const file = new File(
          [blob],
          isCompliant ? 'compliant_techcorp_banner.png' : 'non_compliant_neon_banner.png',
          { type: 'image/png' }
        );
        setImageFile(file);
        setImagePreview(URL.createObjectURL(blob));
        setVisualResult(null);
        setError(null);
        setSuccessMsg(
          isCompliant
            ? 'Loaded Compliant TechCorp Banner (#1E1B4B / #4F46E5 with high WCAG contrast). Click Run Audit!'
            : 'Loaded Non-Compliant Creative (#00FF00 Prohibited Neon & illegible yellow contrast). Click Run Audit!'
        );
      }
    }, 'image/png');
  };

  const handleSubmitVisual = async () => {
    if (!imageFile) {
      setError('Please upload a creative banner or select a pre-loaded sample');
      return;
    }
    setAuditing(true);
    setError(null);
    setVisualResult(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('creator_name', creatorName || 'Visual Designer');
    if (selectedGuideline) {
      formData.append('guideline_id', selectedGuideline);
    }
    formData.append('include_standard_rules', String(includeStandardRules));

    try {
      const response = await fetch(`${API_BASE}/api/audit-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Visual audit failed');
      }

      const data: VisualAuditResponse = await response.json();
      setVisualResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Visual audit error: ${message}`);
    } finally {
      setAuditing(false);
    }
  };

  const copyHexToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Group text flags
  const deterministicFlags = result?.flags.filter(f => f.confidence === 'high') ?? [];
  const semanticFlags = result?.flags.filter(f => f.confidence !== 'high') ?? [];
  const activeFlags = auditMode === 'text' ? (result?.flags ?? []) : (visualResult?.flags ?? []);
  const critical = activeFlags.filter(f => f.severity === 'critical').length;
  const warnings = activeFlags.filter(f => f.severity === 'warning').length;
  const suggestions = activeFlags.filter(f => f.severity === 'suggestion').length;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <span>Studio</span>
              <span className="text-slate-300">/</span>
              <span>Dual-Engine Brand Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Compliance Audit Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Verify marketing copy and creative assets against ingested guidelines using deterministic regex enforcement, semantic RAG citation grounding, and ISO/IEC 40500 WCAG 2.1 contrast math.
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shrink-0">
            <button
              onClick={() => { setAuditMode('text'); setError(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                auditMode === 'text'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Text Copy Audit</span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                AI Rewrite
              </span>
            </button>
            <button
              onClick={() => { setAuditMode('visual'); setError(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                auditMode === 'visual'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>Visual Brand Audit</span>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-semibold border border-indigo-200">
                WCAG &amp; Hex
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-3 text-emerald-900 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-medium">{successMsg}</div>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start justify-between gap-3 text-rose-900 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed font-medium">{error}</div>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 1: TEXT COPY AUDIT */}
      {/* ===================================================================== */}
      {auditMode === 'text' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Editor & Controls */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Brand Guideline
                  </label>
                  <select
                    value={selectedGuideline}
                    onChange={e => setSelectedGuideline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-xs font-medium text-slate-800 bg-white"
                  >
                    {guidelines.length > 0 ? (
                      guidelines.map(g => (
                        <option key={g.id} value={g.id}>{g.filename}</option>
                      ))
                    ) : (
                      <option value="default">Demo Brand Guideline (Sample) — Section 1–12</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Creator / Agency
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={e => setCreatorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-xs font-medium text-slate-800 placeholder-slate-400"
                    placeholder="e.g. Enterprise Growth Agency"
                  />
                </div>
              </div>

              {/* Standard Baseline Policy Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${includeStandardRules ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Include Standard Governance Baseline
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        includeStandardRules
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {includeStandardRules ? 'Standard Active' : 'Strict Guideline Only'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {includeStandardRules
                        ? 'Enforcing active guideline rules + industry baseline (WCAG AA contrast, unverified claims, competitor citations).'
                        : 'Strict Mode: Auditing strictly against the rules defined in your selected guideline document.'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={includeStandardRules}
                    onChange={(e) => setIncludeStandardRules(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Content Format
                </label>
                <select
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-xs font-medium text-slate-800 bg-white"
                >
                  <option value="text">General Copy / Press Release</option>
                  <option value="landing_page">Landing Page / Hero Section</option>
                  <option value="email">Email Campaign / Lifecycle</option>
                  <option value="social_media">Social Media Post</option>
                  <option value="blog_post">Blog Post / Longform</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Copy to Audit
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {content.length} characters
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={10}
                  className="w-full px-3.5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 font-mono text-xs text-slate-800 bg-slate-50/30 placeholder-slate-400 leading-relaxed"
                  placeholder="Paste marketing copy, claims, or social captions here..."
                />
              </div>

              {/* Sample Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={loadSampleBad}
                  className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Load Non-Compliant Sample</span>
                </button>
                <button
                  type="button"
                  onClick={loadSampleGood}
                  className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Load Compliant Sample</span>
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleSubmitText}
                disabled={auditing || !content.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {auditing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Marketing Copy...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Run Multi-Engine Compliance Audit</span>
                  </>
                )}
              </button>
            </div>

            {/* Architecture Explainer */}
            <div className="bg-slate-100/60 border border-slate-200/80 rounded-2xl p-5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                <Cpu className="w-4 h-4 text-slate-700" />
                <span>Dual-Engine Verification Architecture</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 leading-relaxed">
                <li>
                  • <strong className="text-slate-800">Deterministic Engine:</strong> 100% precision regex checks against forbidden absolutes, case-sensitivity rules, and statutory disclaimers.
                </li>
                <li>
                  • <strong className="text-slate-800">Semantic RAG Engine:</strong> Gemini 2.5 Flash vector grounding evaluates brand voice, positioning, and context nuances.
                </li>
                <li>
                  • <strong className="text-slate-800">Intent-Preserving Rewrite:</strong> Automatically repairs flagged violations while preserving your original persuasive voice.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Telemetry & Results */}
          <div className="lg:col-span-5 space-y-6">
            {auditing && <AuditingAnimation mode="text" />}

            {result && !auditing && (
              <div className="space-y-6">
                {/* Score Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Compliance Rating
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {result.submission_id.slice(0, 8)}
                    </span>
                  </div>
                  <TrustGauge score={result.brand_trust_score} />

                  {result.total_issues > 0 ? (
                    <div className="flex justify-center gap-3 mt-4 text-xs font-semibold">
                      {critical > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {critical} Critical
                        </span>
                      )}
                      {warnings > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          {warnings} Warnings
                        </span>
                      )}
                      {suggestions > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          {suggestions} Suggestions
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-emerald-700 font-bold mt-4 text-xs flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero policy violations detected. 100% Brand Compliant.</span>
                    </p>
                  )}
                </div>

                {/* Intent-Preserving Compliant Rewrite Card */}
                {result.rewritten_content && result.total_issues > 0 && (
                  <div className="bg-white rounded-2xl border border-indigo-200/90 shadow-2xs p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Intent-Preserving AI Rewrite
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyRewrite(result.rewritten_content!)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          {copiedRewrite ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRewriteDiff(!showRewriteDiff)}
                          className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 px-2 py-1 rounded bg-indigo-50 border border-indigo-200 transition-colors"
                        >
                          {showRewriteDiff ? 'Compact' : 'Side-by-Side Diff'}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Automatically repaired forbidden absolutes and missing disclaimers while keeping your original persuasion and marketing intent intact.
                    </p>

                    {showRewriteDiff ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1">
                            Original Draft
                          </span>
                          <p className="text-slate-700 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                            {content}
                          </p>
                        </div>
                        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                            Compliant Revision
                          </span>
                          <p className="text-slate-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                            {result.rewritten_content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                        {result.rewritten_content}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleApplyFullRewrite(result.rewritten_content!)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-2xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Compliant Rewrite to Editor</span>
                    </button>
                  </div>
                )}

                {/* Flags Breakdown */}
                {result.flags.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Detected Brand Violations
                      </h3>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {result.flags.length} issues
                      </span>
                    </div>

                    {deterministicFlags.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Deterministic Engine Matches ({deterministicFlags.length})
                        </div>
                        {deterministicFlags.map((flag, i) => (
                          <FlagCard key={i} flag={flag} idx={i} onApplyFix={handleApplySingleFix} />
                        ))}
                      </div>
                    )}

                    {semanticFlags.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Semantic RAG Nuance Flags ({semanticFlags.length})
                        </div>
                        {semanticFlags.map((flag, i) => (
                          <FlagCard key={i} flag={flag} idx={i} onApplyFix={handleApplySingleFix} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Governance Next Steps */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Workflow Handoff
                  </span>
                  <Link
                    href={`/review?id=${result.submission_id}`}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-center shadow-2xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Send to Human Review Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setResult(null); setContent(''); }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Reset &amp; Audit New Asset
                  </button>
                </div>
              </div>
            )}

            {!result && !auditing && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Awaiting Submission</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Enter marketing copy or load a pre-configured sample on the left to trigger the dual-engine compliance scanner.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 2: MULTI-MODAL VISUAL BRAND AUDIT */}
      {/* ===================================================================== */}
      {auditMode === 'visual' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Asset Upload & Controls */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Brand Guideline
                  </label>
                  <select
                    value={selectedGuideline}
                    onChange={e => setSelectedGuideline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-xs font-medium text-slate-800 bg-white"
                  >
                    {guidelines.length > 0 ? (
                      guidelines.map(g => (
                        <option key={g.id} value={g.id}>{g.filename}</option>
                      ))
                    ) : (
                      <option value="default">Demo Brand Guideline (Sample) — Visual Color Spec</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Designer / Agency
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={e => setCreatorName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-xs font-medium text-slate-800 placeholder-slate-400"
                    placeholder="e.g. Studio Visuals"
                  />
                </div>
              </div>

              {/* Standard Baseline Policy Toggle for Visual Audit */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${includeStandardRules ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Include Standard Governance Baseline
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        includeStandardRules
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {includeStandardRules ? 'Standard Active' : 'Strict Guideline Only'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {includeStandardRules
                        ? 'Enforcing active guideline rules + standard visual baseline (WCAG AA contrast, prohibited neons, claim disclaimers).'
                        : 'Strict Mode: Auditing creative strictly against colors and rules defined in your selected guideline document.'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={includeStandardRules}
                    onChange={(e) => setIncludeStandardRules(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Creative Image Asset
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50/90 rounded-2xl p-8 text-center cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-2xs text-slate-700">
                    <UploadCloud className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {imageFile ? imageFile.name : 'Click to select creative or drag & drop'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {imageFile
                      ? `${(imageFile.size / 1024).toFixed(1)} KB`
                      : 'Supports PNG, JPG, WebP social banners and hero mockups'}
                  </p>
                </div>
              </div>

              {/* Instant 1-Click Canvas Banner Generators */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  ⚡ Pre-Loaded Test Banners (Zero File Upload Needed)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => generateCanvasBanner(true)}
                    className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                    <div>
                      <div>Approved Navy &amp; Indigo</div>
                      <div className="text-[10px] text-emerald-700 font-normal">WCAG AAA &gt; 7:1 Contrast</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => generateCanvasBanner(false)}
                    className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                    <div>
                      <div>Prohibited Neon Palette</div>
                      <div className="text-[10px] text-rose-700 font-normal">#00FF00 &amp; WCAG Contrast Fail</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Preview */}
              {imagePreview && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Asset Preview
                    </span>
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); setVisualResult(null); }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Creative Preview"
                    className="w-full max-h-56 object-contain rounded-lg bg-black/5 shadow-inner"
                  />
                </div>
              )}

              {/* Run Visual Audit CTA */}
              <button
                type="button"
                onClick={handleSubmitVisual}
                disabled={auditing || !imageFile}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                {auditing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Visual Elements...</span>
                  </>
                ) : (
                  <>
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Run Multi-Modal Visual Audit</span>
                  </>
                )}
              </button>
            </div>

            {/* Visual Engine Specification */}
            <div className="bg-slate-100/60 border border-slate-200/80 rounded-2xl p-5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
                <Cpu className="w-4 h-4 text-slate-700" />
                <span>Visual Governance Stack</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 leading-relaxed">
                <li>
                  • <strong className="text-slate-800">Hex Palette Quantization:</strong> Pillow quantizes dominant color swatches and validates against Section 12 color specifications.
                </li>
                <li>
                  • <strong className="text-slate-800">WCAG 2.1 Contrast Math:</strong> Calculates exact relative luminance $(L_1+0.05)/(L_2+0.05)$ for text legibility.
                </li>
                <li>
                  • <strong className="text-slate-800">Multi-Modal Vision:</strong> Gemini 2.5 Flash inspects logo placement, exclusion zones, and embedded typography claims.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Visual Telemetry */}
          <div className="lg:col-span-5 space-y-6">
            {auditing && <AuditingAnimation mode="visual" />}

            {visualResult && !auditing && (
              <div className="space-y-6">
                {/* Score Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Visual Brand Score
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {visualResult.submission_id.slice(0, 8)}
                    </span>
                  </div>
                  <TrustGauge score={visualResult.brand_trust_score} />

                  <div className="flex justify-center gap-3 mt-4 text-xs font-semibold">
                    {critical > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {critical} Critical
                      </span>
                    )}
                    {warnings > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {warnings} Warnings
                      </span>
                    )}
                    {suggestions > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        {suggestions} Suggestions
                      </span>
                    )}
                  </div>
                </div>

                {/* Dominant Palette Swatches (Figma-style Click to Copy) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Extracted Dominant Palette
                      </h3>
                      <p className="text-[11px] text-slate-400">Click any swatch to copy HEX</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Pillow Quantization</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {visualResult.dominant_palette.map((c, i) => {
                      const flaggedViolation = visualResult.flags.find(
                        f => (f.issue_type === 'Prohibited Color Usage' || f.issue_type?.toLowerCase().includes('color')) &&
                             f.flagged_text?.toLowerCase().includes(c.hex.toLowerCase())
                      );
                      const isProhibited = !!flaggedViolation;
                      const isOffBrand = visualResult.flags.some(
                        f => f.issue_type === 'Off-Brand Color Palette' && f.flagged_text?.toLowerCase().includes(c.hex.toLowerCase())
                      );
                      const isApproved = !isProhibited && !isOffBrand && (
                        ['#4F46E5', '#1E1B4B', '#7C3AED', '#1E293B', '#F8FAFC'].includes(c.hex.toUpperCase()) ||
                        visualResult.flags.filter(f => f.issue_type?.toLowerCase().includes('color')).length === 0
                      );
                      const isCopied = copiedHex === c.hex;

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => copyHexToClipboard(c.hex)}
                          className="flex items-center gap-3 p-2.5 border border-slate-200/80 rounded-xl bg-slate-50/50 hover:bg-slate-100/70 transition-all text-left group"
                        >
                          <div
                            className="w-9 h-9 rounded-lg border border-black/10 shadow-2xs shrink-0 transition-transform group-hover:scale-105"
                            style={{ backgroundColor: c.hex }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1">
                                {c.hex}
                                {isCopied && <Check className="w-3 h-3 text-emerald-600" />}
                              </span>
                              <span className="text-[11px] text-slate-400">{c.percentage}%</span>
                            </div>
                            <span
                              className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded mt-1 ${
                                isProhibited
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isOffBrand
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : isApproved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isProhibited ? 'Prohibited Color' : isOffBrand ? 'Off-Brand' : isApproved ? 'Approved Brand' : 'Neutral'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ISO/IEC 40500 WCAG 2.1 Accessibility Contrast Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        WCAG 2.1 Relative Luminance
                      </h3>
                      <p className="text-[11px] text-slate-400">ISO/IEC 40500:2012 Contrast Math</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                        {visualResult.wcag_analysis.contrast_ratio}:1
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div
                      className={`p-3 rounded-xl border text-xs font-bold ${
                        visualResult.wcag_analysis.wcag_aa_pass
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider">Level AA (Min 4.5:1)</div>
                      <div className="text-sm mt-0.5 font-extrabold flex items-center justify-center gap-1">
                        {visualResult.wcag_analysis.wcag_aa_pass ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>PASS</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>FAIL</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-xs font-bold ${
                        visualResult.wcag_analysis.wcag_aaa_pass
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider">Level AAA (Min 7.0:1)</div>
                      <div className="text-sm mt-0.5 font-extrabold flex items-center justify-center gap-1">
                        {visualResult.wcag_analysis.wcag_aaa_pass ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>PASS</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>FAIL</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contrast Preview Swatch */}
                  {visualResult.wcag_analysis.background_hex && visualResult.wcag_analysis.foreground_hex && (
                    <div
                      className="rounded-xl p-3 text-center font-bold text-xs border border-slate-300 shadow-inner"
                      style={{
                        backgroundColor: visualResult.wcag_analysis.background_hex,
                        color: visualResult.wcag_analysis.foreground_hex,
                      }}
                    >
                      Sample Legibility on Detected Dominant Background
                    </div>
                  )}
                </div>

                {/* Multi-Modal Vision Findings */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Gemini 2.5 Vision Inspection
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="font-semibold text-slate-700">Logo Recognition:</span>
                      <span className="font-bold flex items-center gap-1.5 text-slate-900">
                        {visualResult.logo_detected ? (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Brand Logo Validated</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-4 h-4 text-amber-600" />
                            <span>No Official Logo Found</span>
                          </>
                        )}
                      </span>
                    </div>

                    {visualResult.logo_assessment && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <span className="font-bold text-slate-700 block mb-0.5 text-[11px] uppercase tracking-wider">
                          Logo Assessment
                        </span>
                        <p className="text-slate-800 leading-relaxed">{visualResult.logo_assessment}</p>
                      </div>
                    )}

                    {visualResult.ocr_text && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <span className="font-bold text-slate-700 block mb-0.5 text-[11px] uppercase tracking-wider">
                          Extracted Creative Copy (OCR)
                        </span>
                        <p className="text-slate-700 font-mono text-[11px] leading-relaxed">{visualResult.ocr_text}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Flags */}
                {visualResult.flags.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Visual Guideline Violations
                      </h3>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {visualResult.flags.length} issues
                      </span>
                    </div>
                    <div className="space-y-3">
                      {visualResult.flags.map((flag, i) => (
                        <FlagCard key={i} flag={flag} idx={i} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Workflow Handoff */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Workflow Handoff
                  </span>
                  <Link
                    href={`/review?id=${visualResult.submission_id}`}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-center shadow-2xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Send to Human Review Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setVisualResult(null); setImageFile(null); setImagePreview(null); }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl font-semibold text-xs transition-colors"
                  >
                    Audit Another Visual Creative
                  </button>
                </div>
              </div>
            )}

            {!visualResult && !auditing && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Awaiting Visual Creative</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Upload an image banner or click one of the instant pre-loaded sample creatives to test multi-modal visual brand governance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
