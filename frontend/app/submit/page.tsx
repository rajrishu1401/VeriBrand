'use client';

/**
 * Content Submission Page - Enhanced
 * Animated gauge, severity icons, loading steps, guideline selector, flag grouping
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AuditFlag {
  issue_type: string;
  severity: string;
  flagged_text: string;
  rule_citation: string;
  explanation: string;
  suggested_fix: string;
  confidence: string;
}

interface AuditResponse {
  submission_id: string;
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
      if (start >= score) { setDisplayed(score); clearInterval(id); }
      else setDisplayed(start);
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
const LOADING_STEPS = [
  'Running deterministic checks...',
  'Semantic RAG analysis via Gemini...',
  'Calculating trust score...',
];

function AuditingAnimation() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % LOADING_STEPS.length), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
      <p className="text-lg font-semibold text-gray-800 mb-2">Analyzing content...</p>
      <p className="text-sm text-indigo-600 animate-pulse">{LOADING_STEPS[step]}</p>
      <div className="flex justify-center mt-6 gap-1">
        {LOADING_STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-indigo-600 scale-125' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Severity helpers ─────────────────────────────────────────────────────────
function severityDot(s: string) {
  if (s === 'critical') return <span className="w-2 h-2 rounded-full bg-red-500 inline-block mt-1 shrink-0" />;
  if (s === 'warning') return <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block mt-1 shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-blue-400 inline-block mt-1 shrink-0" />;
}

function severityClasses(s: string) {
  if (s === 'critical') return 'border-l-4 border-red-500 bg-red-50';
  if (s === 'warning') return 'border-l-4 border-yellow-500 bg-yellow-50';
  return 'border-l-4 border-blue-400 bg-blue-50';
}

function severityBadge(s: string) {
  if (s === 'critical') return 'bg-red-100 text-red-800';
  if (s === 'warning') return 'bg-yellow-100 text-yellow-800';
  return 'bg-blue-100 text-blue-800';
}

// ─── Flag card ────────────────────────────────────────────────────────────────
function FlagCard({ flag }: { flag: AuditFlag; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-lg p-4 ${severityClasses(flag.severity)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
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
              <code className="mt-1 block text-xs bg-white/70 px-2 py-1 rounded text-gray-800 font-mono">
                &quot;{flag.flagged_text}&quot;
              </code>
            )}
            <p className="mt-1 text-sm text-gray-700">{flag.explanation}</p>
            <p className="mt-1 text-xs text-gray-500 italic">Rule: {flag.rule_citation}</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-indigo-600 hover:underline ml-2 whitespace-nowrap shrink-0"
        >
          {expanded ? 'Hide fix ▲' : 'Show fix ▼'}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
          <span className="font-semibold">Suggested fix: </span>{flag.suggested_fix}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SubmitPage() {
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text');
  const [creatorName, setCreatorName] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [selectedGuideline, setSelectedGuideline] = useState<string>('');

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
    setContent(`Introducing the BEST marketing tool you'll ever need!\n\nOur revolutionary platform GUARANTEES 100% success for your campaigns. It's absolutely FREE with no hidden costs - never worry about budget constraints again!\n\nJoin thousands of satisfied customers who have experienced unprecedented growth. We're the #1 choice for marketing professionals worldwide, and our unmatched features will transform your business overnight.\n\nGet started today and see results immediately!`);
  };

  const loadSampleGood = () => {
    setContent(`Introducing our new marketing analytics platform.\n\nOur platform helps businesses track campaign performance with real-time insights. Try our free trial (no credit card required, terms apply).\n\nJoin over 5,000 businesses using our tools to improve their marketing strategy. Our feature set includes audience segmentation, A/B testing, and performance tracking.\n\nGet started with our 14-day trial today. Results may vary based on your use case.`);
  };

  const handleSubmit = async () => {
    if (!content.trim()) { setError('Please enter content to audit'); return; }
    setAuditing(true); setError(null); setResult(null);
    try {
      const response = await fetch(`${API_BASE}/api/submit-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, content_type: contentType, creator_name: creatorName }),
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

  const deterministicFlags = result?.flags.filter(f => f.confidence === 'high') ?? [];
  const semanticFlags = result?.flags.filter(f => f.confidence !== 'high') ?? [];
  const critical = result?.flags.filter(f => f.severity === 'critical').length ?? 0;
  const warnings = result?.flags.filter(f => f.severity === 'warning').length ?? 0;
  const suggestions = result?.flags.filter(f => f.severity === 'suggestion').length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
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
            <Link href="/review" className="text-gray-600 hover:text-indigo-600">Review Queue</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Submit Content for Audit</h2>
          <p className="text-gray-600">Paste your marketing copy, blog post, or email. Get instant brand compliance audit.</p>
        </div>

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
                  type="text" value={creatorName} onChange={e => setCreatorName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <select
                  value={contentType} onChange={e => setContentType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white"
                >
                  <option value="text">General Text</option>
                  <option value="blog_post">Blog Post</option>
                  <option value="email">Email Campaign</option>
                  <option value="social_media">Social Media</option>
                  <option value="landing_page">Landing Page</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content to Audit</label>
                <textarea
                  value={content} onChange={e => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Paste your marketing content here..."
                />
                <div className="mt-1 text-xs text-gray-400">{content.length} characters</div>
              </div>

              <div className="flex space-x-3">
                <button onClick={loadSampleBad}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200">
                  Try Non-Compliant Content
                </button>
                <button onClick={loadSampleGood}
                  className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors border border-green-200">
                  Try Compliant Content
                </button>
              </div>

              <button
                onClick={handleSubmit} disabled={auditing || !content.trim()}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {auditing ? 'Analyzing...' : 'Run Compliance Audit'}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-2">How it works</p>
              <ul className="space-y-1 text-xs">
                <li>• Deterministic rules check banned words &amp; patterns instantly</li>
                <li>• Semantic RAG retrieves relevant guideline sections via Gemini</li>
                <li>• Gemini LLM audits tone, context &amp; nuance violations</li>
                <li>• Every flag carries an exact guideline citation</li>
              </ul>
            </div>
          </div>

          {/* Results Column */}
          <div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800 text-sm">
                {error}
              </div>
            )}

            {auditing && <AuditingAnimation />}

            {result && !auditing && (
              <div className="space-y-6">
                {/* Trust Score Gauge */}
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Brand Trust Score</h3>
                  <TrustGauge score={result.brand_trust_score} />

                  {result.total_issues > 0 && (
                    <div className="flex justify-center gap-4 mt-4 text-sm">
                      {critical > 0 && <span className="flex items-center gap-1 text-red-600 font-semibold">{critical} Critical</span>}
                      {warnings > 0 && <span className="flex items-center gap-1 text-yellow-600 font-semibold">{warnings} Warnings</span>}
                      {suggestions > 0 && <span className="flex items-center gap-1 text-blue-600 font-semibold">{suggestions} Suggestions</span>}
                    </div>
                  )}
                  {result.total_issues === 0 && (
                    <p className="text-green-600 font-semibold mt-4">No issues found — content is compliant!</p>
                  )}
                </div>

                {/* Grouped Flags */}
                {result.flags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900">
                      Compliance Issues <span className="text-gray-400 font-normal">({result.flags.length})</span>
                    </h3>

                    {deterministicFlags.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-px flex-1 bg-gray-200" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deterministic Rules</span>
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        <div className="space-y-3">
                          {deterministicFlags.map((flag, i) => <FlagCard key={i} flag={flag} idx={i} />)}
                        </div>
                      </div>
                    )}

                    {semanticFlags.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-px flex-1 bg-gray-200" />
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gemini Semantic AI</span>
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                        <div className="space-y-3">
                          {semanticFlags.map((flag, i) => <FlagCard key={i} flag={flag} idx={i} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps</h3>
                  <div className="space-y-3">
                    <Link
                      href={`/review?id=${result.submission_id}`}
                      className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
                    >
                      Review &amp; Approve/Reject
                    </Link>
                    <button
                      onClick={() => { setResult(null); setContent(''); }}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Submit New Content
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!result && !error && !auditing && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">Submit content to see compliance audit results here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
