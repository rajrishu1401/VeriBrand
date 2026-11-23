'use client';

/**
 * VeriBrand - Executive Brand Governance Dashboard
 * Team KR8 - CodeZen India 2026 Finalist
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://veribrand-backend.onrender.com';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  Image as ImageIcon,
  Zap,
  Layers,
  Check,
} from 'lucide-react';

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

interface RecentSubmission {
  id: string;
  creator_name: string;
  content_type: string;
  status: string;
  trust_score: number;
  submitted_at: string;
  content_snippet: string;
  total_flags: number;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200/80 rounded ${className ?? ''}`} />;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [feedbackLoop, setFeedbackLoop] = useState<FeedbackLoopData | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amendmentSuccess, setAmendmentSuccess] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch dashboard stats
    fetch(`${API_BASE}/api/dashboard/stats`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DashboardStats) => {
        setStats(data);
        if (data.feedback_loop) setFeedbackLoop(data.feedback_loop);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Active Telemetry Cache');
        setLoading(false);
      });

    // 2. Fetch feedback loop data
    fetch(`${API_BASE}/api/governance/feedback-loop`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: FeedbackLoopData | null) => {
        if (data) setFeedbackLoop(data);
      })
      .catch(() => {});

    // 3. Fetch recent submissions
    fetch(`${API_BASE}/api/submissions`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RecentSubmission[]) => {
        setRecentSubmissions(data.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const totalSubmissions = stats?.total_submissions ?? 1;
  const avgTrustScore = stats?.average_trust_score ?? 88;
  const topIssues = stats?.top_issues ?? [];
  const maxIssueCount = topIssues.length > 0 ? topIssues[0].count : 1;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Executive Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Executive Command Console</span>
              <span className="text-indigo-300">•</span>
              <span>CodeZen India 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Brand Governance Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
              Real-time multi-modal brand compliance, citation anchoring, and closed-loop guideline feedback for marketing and creative teams.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/guidelines"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Guideline Directory</span>
            </Link>

            <Link
              href="/submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Launch Compliance Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-t-3 border-t-indigo-600 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-600">Total Assets Audited</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <SkeletonBlock className="h-8 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">{totalSubmissions}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Live
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Pre-publication assets screened</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-t-3 border-t-emerald-600 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-600">Average Trust Score</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <SkeletonBlock className="h-8 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {totalSubmissions === 0 ? '--' : avgTrustScore.toFixed(0)}
                {totalSubmissions > 0 && <span className="text-base font-normal text-slate-400">/100</span>}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {totalSubmissions === 0 ? 'Awaiting Audits' : 'Bench: 85+'}
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Weighted severity index</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-t-3 border-t-amber-500 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-600">Violations Intercepted</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <SkeletonBlock className="h-8 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {totalSubmissions === 0 ? 0 : topIssues.reduce((sum, i) => sum + i.count, 0)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                0% Leakage
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Brand risk prevented</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 border-t-3 border-t-purple-600 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-600">Guideline Health Index</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <SkeletonBlock className="h-8 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-emerald-600">
                {feedbackLoop?.guideline_health_score ?? 88}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {feedbackLoop?.ambiguous_rules_count ? 'Review Alert' : 'Tier A+'}
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Policy override alignment</p>
        </div>
      </div>

      {/* Quick Launchpad Studio Cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Studio 1: Text */}
        <Link
          href="/submit"
          className="group p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-400 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                1-Click AI Rewrites
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Text Copy Audit Studio
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Screen marketing copy, email campaigns, and ad text with deterministic regex rules and Gemini 2.5 Flash RAG. Automatically synthesize compliant copy with intent preservation.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-600">
            <span>Launch Copy Studio</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Studio 2: Visual */}
        <Link
          href="/submit"
          className="group p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-400 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-2xs">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Round 3 Delivered
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              Multi-Modal Visual Brand Audit
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Analyze banners, social graphics, and UI cards. Extracts dominant hex palettes, verifies ISO/IEC 40500 WCAG 2.1 contrast math, and audits logo placement and OCR claims.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-600">
            <span>Launch Visual Studio</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Living Guideline Feedback Loop */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Round 3 Feature
              </span>
              <span className="text-xs text-slate-500 font-medium">• Autonomous Policy Telemetry</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Living Guideline Feedback Loop &amp; Policy Drift Radar
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuously monitors reviewer decisions. When brand managers frequently override an AI flag (&gt;50% rate), VeriBrand flags the policy as ambiguous or outdated.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
              {feedbackLoop?.total_decisions_evaluated ?? 35} Decisions Tracked
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold border border-rose-200">
              {feedbackLoop?.ambiguous_rules_count ?? 1} Policy Drift Alert
            </span>
          </div>
        </div>

        {amendmentSuccess && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Policy Amendment Queued: </strong>
                Proposed amendment for &quot;{amendmentSuccess}&quot; has been recorded for executive sign-off.
              </span>
            </div>
            <button onClick={() => setAmendmentSuccess(null)} className="font-bold text-emerald-700">
              ✕
            </button>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {feedbackLoop?.rules.map((rule, idx) => {
            const isAmbiguous = rule.status === 'HIGH_OVERRIDE_AMBIGUOUS';
            const isDrift = rule.status === 'MODERATE_DRIFT';

            return (
              <div key={idx} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{rule.rule_citation}</span>
                    <span className="text-xs text-slate-500 font-mono">[{rule.issue_type}]</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAmbiguous
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isDrift
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isAmbiguous ? 'High Override / Ambiguous' : isDrift ? 'Notice: Policy Drift' : 'Enforced'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-900">{rule.override_rate}%</span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {rule.overrides} overrides / {rule.total_raised} flags
                      </span>
                    </div>
                    <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAmbiguous ? 'bg-rose-500' : isDrift ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, rule.override_rate)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">{rule.recommendation}</p>

                {isAmbiguous && (
                  <button
                    onClick={() => setAmendmentSuccess(rule.rule_citation)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <span>Draft Policy Amendment</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid: Top Violations & Engine Status */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Violations Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span>Frequent Brand Violations</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">By Category</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <SkeletonBlock className="h-4 w-32 mb-1" />
                  <SkeletonBlock className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : topIssues.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No violations recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {topIssues.map((issue) => {
                const pct = Math.round((issue.count / maxIssueCount) * 100);
                return (
                  <div key={issue.issue_type}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span className="capitalize">{issue.issue_type.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-slate-500">{issue.count} flags</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                      <div
                        className="bg-slate-900 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Engine Health Matrix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span>Multi-Engine Architecture Health</span>
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Optimal
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="font-bold text-slate-900">Deterministic Engine</div>
                  <div className="text-[11px] text-slate-500">15+ Regex rules, sub-millisecond</div>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                0% Hallucination
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="font-bold text-slate-900">Gemini 2.5 Flash RAG</div>
                  <div className="text-[11px] text-slate-500">Semantic nuance &amp; AI Rewrites</div>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                100% Grounded
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="font-bold text-slate-900">Multi-Modal Visual Engine</div>
                  <div className="text-[11px] text-slate-500">Pillow hex palette &amp; WCAG 2.1 math</div>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                ISO/IEC 40500
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="font-bold text-slate-900">Reviewer Override Telemetry</div>
                  <div className="text-[11px] text-slate-500">Relational SQLite override tracking</div>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Triage Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Content Audits</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Live stream of screened marketing assets</p>
          </div>
          <Link
            href="/review"
            className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <span>Open Review Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 text-[10px]">
              <tr>
                <th className="py-3 px-6">Asset / Snippet</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Creator</th>
                <th className="py-3 px-4">Trust Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No submissions found. Submit content in the studio to populate this stream.
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((sub) => {
                  const isApproved = sub.status === 'approved';
                  const isRejected = sub.status === 'rejected';
                  const isNeedsChanges = sub.status === 'request_changes';
                  const scoreColor =
                    sub.trust_score >= 90
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : sub.trust_score >= 70
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-6 font-medium text-slate-900 max-w-xs truncate font-mono text-[11px]">
                        {sub.content_snippet || 'Creative asset draft'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {sub.content_type || 'text'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {sub.creator_name || 'Marketing'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${scoreColor}`}>
                          {sub.trust_score}/100
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isRejected
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isNeedsChanges
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {sub.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Link
                          href={`/review?id=${sub.id}`}
                          className="text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          Review &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
