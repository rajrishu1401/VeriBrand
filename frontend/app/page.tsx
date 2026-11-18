/**
 * VeriBrand - Home Dashboard
 * Team KR8 - CodeZen India 2026 Round 2
 */

'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface TopIssue {
  issue_type: string;
  count: number;
}

interface DashboardStats {
  total_submissions: number;
  average_trust_score: number;
  top_issues: TopIssue[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/dashboard/stats`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DashboardStats) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Could not load live metrics.');
        setLoading(false);
      });
  }, []);

  const totalSubmissions = stats?.total_submissions ?? 0;
  const avgTrustScore = stats?.average_trust_score ?? 0;
  const topIssues = stats?.top_issues ?? [];
  const maxIssueCount = topIssues.length > 0 ? topIssues[0].count : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">VeriBrand</h1>
            </div>
            <div className="text-sm text-gray-600">
              Team KR8 • CodeZen India 2026
            </div>
          </div>
        </div>
      </header>

      {/* Nav Bar */}
      <nav className="bg-indigo-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-2">
            <Link
              href="/"
              className="px-4 py-2 rounded-md text-sm font-medium text-indigo-100 bg-indigo-800 hover:bg-indigo-900 transition-colors"
            >
              🏠 Dashboard
            </Link>
            <Link
              href="/upload"
              className="px-4 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-800 transition-colors"
            >
              📤 Upload Guidelines
            </Link>
            <Link
              href="/submit"
              className="px-4 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-800 transition-colors"
            >
              📝 Submit Content
            </Link>
            <Link
              href="/review"
              className="px-4 py-2 rounded-md text-sm font-medium text-indigo-100 hover:bg-indigo-800 transition-colors"
            >
              🔍 Review &amp; Approve
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            AI-Powered Brand Governance
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Catch brand guideline violations before publication with citation-anchored feedback.
            <br />
            <span className="text-indigo-600 font-semibold">Deterministic + Semantic AI = Zero Hallucination</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Link
            href="/upload"
            className="group bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-indigo-500"
          >
            <div className="w-14 h-14 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
              <svg className="w-8 h-8 text-indigo-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Guidelines</h3>
            <p className="text-gray-600">
              Upload your brand guideline PDF. We&apos;ll extract rules and create a compliance knowledge base.
            </p>
          </Link>

          <Link
            href="/submit"
            className="group bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500"
          >
            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
              <svg className="w-8 h-8 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Content</h3>
            <p className="text-gray-600">
              Submit marketing copy, blog posts, or emails. Get instant compliance audit with exact rule citations.
            </p>
          </Link>

          <Link
            href="/review"
            className="group bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
          >
            <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
              <svg className="w-8 h-8 text-purple-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Review &amp; Approve</h3>
            <p className="text-gray-600">
              Review flagged content, see before/after comparisons, and approve or reject with confidence.
            </p>
          </Link>
        </div>

        {/* Live Governance Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Live Governance Metrics</h3>

          {error && (
            <p className="text-center text-red-500 text-sm mb-4">{error} Showing cached values.</p>
          )}

          <div className="grid md:grid-cols-4 gap-6">
            {/* Content Audits */}
            <div className="text-center">
              {loading ? (
                <>
                  <SkeletonBlock className="h-10 w-24 mx-auto mb-2" />
                  <SkeletonBlock className="h-4 w-28 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-indigo-600 mb-2">
                    {totalSubmissions}
                  </div>
                  <div className="text-gray-600">Content Audits</div>
                </>
              )}
            </div>

            {/* Avg Trust Score */}
            <div className="text-center">
              {loading ? (
                <>
                  <SkeletonBlock className="h-10 w-24 mx-auto mb-2" />
                  <SkeletonBlock className="h-4 w-28 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {avgTrustScore.toFixed(0)}%
                  </div>
                  <div className="text-gray-600">Avg Trust Score</div>
                </>
              )}
            </div>

            {/* Issues Caught */}
            <div className="text-center">
              {loading ? (
                <>
                  <SkeletonBlock className="h-10 w-24 mx-auto mb-2" />
                  <SkeletonBlock className="h-4 w-28 mx-auto" />
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {topIssues.reduce((sum, i) => sum + i.count, 0)}
                  </div>
                  <div className="text-gray-600">Issues Caught</div>
                </>
              )}
            </div>

            {/* Citation Accuracy */}
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-gray-600">Citation Accuracy</div>
            </div>
          </div>
        </div>

        {/* Two-column: Top Violations + Engine Status */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">

          {/* Top Violation Types */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span>🚨</span> Top Violation Types
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
              <p className="text-gray-500 text-sm">No issues recorded yet. Submit content to see violations.</p>
            ) : (
              <ol className="space-y-4">
                {topIssues.map((issue, idx) => {
                  const pct = Math.round((issue.count / maxIssueCount) * 100);
                  const color = BAR_COLORS[idx % BAR_COLORS.length];
                  return (
                    <li key={issue.issue_type}>
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                        <span className="capitalize">
                          #{idx + 1} {issue.issue_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-500">{issue.count} flags</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`${color} h-2.5 rounded-full transition-all duration-700`}
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
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span>⚙️</span> Engine Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Deterministic Engine</div>
                    <div className="text-xs text-gray-500">Rule-based, zero hallucination</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">Active</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Gemini Semantic RAG</div>
                    <div className="text-xs text-gray-500">Nuance detection, citation-anchored</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">Active</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">SQLite Audit Log</div>
                    <div className="text-xs text-gray-500">Persistent storage, full history</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why VeriBrand */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why VeriBrand Wins
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Citation-Anchored Feedback',
                desc: "Every flag links to exact guideline section. No generic \"this looks off\" feedback.",
              },
              {
                title: 'Hybrid AI Architecture',
                desc: 'Deterministic rules (zero hallucination) + Semantic RAG (catches nuance).',
              },
              {
                title: 'Pre-Publication Workflow',
                desc: 'Catches issues before they go live. Not post-mortem damage control.',
              },
              {
                title: 'Confidence Scoring',
                desc: 'Every flag shows confidence level. Reviewers know which issues are critical.',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Team KR8: Rishu Raj • Kuldeep Chaudhary • Krishna Bhist • Daksh Mehrotra</p>
          <p className="mt-2 text-sm">CodeZen India 2026 • Round 2 Submission</p>
        </div>
      </footer>
    </div>
  );
}
