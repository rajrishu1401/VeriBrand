'use client';

/**
 * Governance Review Queue & Decision Studio - VeriBrand Enterprise
 * Human-in-the-loop triage, compliance audit trail, and sign-off workflows
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://veribrand-backend.onrender.com';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Download,
  Filter,
  FileText,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Send,
  ExternalLink,
} from 'lucide-react';

interface AuditFlag {
  issue_type: string;
  severity: string;
  flagged_text: string;
  rule_citation: string;
  explanation: string;
  suggested_fix: string;
  confidence: string;
}

interface Submission {
  id: string;
  creator_name: string;
  content_type: string;
  content_snippet: string;
  status: string;
  trust_score: number;
  submitted_at: string;
  total_flags: number;
}

interface ReviewData {
  id: string;
  submission_id?: string;
  brand_trust_score?: number;
  trust_score?: number;
  flags: AuditFlag[];
  total_issues?: number;
  original_content?: string;
  content?: string;
  creator_name?: string;
  content_type?: string;
  submitted_at?: string;
  status?: string;
  reviewer_comment?: string;
  rewritten_content?: string;
}

// ─── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Approved</span>
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3 h-3 text-rose-600" />
        <span>Rejected</span>
      </span>
    );
  }
  if (status === 'request_changes') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        <span>Needs Changes</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
      <Clock className="w-3 h-3 text-slate-500" />
      <span>Pending</span>
    </span>
  );
}

function TrustBadge({ score }: { score: number }) {
  const isHigh = score >= 90;
  const isMid = score >= 70;
  return (
    <span
      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
        isHigh
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : isMid
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      }`}
    >
      {score}/100
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const isCritical = severity === 'critical';
  const isWarning = severity === 'warning';
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
        isCritical
          ? 'bg-rose-50 text-rose-700 border border-rose-200'
          : isWarning
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-sky-50 text-sky-700 border border-sky-200'
      }`}
    >
      {severity}
    </span>
  );
}

// ─── Highlighted Content ────────────────────────────────────────────────────
function HighlightedContent({ text, flags }: { text: string; flags: AuditFlag[] }) {
  const phrases = [...new Set(flags.map(f => f.flagged_text).filter(Boolean))];
  if (phrases.length === 0) {
    return <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">{text}</pre>;
  }

  const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <p className="whitespace-pre-wrap font-mono text-xs text-slate-800 leading-relaxed">
      {parts.map((part, i) => {
        const matched = phrases.some(p => p.toLowerCase() === part.toLowerCase());
        return matched ? (
          <mark
            key={i}
            className="bg-rose-100 text-rose-900 border border-rose-200 rounded px-1 py-0.5 font-bold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </p>
  );
}

// ─── Queue Triage View ──────────────────────────────────────────────────────
const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Needs Changes'];
const filterMap: Record<string, string | null> = {
  All: null,
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  'Needs Changes': 'request_changes',
};

function QueueView() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetch(`${API_BASE}/api/submissions`)
      .then(r => r.json())
      .then(d => {
        setSubmissions(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = submissions.filter(s => {
    const f = filterMap[activeFilter];
    return f === null || s.status === f;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-semibold text-slate-500">Loading governance audit stream...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-2 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => {
            const count =
              f === 'All'
                ? submissions.length
                : submissions.filter(s => s.status === filterMap[f]).length;
            const isActive = activeFilter === f;

            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{f}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 font-medium px-2">
          Total Audits: <strong className="text-slate-700 font-mono">{submissions.length}</strong>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs text-slate-500 space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-800">No submissions found in this triage state</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Submit marketing copy or creatives via the Audit Studio to generate entries in the compliance queue.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 shadow-2xs transition-colors"
          >
            <span>Launch Audit Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Creator / Team</th>
                  <th className="px-5 py-3.5">Content Preview</th>
                  <th className="px-5 py-3.5 text-center">Brand Trust</th>
                  <th className="px-5 py-3.5 text-center">Violations</th>
                  <th className="px-5 py-3.5 text-center">Governance State</th>
                  <th className="px-5 py-3.5 text-center">Audit Date</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{s.creator_name}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                        {s.content_type.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-xs sm:max-w-md">
                      <p className="text-slate-600 truncate font-mono text-[11px]">
                        {s.content_snippet}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <TrustBadge score={s.trust_score ?? 0} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`font-mono font-bold ${
                          s.total_flags > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {s.total_flags}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-4 text-center text-[11px] font-mono text-slate-400">
                      {s.submitted_at?.slice(0, 10)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/review?id=${s.id}`}
                        className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Individual Review Detail ───────────────────────────────────────────────
const DECISION_OPTIONS = [
  {
    value: 'approve',
    label: 'Approve Content',
    desc: 'Meets enterprise brand guidelines without blocking policy flags.',
    icon: CheckCircle2,
    active: 'bg-emerald-600 text-white border-emerald-600',
    inactive: 'border-slate-200 text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/30',
  },
  {
    value: 'request_changes',
    label: 'Request Changes',
    desc: 'Flagged claims or disclaimers must be amended prior to distribution.',
    icon: AlertTriangle,
    active: 'bg-amber-500 text-white border-amber-500',
    inactive: 'border-slate-200 text-slate-800 hover:border-amber-300 hover:bg-amber-50/30',
  },
  {
    value: 'reject',
    label: 'Reject Submission',
    desc: 'Severe brand non-compliance, prohibited colors, or deceptive claims.',
    icon: XCircle,
    active: 'bg-rose-600 text-white border-rose-600',
    inactive: 'border-slate-200 text-slate-800 hover:border-rose-300 hover:bg-rose-50/30',
  },
];

function IndividualReview({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [action, setAction] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/submission/${submissionId}`)
      .then(r => (r.ok ? r.json() : null))
      .then(apiData => {
        if (apiData) {
          setData({ ...apiData, submission_id: apiData.id });
        } else {
          const stored = localStorage.getItem('latest_audit');
          if (stored) setData(JSON.parse(stored));
        }
        setLoading(false);
      })
      .catch(() => {
        const stored = localStorage.getItem('latest_audit');
        if (stored) setData(JSON.parse(stored));
        setLoading(false);
      });
  }, [submissionId]);

  const handleApproval = async () => {
    if (!action || !data) return;
    setSubmitting(true);
    try {
      const id = data.submission_id ?? data.id;
      await fetch(`${API_BASE}/api/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: id,
          action,
          reviewer_comment: comment || undefined,
        }),
      });
      setSubmitted(true);
    } catch {
      alert('Failed to record decision. Check backend connectivity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    const id = data?.submission_id ?? data?.id;
    if (!id) return;
    const r = await fetch(`${API_BASE}/api/export/${id}`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veribrand-report-${id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-semibold text-slate-500">Loading audit data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs space-y-4">
        <p className="text-sm font-bold text-slate-800">Submission not found in active database.</p>
        <Link
          href="/review"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Review Queue</span>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 max-w-md text-center shadow-2xs space-y-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-full border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Governance Decision Recorded</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Content status has been updated to{' '}
            <strong className="text-slate-900 capitalize font-bold">{action.replace('_', ' ')}</strong>{' '}
            and logged to the immutable audit database.
          </p>
          <div className="pt-2 space-y-2">
            <Link
              href="/review"
              className="block w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs"
            >
              Back to Review Queue
            </Link>
            <Link
              href="/submit"
              className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-xs transition-colors"
            >
              Audit Another Asset
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const score = data.brand_trust_score ?? data.trust_score ?? 0;
  const flags = data.flags ?? [];
  const originalContent = data.original_content ?? data.content ?? '';
  const critical = flags.filter(f => f.severity === 'critical').length;
  const warnings = flags.filter(f => f.severity === 'warning').length;
  const suggestions = flags.filter(f => f.severity === 'suggestion').length;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/review"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Triage Queue</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            ID: {(data.submission_id ?? data.id ?? '').slice(0, 8)}...
          </span>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export JSON Audit Report</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Main Column — 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* Trust Score Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Compliance Assessment
                </span>
                <h3 className="text-lg font-bold text-slate-900">Brand Trust Telemetry</h3>
              </div>
              <div className="text-right">
                <div
                  className={`text-4xl font-extrabold tracking-tight font-mono ${
                    score >= 90
                      ? 'text-emerald-600'
                      : score >= 70
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {score}
                  <span className="text-xs font-normal text-slate-400 font-sans">/100</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>

            {/* Severity Pill Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Violations Detected:</span>
                <span className="font-bold text-slate-900">{flags.length}</span>
              </div>
              <div className="flex gap-2">
                {critical > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
                    {critical} Critical
                  </span>
                )}
                {warnings > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px]">
                    {warnings} Warnings
                  </span>
                )}
                {suggestions > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold text-[11px]">
                    {suggestions} Suggestions
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Original Content with Inline Highlighted Flags */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Audited Copy &amp; Flag Highlight
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {data.creator_name || 'Creator'} · {data.content_type || 'General Copy'}
              </span>
            </div>
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
              <HighlightedContent text={originalContent} flags={flags} />
            </div>
            {flags.length > 0 && (
              <p className="text-[11px] text-slate-400">
                Highlighted tokens indicate exact phrases caught by deterministic or semantic compliance checks.
              </p>
            )}
          </div>

          {/* Intent-Preserving Compliant Rewrite (Round 3) */}
          {data.rewritten_content && (
            <div className="bg-white rounded-2xl border border-indigo-200/90 shadow-2xs p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  AI Compliant Rewrite Revision
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Intent-preserving revision synthesized by Gemini 2.5 Flash, resolving all highlighted violations.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                {data.rewritten_content}
              </div>
            </div>
          )}

          {/* Compliance Issues Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Individual Issue Breakdowns
              </h3>
              <span className="text-xs font-mono text-slate-400">{flags.length} total</span>
            </div>

            {flags.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">No policy violations logged</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-900">{flag.issue_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={flag.severity} />
                        <span className="text-[11px] text-slate-400 capitalize font-medium">
                          {flag.confidence} confidence
                        </span>
                      </div>
                    </div>

                    {flag.flagged_text && (
                      <div className="bg-white border border-rose-200/70 rounded-md px-2.5 py-1 text-xs font-mono text-rose-800">
                        &ldquo;{flag.flagged_text}&rdquo;
                      </div>
                    )}

                    <p className="text-xs text-slate-600 leading-relaxed">{flag.explanation}</p>

                    <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 text-[11px] space-y-1">
                      <span className="font-bold text-slate-700 block">Guideline Citation:</span>
                      <p className="text-slate-600 italic leading-relaxed">{flag.rule_citation}</p>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-lg p-2.5 text-[11px] space-y-1">
                      <span className="font-bold text-emerald-800 block">Recommended Fix:</span>
                      <p className="text-slate-700 leading-relaxed">{flag.suggested_fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Decision Panel — 4 cols */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs sticky top-20 space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Human-in-the-Loop Signoff
              </span>
              <h3 className="text-sm font-bold text-slate-900">Record Decision</h3>
              <p className="text-xs text-slate-500 mt-1">
                Select a compliance ruling to commit this submission to the enterprise audit trail.
              </p>
            </div>

            {/* Decision options */}
            <div className="space-y-2.5">
              {DECISION_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = action === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAction(opt.value)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected ? opt.active + ' shadow-2xs' : `bg-white ${opt.inactive}`
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs">{opt.label}</div>
                      <div
                        className={`text-[11px] mt-0.5 leading-snug ${
                          isSelected ? 'opacity-90' : 'text-slate-400'
                        }`}
                      >
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Comments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reviewer Notes
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 text-xs text-slate-800 placeholder-slate-400 leading-relaxed"
                placeholder="Optional notes for marketing or creative team..."
              />
            </div>

            {/* Commit Button */}
            <button
              type="button"
              onClick={handleApproval}
              disabled={!action || submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing Decision...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Commit Governance Decision</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shell Container ────────────────────────────────────────────────────────
function ReviewPageContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('id');

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-2.5">
          <span>Triage</span>
          <span className="text-slate-300">/</span>
          <span>Human-in-the-Loop Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {submissionId ? 'Review Submission' : 'Governance Review Queue'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {submissionId
            ? 'Inspect policy violations, review intent-preserving AI suggestions, and issue authoritative sign-off decisions.'
            : 'Enterprise queue of ingested marketing copy and visual creatives awaiting compliance review and sign-off.'}
        </p>
      </div>

      {submissionId ? <IndividualReview submissionId={submissionId} /> : <QueueView />}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-semibold text-slate-500">Loading Governance Queue...</p>
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}
