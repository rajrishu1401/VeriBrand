'use client';

/**
 * Review & Approval Page - Enhanced
 * Full queue view, filters, inline text highlighting, export, colored decision panel
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    request_changes: 'bg-yellow-100 text-yellow-700',
    draft: 'bg-gray-100 text-gray-500',
  };
  const labels: Record<string, string> = {
    pending: 'Pending',
    approved: '✅ Approved',
    rejected: '❌ Rejected',
    request_changes: '⚠️ Needs Changes',
    draft: 'Draft',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function TrustBadge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-green-700 bg-green-50' : score >= 70 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50';
  return <span className={`text-sm font-bold px-2 py-1 rounded ${color}`}>{score}/100</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
    suggestion: 'bg-blue-100 text-blue-700',
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[severity] ?? 'bg-gray-100 text-gray-700'}`}>{severity}</span>;
}

/** Highlight all flagged_text occurrences in original content */
function HighlightedContent({ text, flags }: { text: string; flags: AuditFlag[] }) {
  const phrases = [...new Set(flags.map(f => f.flagged_text).filter(Boolean))];
  if (phrases.length === 0) return <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">{text}</pre>;

  const escaped = phrases.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <p className="whitespace-pre-wrap text-sm text-gray-800">
      {parts.map((part, i) => {
        const matched = phrases.some(p => p.toLowerCase() === part.toLowerCase());
        return matched
          ? <mark key={i} className="bg-red-200 text-red-900 rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// ─── Queue view ───────────────────────────────────────────────────────────────
const FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Needs Changes'];
const filterMap: Record<string, string | null> = {
  All: null, Pending: 'pending', Approved: 'approved', Rejected: 'rejected', 'Needs Changes': 'request_changes',
};

function QueueView() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetch(`${API_BASE}/api/submissions`)
      .then(r => r.json())
      .then(d => { setSubmissions(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = submissions.filter(s => {
    const f = filterMap[activeFilter];
    return f === null || s.status === f;
  });

  if (loading) return (
    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500">Loading submissions...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f} {f === 'All' ? `(${submissions.length})` : `(${submissions.filter(s => s.status === filterMap[f]).length})`}
          </button>
        ))}

      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500">
          No submissions found. <Link href="/submit" className="text-indigo-600 hover:underline">Submit content to audit</Link> first.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Creator</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Content Preview</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Score</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Issues</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.creator_name}</div>
                    <div className="text-xs text-gray-400">{s.content_type}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-gray-600 truncate">{s.content_snippet}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TrustBadge score={s.trust_score ?? 0} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${s.total_flags > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {s.total_flags}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">
                    {s.submitted_at?.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/review?id=${s.id}`}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Individual review ────────────────────────────────────────────────────────
const DECISION_OPTIONS = [
  { value: 'approve', label: '✅ Approve', desc: 'Content meets brand standards', active: 'bg-green-600 text-white', inactive: 'border-green-300 text-green-700 hover:bg-green-50' },
  { value: 'request_changes', label: '⚠️ Request Changes', desc: 'Needs revisions before approval', active: 'bg-yellow-500 text-white', inactive: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' },
  { value: 'reject', label: '❌ Reject', desc: 'Does not meet brand standards', active: 'bg-red-600 text-white', inactive: 'border-red-300 text-red-700 hover:bg-red-50' },
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
    // Try API first, fall back to localStorage
    fetch(`http://localhost:8000/api/submission/${submissionId}`)
      .then(r => r.ok ? r.json() : null)
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
        body: JSON.stringify({ submission_id: id, action, reviewer_comment: comment || undefined }),
      });
      setSubmitted(true);
    } catch {
      alert('Failed to submit decision. Make sure the backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    const id = data?.submission_id ?? data?.id;
    if (!id) return;
    const r = await fetch(`http://localhost:8000/api/export/${id}`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `veribrand-report-${id.slice(0, 8)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
    </div>
  );

  if (!data) return (
    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
      <p className="text-gray-600 mb-4">Submission not found.</p>
      <Link href="/review" className="text-indigo-600 hover:underline">← Back to queue</Link>
    </div>
  );

  if (submitted) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-12 max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Decision Recorded</h2>
        <p className="text-gray-500 mb-6">Content has been <strong>{action.replace('_', ' ')}</strong>.</p>
        <div className="space-y-3">
          <Link href="/review" className="block w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700">
            ← Back to Review Queue
          </Link>
          <Link href="/submit" className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200">
            Submit New Content
          </Link>
        </div>
      </div>
    </div>
  );

  const score = data.brand_trust_score ?? data.trust_score ?? 0;
  const flags = data.flags ?? [];
  const originalContent = data.original_content ?? data.content ?? '';
  const critical = flags.filter(f => f.severity === 'critical').length;
  const warnings = flags.filter(f => f.severity === 'warning').length;
  const suggestions = flags.filter(f => f.severity === 'suggestion').length;
  const scoreColor = score >= 90 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600';
  const recommendation = score >= 90 ? { text: 'Safe to Publish', icon: '✅' } : score >= 70 ? { text: 'Review Suggested', icon: '⚠️' } : { text: 'Requires Changes', icon: '❌' };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main — 2 cols */}
      <div className="lg:col-span-2 space-y-6">
        {/* Score card */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Brand Trust Score</h3>
              <p className="text-sm text-gray-400">AI-calculated compliance rating</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${scoreColor}`}>{score}</div>
              <div className="text-sm text-gray-400">out of 100</div>
            </div>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full ${score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className={`text-center text-sm font-semibold ${scoreColor}`}>
            {recommendation.icon} {recommendation.text}
          </div>

          {/* Summary row */}
          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100 text-sm">
            <span className="text-red-600 font-semibold">⛔ {critical} Critical</span>
            <span className="text-yellow-600 font-semibold">⚠️ {warnings} Warnings</span>
            <span className="text-blue-600 font-semibold">💡 {suggestions} Suggestions</span>
          </div>
        </div>

        {/* Original Content with Highlighting */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Original Content</h3>
            <button onClick={handleExport}
              className="text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors">
              📥 Export Report
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <HighlightedContent text={originalContent} flags={flags} />
          </div>
          {flags.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              🔴 Highlighted text indicates flagged content
            </p>
          )}
        </div>

        {/* Round 3: Intent-Preserving Compliant Rewrite Preview */}
        {reviewData.rewritten_content && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-lg p-6 border border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Round 3 Delivery
                </span>
                <h3 className="text-lg font-bold text-gray-900">✨ Intent-Preserving Compliant Rewrite</h3>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              AI-generated brand-compliant revision preserving creator voice and persuasive intent.
            </p>
            <div className="bg-white rounded-lg p-4 border border-emerald-200 text-sm text-gray-800 font-mono whitespace-pre-wrap">
              {reviewData.rewritten_content}
            </div>
          </div>
        )}

        {/* Flags */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Compliance Issues ({flags.length})</h3>
          {flags.length === 0 ? (
            <div className="text-center py-8 text-green-600">
              <span className="text-4xl">✅</span>
              <p className="font-semibold mt-2">No compliance issues detected!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flags.map((flag, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900">{flag.issue_type}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <SeverityBadge severity={flag.severity} />
                        <span className="text-xs text-gray-400">Confidence: {flag.confidence}</span>
                      </div>
                    </div>
                  </div>
                  {flag.flagged_text && (
                    <div className="mb-2 bg-red-50 border border-red-200 rounded p-2">
                      <div className="text-xs font-semibold text-red-800 mb-1">Flagged Text:</div>
                      <code className="text-sm text-red-700">"{flag.flagged_text}"</code>
                    </div>
                  )}
                  <p className="text-sm text-gray-700 mb-2">{flag.explanation}</p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                    <div className="text-xs font-semibold text-blue-800 mb-1">Rule Citation:</div>
                    <p className="text-sm text-blue-700 italic">"{flag.rule_citation}"</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <div className="text-xs font-semibold text-green-800 mb-1">Suggested Fix:</div>
                    <p className="text-sm text-green-700">{flag.suggested_fix}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Make Decision</h3>
            <p className="text-xs text-gray-400">ID: {(data.submission_id ?? data.id ?? '').slice(0, 8)}...</p>
          </div>

          <div className="space-y-3">
            {DECISION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAction(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                  action === opt.value ? opt.active + ' border-transparent shadow-md' : `bg-white ${opt.inactive} border-2`
                }`}
              >
                <div className="font-semibold">{opt.label}</div>
                <div className={`text-xs mt-0.5 ${action === opt.value ? 'opacity-80' : 'text-gray-400'}`}>{opt.desc}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Comments</label>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Add notes for the creator..."
            />
          </div>

          <button
            onClick={handleApproval} disabled={!action || submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Decision'}
          </button>

          {/* Summary */}
          <div className="pt-4 border-t border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total Issues:</span><span className="font-semibold">{flags.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Critical:</span><span className="font-semibold text-red-600">{critical}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Warnings:</span><span className="font-semibold text-yellow-600">{warnings}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Suggestions:</span><span className="font-semibold text-blue-600">{suggestions}</span></div>
          </div>

          <Link href="/review" className="block text-center text-sm text-indigo-600 hover:underline">
            ← Back to Queue
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────
function ReviewPageContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">VeriBrand</h1>
          </Link>
          <div className="flex space-x-4 text-sm font-medium">
            <Link href="/upload" className="text-gray-600 hover:text-indigo-600">Upload Guidelines</Link>
            <Link href="/submit" className="text-gray-600 hover:text-indigo-600">Submit Content</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {submissionId ? 'Review Submission' : 'Review Queue'}
          </h2>
          <p className="text-gray-500 mt-1">
            {submissionId ? 'Review compliance issues and make a decision.' : 'All submissions with their audit status.'}
          </p>
        </div>

        {submissionId ? <IndividualReview submissionId={submissionId} /> : <QueueView />}
      </main>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}
