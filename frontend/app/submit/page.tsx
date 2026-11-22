'use client';

/**
 * Content Submission Page - VeriBrand Round 3
 * Features:
 * 1. Text Copy Audit with Intent-Preserving AI Rewrites & 1-Click fixes
 * 2. Multi-Modal Visual Brand Audit: Dominant hex palette extraction, WCAG 2.1 contrast math, Logo & OCR inspection
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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

// ─── Circular gauge ───────────────────────────────────────────────────────────
function TrustGauge({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = 70;
  const stroke = 10;
  const normalised = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalised;
  const progress = circumference - (displayed / 100) * circumference;

  const color =
    displayed >= 90 ? '#16a34a' : displayed >= 70 ? '#d97706' : '#dc2626';
  const label =
    displayed >= 90 ? 'Excellent' : displayed >= 70 ? 'Needs Review' : 'High Risk';

  useEffect(() => {
    setDisplayed(0);
    let start = 0;
    const step = Math.ceil(score / 40);
    const id = setInterval(() => {
      start += step;
      if (start >= score) {
        setDisplayed(score);
        clearInterval(id);
      } else {
        setDisplayed(start);
      }
    }, 30);
    return () => clearInterval(id);
  }, [score]);

  return (
    <div className="flex flex-col items-center py-2">
      <div className="relative flex items-center justify-center">
        <svg width={radius * 2 + stroke} height={radius * 2 + stroke} className="-rotate-90">
          <circle
            cx={radius + stroke / 2} cy={radius + stroke / 2} r={normalised}
            fill="none" stroke="#e5e7eb" strokeWidth={stroke}
          />
          <circle
            cx={radius + stroke / 2} cy={radius + stroke / 2} r={normalised}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={progress}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.05s ease' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold" style={{ color }}>{displayed}</span>
          <span className="text-xs text-gray-500">out of 100</span>
        </div>
      </div>
      <div className="text-sm font-semibold mt-3" style={{ color }}>{label}</div>
    </div>
  );
}

// ─── Animated loading steps ───────────────────────────────────────────────────
const TEXT_LOADING_STEPS = [
  'Running deterministic compliance checks...',
  'Semantic RAG analysis via Gemini 2.5 Flash...',
  'Synthesizing intent-preserving compliant rewrite...',
  'Calculating Brand Trust Score...',
];

const VISUAL_LOADING_STEPS = [
  'Extracting dominant hex color palette...',
  'Calculating WCAG 2.1 relative luminance contrast...',
  'Gemini Vision logo & layout inspection...',
  'Evaluating visual identity compliance...',
];

function AuditingAnimation({ mode }: { mode: 'text' | 'visual' }) {
  const steps = mode === 'visual' ? VISUAL_LOADING_STEPS : TEXT_LOADING_STEPS;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % steps.length), 1400);
    return () => clearInterval(id);
  }, [steps]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
      <p className="text-lg font-semibold text-gray-800 mb-2">
        {mode === 'visual' ? 'Auditing Visual Brand Asset...' : 'Analyzing Marketing Copy...'}
      </p>
      <p className="text-sm text-indigo-600 animate-pulse">{steps[step]}</p>
      <div className="flex justify-center mt-6 gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === step ? 'bg-indigo-600 scale-125' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Severity helpers ─────────────────────────────────────────────────────────
function severityDot(s: string) {
  if (s === 'critical') return <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block mt-1 shrink-0" />;
  if (s === 'warning') return <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block mt-1 shrink-0" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block mt-1 shrink-0" />;
}

function severityClasses(s: string) {
  if (s === 'critical') return 'border-l-4 border-red-500 bg-red-50/70';
  if (s === 'warning') return 'border-l-4 border-yellow-500 bg-yellow-50/70';
  return 'border-l-4 border-blue-400 bg-blue-50/70';
}

function severityBadge(s: string) {
  if (s === 'critical') return 'bg-red-100 text-red-800';
  if (s === 'warning') return 'bg-yellow-100 text-yellow-800';
  return 'bg-blue-100 text-blue-800';
}

// ─── Flag card ────────────────────────────────────────────────────────────────
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

  return (
    <div className={`rounded-lg p-4 transition-all ${severityClasses(flag.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {severityDot(flag.severity)}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-gray-900">{flag.issue_type}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge(flag.severity)}`}>
                {flag.severity}
              </span>
              <span className="text-xs text-gray-500">Confidence: {flag.confidence}</span>
            </div>
            {flag.flagged_text && (
              <code className="mt-1 block text-xs bg-white/80 px-2 py-1 rounded text-gray-800 font-mono">
                &quot;{flag.flagged_text}&quot;
              </code>
            )}
            <p className="mt-1 text-sm text-gray-700">{flag.explanation}</p>
            <p className="mt-1 text-xs text-gray-500 italic">Rule: {flag.rule_citation}</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-indigo-600 hover:underline ml-2 whitespace-nowrap shrink-0 font-medium"
        >
          {expanded ? 'Hide fix ▲' : 'Show fix ▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 bg-white/90 border border-green-200 rounded-lg p-3 text-sm text-gray-800 space-y-2">
          <div className="text-green-800">
            <span className="font-semibold">Suggested fix: </span>
            {flag.suggested_fix}
          </div>
          {onApplyFix && flag.flagged_text && (
            <button
              onClick={() => onApplyFix(flag)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded shadow-sm transition-colors"
            >
              <span>Apply Fix</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SubmitPage() {
  const [auditMode, setAuditMode] = useState<'text' | 'visual'>('text');

  // Text Audit State
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text');
  const [creatorName, setCreatorName] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showRewriteDiff, setShowRewriteDiff] = useState(false);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [selectedGuideline, setSelectedGuideline] = useState<string>('');

  // Visual Audit State (Round 3)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [visualResult, setVisualResult] = useState<VisualAuditResponse | null>(null);
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

  // Text Samples
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
    setSuccessMsg("✨ Entire copy updated with the 100% brand-compliant version! Click 'Run Compliance Audit' to see your new score.");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitText = async () => {
    if (!content.trim()) { setError('Please enter content to audit'); return; }
    setAuditing(true); setError(null); setResult(null); setSuccessMsg(null);
    try {
      const response = await fetch(`${API_BASE}/api/submit-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, content_type: contentType, creator_name: creatorName || 'Creator' }),
      });
      if (!response.ok) throw new Error('Audit failed');
      const data: AuditResponse = await response.json();
      setResult(data);
      localStorage.setItem('latest_audit', JSON.stringify({ ...data, original_content: content }));
    } catch {
      setError('Failed to audit content. Make sure the backend is running and guidelines are uploaded.');
    } finally {
      setAuditing(false);
    }
  };

  // ─── Visual Audit Handlers (Round 3) ─────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setVisualResult(null);
      setError(null);
    }
  };

  // Generate In-Browser Dynamic Banners on HTML5 Canvas
  const generateCanvasBanner = (isCompliant: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isCompliant) {
      // Approved Navy & Indigo Palette, High Contrast White Text (WCAG AAA > 7:1)
      ctx.fillStyle = '#1E1B4B'; // TechCorp Navy
      ctx.fillRect(0, 0, 640, 360);

      // Accent Header bar
      ctx.fillStyle = '#4F46E5'; // TechCorp Indigo
      ctx.fillRect(0, 0, 640, 60);

      // Brand Logo mark
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('TechCorp Cloud Platform', 30, 40);

      // Badge
      ctx.fillStyle = '#7C3AED';
      ctx.beginPath();
      ctx.roundRect(470, 16, 140, 30, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillText('ENTERPRISE TIER', 485, 36);

      // Hero headline
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText('Secure Cloud Infrastructure', 30, 140);

      // Body copy
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('Accelerate deployment with 99.9% uptime SLA.', 30, 180);
      ctx.fillText('Audited against SOC2 & ISO 27001 standards.', 30, 210);

      // Legal disclaimer footer
      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Terms and conditions apply. Results may vary based on workload.', 30, 320);
    } else {
      // Prohibited Neon Green, Prohibited Neon Yellow, Low Contrast
      ctx.fillStyle = '#00FF00'; // Banned electric neon green
      ctx.fillRect(0, 0, 640, 360);

      // Yellow text on Neon Green background (Severe WCAG Fail < 1.3:1)
      ctx.fillStyle = '#FFFF00';
      ctx.font = 'bold 32px system-ui, sans-serif';
      ctx.fillText('100% FREE CLOUD HOSTING!!', 30, 110);

      ctx.fillStyle = '#FF00FF'; // Prohibited Magenta
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('GUARANTEED ZERO DOWNTIME FOREVER', 30, 170);

      // Illegible tiny text
      ctx.fillStyle = '#7CFC00';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText('No credit card needed, beats Amazon, Google & Microsoft.', 30, 230);

      // Distorted/missing logo indicator
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
      setError('Please upload an image or click a sample creative below');
      return;
    }
    setAuditing(true);
    setError(null);
    setVisualResult(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('creator_name', creatorName || 'Visual Designer');

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
      setError(`Visual audit error: ${message}. Ensure backend is active.`);
    } finally {
      setAuditing(false);
    }
  };

  // Group text flags
  const deterministicFlags = result?.flags.filter(f => f.confidence === 'high') ?? [];
  const semanticFlags = result?.flags.filter(f => f.confidence !== 'high') ?? [];
  const critical = (auditMode === 'text' ? result : visualResult)?.flags.filter(f => f.severity === 'critical').length ?? 0;
  const warnings = (auditMode === 'text' ? result : visualResult)?.flags.filter(f => f.severity === 'warning').length ?? 0;
  const suggestions = (auditMode === 'text' ? result : visualResult)?.flags.filter(f => f.severity === 'suggestion').length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">VeriBrand</h1>
              <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                Enterprise Brand Governance
              </span>
            </div>
          </Link>
          <div className="flex space-x-4 text-sm font-medium">
            <Link href="/" className="text-gray-600 hover:text-indigo-600">Dashboard</Link>
            <Link href="/upload" className="text-gray-600 hover:text-indigo-600">Upload Guidelines</Link>
            <Link href="/review" className="text-gray-600 hover:text-indigo-600">Review Queue</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Banner & Mode Switcher */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Compliance Audit Studio</h2>
              <p className="text-sm text-gray-600 mt-1">
                Verify brand identity across copy and visual creatives against your ingested guidelines.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-gray-300 mt-6 bg-white/60 p-1 rounded-t-xl">
            <button
              onClick={() => { setAuditMode('text'); setError(null); }}
              className={`py-3 px-6 text-sm font-bold border-b-2 flex items-center gap-2 transition-all rounded-t-lg ${
                auditMode === 'text'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>📝 Text Copy Audit</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                AI Rewrite Live
              </span>
            </button>
            <button
              onClick={() => { setAuditMode('visual'); setError(null); }}
              className={`py-3 px-6 text-sm font-bold border-b-2 flex items-center gap-2 transition-all rounded-t-lg ${
                auditMode === 'visual'
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>🎨 Visual Brand Audit</span>
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-wide shadow-xs">
                Round 3 Feature
              </span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 mb-6 text-emerald-900 shadow-sm flex items-start justify-between">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                ✓
              </span>
              <div>
                <p className="font-semibold text-sm">Action Confirmed</p>
                <p className="text-xs text-emerald-800 mt-0.5">{successMsg}</p>
              </div>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium"
            >
              ✕
            </button>
          </div>
        )}

        {/* Global Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800 text-sm shadow-sm flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">⚠️ Error:</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-xs text-red-700 font-bold">✕</button>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 1: TEXT COPY AUDIT */}
        {/* ===================================================================== */}
        {auditMode === 'text' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Column */}
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 space-y-4">
                {guidelines.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Audit Against Guideline</label>
                    <select
                      value={selectedGuideline}
                      onChange={e => setSelectedGuideline(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm text-gray-900 bg-white"
                    >
                      {guidelines.map(g => (
                        <option key={g.id} value={g.id}>{g.filename}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Creator Name</label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={e => setCreatorName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm"
                    placeholder="Enter author or agency name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                  <select
                    value={contentType}
                    onChange={e => setContentType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white text-sm"
                  >
                    <option value="text">General Copy</option>
                    <option value="blog_post">Blog Post / Article</option>
                    <option value="email">Email Campaign</option>
                    <option value="social_media">Social Media Post</option>
                    <option value="landing_page">Landing Page</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content to Audit</label>
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={11}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-gray-900 bg-white placeholder-gray-400"
                    placeholder="Paste your marketing content here..."
                  />
                  <div className="mt-1 text-xs text-gray-400">{content.length} characters</div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={loadSampleBad}
                    className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200"
                  >
                    Load Sample (With Violations)
                  </button>
                  <button
                    onClick={loadSampleGood}
                    className="flex-1 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors border border-green-200"
                  >
                    Load Sample (Compliant)
                  </button>
                </div>

                <button
                  onClick={handleSubmitText}
                  disabled={auditing || !content.trim()}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {auditing ? 'Auditing Content...' : 'Run Compliance Audit'}
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                <p className="font-bold mb-1.5 flex items-center gap-1.5">
                  <span>ℹ️</span> Dual-Layer Text Engine
                </p>
                <ul className="space-y-1 text-xs text-blue-800">
                  <li>• <strong>Deterministic Layer:</strong> 100% precision regex checks for banned claims, case rules &amp; disclaimers.</li>
                  <li>• <strong>Semantic RAG Layer:</strong> Gemini 2.5 Flash analyzes tone, positioning, and contextual brand fit.</li>
                  <li>• <strong>Intent-Preserving Rewrite:</strong> Automatically suggests ready-to-adopt compliant copy.</li>
                </ul>
              </div>
            </div>

            {/* Results Column */}
            <div>
              {auditing && <AuditingAnimation mode="text" />}

              {result && !auditing && (
                <div className="space-y-6">
                  {/* Trust Score Gauge */}
                  <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Brand Trust Score</h3>
                    <TrustGauge score={result.brand_trust_score} />

                    {result.total_issues > 0 && (
                      <div className="flex justify-center gap-4 mt-4 text-xs">
                        {critical > 0 && <span className="flex items-center gap-1 text-red-600 font-bold">{critical} Critical</span>}
                        {warnings > 0 && <span className="flex items-center gap-1 text-yellow-600 font-bold">{warnings} Warnings</span>}
                        {suggestions > 0 && <span className="flex items-center gap-1 text-blue-600 font-bold">{suggestions} Suggestions</span>}
                      </div>
                    )}
                    {result.total_issues === 0 && (
                      <p className="text-green-600 font-semibold mt-4 text-sm">✨ No issues found — copy is 100% compliant!</p>
                    )}
                  </div>

                  {/* Intent-Preserving AI Rewrite Card */}
                  {result.rewritten_content && result.total_issues > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-xl shadow-md p-6 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Round 3 Improvement 1
                          </span>
                          <h4 className="text-base font-bold text-gray-900">
                            ✨ Intent-Preserving Compliant Rewrite
                          </h4>
                        </div>
                        <button
                          onClick={() => setShowRewriteDiff(!showRewriteDiff)}
                          className="text-xs text-indigo-700 font-semibold hover:underline bg-white/70 px-2.5 py-1 rounded-md border border-indigo-200"
                        >
                          {showRewriteDiff ? 'Hide Comparison ▲' : 'Compare Original vs Rewrite ▼'}
                        </button>
                      </div>

                      <p className="text-xs text-gray-600 leading-relaxed">
                        VeriBrand automatically fixed all guideline violations while preserving your original persuasive voice, core value proposition, and messaging intent.
                      </p>

                      {showRewriteDiff ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-red-50/70 border border-red-200 rounded-lg p-3">
                            <span className="font-bold text-red-800 block mb-1">Original Draft (With Violations):</span>
                            <p className="text-gray-700 font-mono whitespace-pre-wrap">{content}</p>
                          </div>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <span className="font-bold text-green-800 block mb-1">Compliant Rewrite (Ready to Use):</span>
                            <p className="text-gray-800 font-mono whitespace-pre-wrap">{result.rewritten_content}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/95 border border-indigo-200 rounded-lg p-3 text-xs text-gray-800 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner">
                          {result.rewritten_content}
                        </div>
                      )}

                      <button
                        onClick={() => handleApplyFullRewrite(result.rewritten_content!)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <span>✨ Apply 1-Click Compliant Rewrite to Editor</span>
                      </button>
                    </div>
                  )}

                  {/* Grouped Flags */}
                  {result.flags.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 space-y-5">
                      <h3 className="text-lg font-bold text-gray-900">
                        Identified Brand Violations <span className="text-gray-400 font-normal">({result.flags.length})</span>
                      </h3>

                      {deterministicFlags.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deterministic Rule Matches</span>
                            <div className="h-px flex-1 bg-gray-200" />
                          </div>
                          <div className="space-y-3">
                            {deterministicFlags.map((flag, i) => (
                              <FlagCard key={i} flag={flag} idx={i} onApplyFix={handleApplySingleFix} />
                            ))}
                          </div>
                        </div>
                      )}

                      {semanticFlags.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gemini 2.5 Flash Semantic AI</span>
                            <div className="h-px flex-1 bg-gray-200" />
                          </div>
                          <div className="space-y-3">
                            {semanticFlags.map((flag, i) => (
                              <FlagCard key={i} flag={flag} idx={i} onApplyFix={handleApplySingleFix} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-3">Governance Next Steps</h3>
                    <div className="space-y-3">
                      <Link
                        href={`/review?id=${result.submission_id}`}
                        className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-center text-sm shadow-md"
                      >
                        Open in Review Queue &amp; Sign Off
                      </Link>
                      <button
                        onClick={() => { setResult(null); setContent(''); }}
                        className="w-full bg-gray-100 text-gray-700 py-2.5 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                      >
                        Clear and Audit New Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!result && !auditing && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-gray-800">No Copy Audited Yet</h4>
                  <p className="text-gray-500 text-xs mt-1">Enter your marketing copy or load a sample above to view real-time governance results.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: MULTI-MODAL VISUAL BRAND AUDIT (ROUND 3) */}
        {/* ===================================================================== */}
        {auditMode === 'visual' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Column */}
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">Upload Visual Asset</h3>
                  <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                    PNG, JPG, WebP
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Designer / Agency Name
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={e => setCreatorName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 text-sm"
                    placeholder="e.g. Creative Studio / Marketing Design Team"
                  />
                </div>

                {/* Upload Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-all bg-indigo-50/40 hover:bg-indigo-50/80"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {imageFile ? imageFile.name : 'Click or drag & drop creative banner'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : 'Supports social media banners, hero graphics, ads'}
                  </p>
                </div>

                {/* Instant 1-Click Samples (Canvas Generated) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    ⚡ Instant Pre-Loaded Test Creatives (Zero Files Needed)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={() => generateCanvasBanner(true)}
                      className="px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold text-left transition-colors flex items-center gap-2"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                      <span>Compliant Banner (#1E1B4B / High Contrast)</span>
                    </button>
                    <button
                      onClick={() => generateCanvasBanner(false)}
                      className="px-3 py-2 bg-red-50 text-red-800 hover:bg-red-100 border border-red-300 rounded-lg text-xs font-semibold text-left transition-colors flex items-center gap-2"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                      <span>Non-Compliant (#00FF00 Neon &amp; Low Contrast)</span>
                    </button>
                  </div>
                </div>

                {/* Preview Image */}
                {imagePreview && (
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">Creative Preview:</span>
                      <button
                        onClick={() => { setImageFile(null); setImagePreview(null); setVisualResult(null); }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-60 object-contain rounded-lg bg-black/5 shadow-inner"
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmitVisual}
                  disabled={auditing || !imageFile}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-6 rounded-lg font-bold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {auditing ? 'Analyzing Visual Elements...' : 'Run Visual Compliance Audit'}
                </button>
              </div>

              {/* Technical explanation */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-900">
                <p className="font-bold mb-1.5 flex items-center gap-1.5">
                  <span>🔬</span> How Visual Auditing Works
                </p>
                <ul className="space-y-1 text-xs text-purple-800">
                  <li>• <strong>Hex Palette Extraction:</strong> Pillow quantizes dominant color swatches and verifies against approved Section 12 palette.</li>
                  <li>• <strong>WCAG 2.1 Luminance Math:</strong> Computes exact relative luminance contrast ratio $(L_1+0.05)/(L_2+0.05)$ for text legibility.</li>
                  <li>• <strong>Multi-Modal Vision:</strong> Gemini 2.5 Flash inspects logo integrity, exclusion zones, and embedded typography claims.</li>
                </ul>
              </div>
            </div>

            {/* Visual Results Column */}
            <div>
              {auditing && <AuditingAnimation mode="visual" />}

              {visualResult && !auditing && (
                <div className="space-y-6">
                  {/* Visual Brand Trust Score */}
                  <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Visual Brand Trust Score</h3>
                    <TrustGauge score={visualResult.brand_trust_score} />

                    <div className="flex justify-center gap-4 mt-4 text-xs">
                      {critical > 0 && <span className="flex items-center gap-1 text-red-600 font-bold">{critical} Critical</span>}
                      {warnings > 0 && <span className="flex items-center gap-1 text-yellow-600 font-bold">{warnings} Warnings</span>}
                      {suggestions > 0 && <span className="flex items-center gap-1 text-blue-600 font-bold">{suggestions} Suggestions</span>}
                    </div>
                  </div>

                  {/* Dominant Palette Swatches */}
                  <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-gray-900">Extracted Dominant Palette</h4>
                      <span className="text-xs text-gray-500 font-mono">Pillow Quantization</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {visualResult.dominant_palette.map((c, i) => {
                        const isApproved = ['#4F46E5', '#1E1B4B', '#7C3AED', '#1E293B', '#F8FAFC'].includes(c.hex.toUpperCase());
                        const isProhibited = ['#00FF00', '#FFFF00', '#FF00FF', '#00FFFF'].includes(c.hex.toUpperCase());
                        return (
                          <div key={i} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg bg-gray-50/60">
                            <div
                              className="w-10 h-10 rounded-md border border-black/10 shadow-sm shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-gray-900">{c.hex}</span>
                                <span className="text-[11px] text-gray-500">{c.percentage}%</span>
                              </div>
                              <span
                                className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${
                                  isApproved
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isProhibited
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {isApproved ? 'Approved Brand Color' : isProhibited ? 'Prohibited Neon' : 'Neutral / Context'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* WCAG 2.1 Contrast Analysis Card */}
                  <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">WCAG 2.1 Accessibility Contrast</h4>
                        <p className="text-xs text-gray-500">ISO/IEC 40500:2012 Standard Ratio</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-indigo-600 font-mono">
                          {visualResult.wcag_analysis.contrast_ratio}:1
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className={`p-3 rounded-lg border font-bold text-xs ${
                        visualResult.wcag_analysis.wcag_aa_pass
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}>
                        Level AA (Min 4.5:1)
                        <div className="text-sm mt-0.5 font-extrabold">
                          {visualResult.wcag_analysis.wcag_aa_pass ? '✅ PASS' : '❌ FAIL'}
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border font-bold text-xs ${
                        visualResult.wcag_analysis.wcag_aaa_pass
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-yellow-50 text-yellow-800 border-yellow-300'
                      }`}>
                        Level AAA (Min 7.0:1)
                        <div className="text-sm mt-0.5 font-extrabold">
                          {visualResult.wcag_analysis.wcag_aaa_pass ? '✅ PASS' : '⚠️ FAIL'}
                        </div>
                      </div>
                    </div>

                    {/* Visual Contrast Swatch Sample */}
                    {visualResult.wcag_analysis.background_hex && visualResult.wcag_analysis.foreground_hex && (
                      <div
                        className="rounded-lg p-3 text-center font-bold text-xs border border-gray-300 shadow-inner"
                        style={{
                          backgroundColor: visualResult.wcag_analysis.background_hex,
                          color: visualResult.wcag_analysis.foreground_hex,
                        }}
                      >
                        Sample Text Legibility Preview on Detected Background
                      </div>
                    )}
                  </div>

                  {/* Multi-Modal Vision Findings */}
                  <div className="bg-white rounded-xl shadow-lg p-6 space-y-3">
                    <h4 className="text-base font-bold text-gray-900">Multi-Modal Vision Analysis</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start justify-between p-2.5 bg-gray-50 rounded-lg">
                        <span className="font-semibold text-gray-700">Logo Detected:</span>
                        <span className="font-bold text-gray-900">
                          {visualResult.logo_detected ? '✅ Brand Logo Found' : '⚠️ No Clear Logo'}
                        </span>
                      </div>
                      {visualResult.logo_assessment && (
                        <div className="p-2.5 bg-gray-50 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-0.5">Logo Assessment:</span>
                          <p className="text-gray-800">{visualResult.logo_assessment}</p>
                        </div>
                      )}
                      {visualResult.ocr_text && (
                        <div className="p-2.5 bg-gray-50 rounded-lg">
                          <span className="font-semibold text-gray-700 block mb-0.5">Extracted Copy (OCR):</span>
                          <p className="text-gray-600 font-mono">{visualResult.ocr_text}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual Flags */}
                  {visualResult.flags.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                      <h4 className="text-base font-bold text-gray-900">
                        Visual Guideline Violations ({visualResult.flags.length})
                      </h4>
                      <div className="space-y-3">
                        {visualResult.flags.map((flag, i) => (
                          <FlagCard key={i} flag={flag} idx={i} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h4 className="text-base font-bold text-gray-900 mb-3">Governance Next Steps</h4>
                    <div className="space-y-3">
                      <Link
                        href={`/review?id=${visualResult.submission_id}`}
                        className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-center text-sm shadow-md"
                      >
                        Open in Review Queue &amp; Record Decision
                      </Link>
                      <button
                        onClick={() => { setVisualResult(null); setImageFile(null); setImagePreview(null); }}
                        className="w-full bg-gray-100 text-gray-700 py-2.5 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                      >
                        Audit Another Creative Asset
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!visualResult && !auditing && (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-gray-800">No Creative Audited Yet</h4>
                  <p className="text-gray-500 text-xs mt-1">
                    Upload a creative banner or click one of the instant sample buttons on the left to test visual brand governance.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
