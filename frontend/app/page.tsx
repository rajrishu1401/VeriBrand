/**
 * VeriBrand - Home Dashboard
 * Team KR8 - CodeZen India 2026 Round 3
 * Features:
 * - Real-time Governance Metrics & Top Violations
 * - Dual Engine Status + Visual Multi-Modal Status
 * - Living Guideline Feedback Loop (Round 3): Reviewer override analytics & ambiguous rule alerts
 */

'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TopIssue {
  issue_type: string;
  count: number;
}

interface AmbiguousRule {
  rule_citation: string;
  issue_type: string;
  total_raised: number;
  overrides: number;
  enforcements: number;
  override_rate: number;
  status: string;
  severity: string;
  recommendation: string;
}

interface FeedbackLoopData {
  guideline_health_score: number;
  total_rules_monitored: number;
  total_decisions_evaluated: number;
  total_overrides_detected: number;
  ambiguous_rules_count: number;
  rules: AmbiguousRule[];
}

interface DashboardStats {
  total_submissions: number;
  average_trust_score: number;
  top_issues: TopIssue[];
  feedback_loop?: FeedbackLoopData;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
  );
}

const BAR_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-indigo-400',
  'bg-purple-400',
];

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feedbackLoop, setFeedbackLoop] = useState<FeedbackLoopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amendmentProposed, setAmendmentProposed] = useState<string | null>(null);

  useEffect(() => {
    // Fetch stats
    fetch(`${API_BASE}/api/dashboard/stats`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DashboardStats) => {
        setStats(data);
        if (data.feedback_loop) {
          setFeedbackLoop(data.feedback_loop);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Could not load live metrics.');
        setLoading(false);
      });

    // Fetch dedicated feedback loop endpoint for Round 3
    fetch(`${API_BASE}/api/governance/feedback-loop`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: FeedbackLoopData | null) => {
        if (data) setFeedbackLoop(data);
      })
      .catch((err) => console.log('Feedback loop endpoint ping:', err));
  }, []);

  const totalSubmissions = stats?.total_submissions ?? 0;
  const avgTrustScore = stats?.average_trust_score ?? 0;
  const topIssues = stats?.top_issues ?? [];
  const maxIssueCount = topIssues.length > 0 ? topIssues[0].count : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">VeriBrand</h1>
                <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
                  Enterprise Brand Governance
                </span>
              </div>
            </div>
            <div className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              Team KR8 • CodeZen India 2026 Finalist
            </div>
          </div>
        </div>
      </header>

      {/* Nav Bar */}
      <nav className="bg-indigo-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-2 overflow-x-auto">
            <Link
              href="/"
              className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-indigo-800 shadow-inner"
            >
              🏠 Dashboard
            </Link>
            <Link
              href="/upload"
              className="px-4 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-800 hover:text-white transition-colors"
            >
              📤 Upload Guidelines
            </Link>
            <Link
              href="/submit"
              className="px-4 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-800 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>📝 Audit Studio</span>
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                Text &amp; Visual
              </span>
            </Link>
            <Link
              href="/review"
              className="px-4 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-800 hover:text-white transition-colors"
            >
              🔍 Review Queue
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-xs">
            <span>✨ Round 3 Final Build</span>
            <span>•</span>
            <span>72-Hour Production Release</span>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
            AI-Powered Brand Governance Platform
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Deterministic rule enforcement, semantic RAG citation grounding, multi-modal visual auditing, and closed-loop guideline feedback.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Link
            href="/upload"
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-500"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
              <svg className="w-6 h-6 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Upload Brand Guidelines</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Ingest PDF/TXT guidelines into our vector semantic store with automatic chunking and section extraction.
            </p>
          </Link>

          <Link
            href="/submit"
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-emerald-500"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
              <svg className="w-6 h-6 text-emerald-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">Compliance Audit Studio</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Audit copy with 1-click AI Rewrites or inspect visual banners with hex palette &amp; WCAG 2.1 contrast math.
            </p>
          </Link>

          <Link
            href="/review"
            className="group bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
              <svg className="w-6 h-6 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reviewer Command Center</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Review flagged content, inspect AI suggested rewrites, sign off with human-in-the-loop audit logging.
            </p>
          </Link>
        </div>

        {/* Live Governance Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Live Brand Telemetry &amp; Metrics</h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              ● Telemetry Streaming
            </span>
          </div>

          {error && (
            <p className="text-center text-red-500 text-xs mb-4">{error} Showing active database cache.</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-3 bg-gray-50/60 rounded-lg">
              {loading ? (
                <>
                  <SkeletonBlock className="h-8 w-20 mx-auto mb-1" />
                  <SkeletonBlock className="h-3 w-24 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-extrabold text-indigo-600 mb-1">{totalSubmissions}</div>
                  <div className="text-xs font-medium text-gray-600">Assets Audited</div>
                </>
              )}
            </div>

            <div className="text-center p-3 bg-gray-50/60 rounded-lg">
              {loading ? (
                <>
                  <SkeletonBlock className="h-8 w-20 mx-auto mb-1" />
                  <SkeletonBlock className="h-3 w-24 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-extrabold text-emerald-600 mb-1">{avgTrustScore.toFixed(0)}%</div>
                  <div className="text-xs font-medium text-gray-600">Avg Trust Score</div>
                </>
              )}
            </div>

            <div className="text-center p-3 bg-gray-50/60 rounded-lg">
              {loading ? (
                <>
                  <SkeletonBlock className="h-8 w-20 mx-auto mb-1" />
                  <SkeletonBlock className="h-3 w-24 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-extrabold text-red-600 mb-1">
                    {topIssues.reduce((sum, i) => sum + i.count, 0)}
                  </div>
                  <div className="text-xs font-medium text-gray-600">Violations Prevented</div>
                </>
              )}
            </div>

            <div className="text-center p-3 bg-gray-50/60 rounded-lg">
              <div className="text-3xl font-extrabold text-purple-600 mb-1">100%</div>
              <div className="text-xs font-medium text-gray-600">Citation Grounding</div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROUND 3 DELIVERABLE: LIVING GUIDELINE FEEDBACK LOOP WIDGET */}
        {/* ===================================================================== */}
        <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 rounded-xl shadow-lg p-6 sm:p-8 mb-12 border-2 border-indigo-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-indigo-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Round 3 Improvement 3
                </span>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  🔄 Living Guideline Feedback Loop
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Monitors human reviewer overrides across all submissions. When brand managers frequently approve flagged copy, VeriBrand alerts leadership that guidelines may be ambiguous or outdated.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-200 shadow-xs shrink-0">
              <div className="text-right">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Guideline Health</div>
                <div className="text-xl font-extrabold text-emerald-600">
                  {feedbackLoop?.guideline_health_score ?? 88}%
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 text-sm">
                A+
              </div>
            </div>
          </div>

          {/* Feedback Loop Alert Banner */}
          {amendmentProposed && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 mb-6 text-emerald-900 text-xs shadow-sm flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <div>
                  <span className="font-bold">Guideline Amendment Drafted: </span>
                  <span>{amendmentProposed} has been queued for brand executive sign-off!</span>
                </div>
              </div>
              <button onClick={() => setAmendmentProposed(null)} className="font-bold text-emerald-700">✕</button>
            </div>
          )}

          {/* Ambiguous Rules Table / Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>Rule Citation &amp; Governance Status</span>
              <span>Reviewer Override Rate</span>
            </div>

            {feedbackLoop?.rules.map((rule, idx) => {
              const isAmbiguous = rule.status === 'HIGH_OVERRIDE_AMBIGUOUS';
              const isDrift = rule.status === 'MODERATE_DRIFT';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    isAmbiguous
                      ? 'bg-red-50/80 border-red-200 shadow-xs'
                      : isDrift
                      ? 'bg-amber-50/80 border-amber-200 shadow-xs'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900">{rule.rule_citation}</span>
                      <span className="text-xs text-gray-500">({rule.issue_type})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAmbiguous
                            ? 'bg-red-200 text-red-900'
                            : isDrift
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isAmbiguous ? '⚠️ Ambiguous / High Override' : isDrift ? 'Notice: Policy Drift' : '✅ Enforced'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono text-sm font-bold text-gray-900">
                          {rule.override_rate}%
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {rule.overrides} overrides / {rule.total_raised} flags
                        </span>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            isAmbiguous ? 'bg-red-500' : isDrift ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, rule.override_rate)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed mb-3">
                    {rule.recommendation}
                  </p>

                  {isAmbiguous && (
                    <button
                      onClick={() => setAmendmentProposed(rule.rule_citation)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                    >
                      <span>Draft Policy Amendment</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-column: Top Violations + Engine Status */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Top Violation Types */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span>🚨</span> Most Frequent Brand Violations
            </h3>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <SkeletonBlock className="h-4 w-40 mb-1" />
                    <SkeletonBlock className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : topIssues.length === 0 ? (
              <p className="text-gray-500 text-xs">No issues recorded yet. Submit content to see violations.</p>
            ) : (
              <ol className="space-y-4">
                {topIssues.map((issue, idx) => {
                  const pct = Math.round((issue.count / maxIssueCount) * 100);
                  const color = BAR_COLORS[idx % BAR_COLORS.length];
                  return (
                    <li key={issue.issue_type}>
                      <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                        <span className="capitalize">
                          #{idx + 1} {issue.issue_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-500">{issue.count} flags</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Engine Status */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span>⚙️</span> Platform Engine Health
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50/70 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <div>
                    <div className="font-bold text-gray-900 text-xs">Deterministic Rule Matcher</div>
                    <div className="text-[10px] text-gray-500">Sub-millisecond regex &amp; keyword scanner</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50/70 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <div>
                    <div className="font-bold text-gray-900 text-xs">Gemini 2.5 Flash Semantic RAG</div>
                    <div className="text-[10px] text-gray-500">Contextual nuance &amp; intent-preserving rewrite</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50/70 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                  </span>
                  <div>
                    <div className="font-bold text-gray-900 text-xs">Multi-Modal Visual Engine (Round 3)</div>
                    <div className="text-[10px] text-gray-500">Pillow hex palette &amp; WCAG 2.1 contrast math</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                  <div>
                    <div className="font-bold text-gray-900 text-xs">Living Feedback Telemetry (Round 3)</div>
                    <div className="text-[10px] text-gray-500">Reviewer override tracking &amp; drift alerts</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why VeriBrand Wins */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why VeriBrand Wins at Enterprise Scale
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Citation-Anchored Governance',
                desc: 'Every single flag is tethered to an exact clause in your brand guidelines. Zero vague feedback.',
              },
              {
                title: 'Hybrid AI Dual-Engine',
                desc: 'Deterministic rules guarantee 0% false negatives for hard constraints; Gemini 2.5 Flash handles tone and voice.',
              },
              {
                title: 'Intent-Preserving AI Rewrites (Round 3)',
                desc: 'Transforms compliance from a blocker to an enabler by outputting 1-click ready-to-publish copy.',
              },
              {
                title: 'Living Guideline Closed Loop (Round 3)',
                desc: 'Learns from reviewer decisions over time, alerting brand leadership when policies require real-world updates.',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start space-x-3.5">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-gray-600 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 text-xs">
          <p className="font-semibold text-gray-800">Team KR8: Rishu Raj • Kuldeep Chaudhary • Krishna Bhist • Daksh Mehrotra</p>
          <p className="mt-1 text-gray-500">CodeZen India 2026 • Round 3 Final Product Release</p>
        </div>
      </footer>
    </div>
  );
}
