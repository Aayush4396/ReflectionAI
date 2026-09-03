import React, { useState, useMemo } from 'react';
import { 
  JournalEntry, 
  TrendSynthesisResponse 
} from '../types';
import { synthesizeJournalTrends } from '../lib/gemini-client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Sparkles,
  TrendingUp,
  Brain,
  Calendar,
  Smile,
  Compass,
  CheckCircle,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Lightbulb,
  Bookmark
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalyticsDashboardProps {
  entries: JournalEntry[];
  onOpenEntry?: (entry: JournalEntry) => void;
}

type Timeframe = '7days' | '30days' | 'all';

// Mood color mapping & valence scores
const MOOD_META: Record<string, { label: string; color: string; score: number; bg: string; border: string }> = {
  grateful: { label: 'Grateful', color: '#10b981', score: 90, bg: 'bg-emerald-950/60', border: 'border-emerald-800' },
  energized: { label: 'Energized', color: '#f59e0b', score: 85, bg: 'bg-amber-950/60', border: 'border-amber-800' },
  peaceful: { label: 'Peaceful', color: '#06b6d4', score: 80, bg: 'bg-cyan-950/60', border: 'border-cyan-800' },
  thoughtful: { label: 'Thoughtful', color: '#6366f1', score: 70, bg: 'bg-indigo-950/60', border: 'border-indigo-800' },
  neutral: { label: 'Neutral', color: '#64748b', score: 50, bg: 'bg-slate-900', border: 'border-slate-800' },
  anxious: { label: 'Anxious', color: '#f43f5e', score: 30, bg: 'bg-rose-950/60', border: 'border-rose-800' },
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ entries }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('30days');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisReport, setSynthesisReport] = useState<TrendSynthesisResponse | null>(null);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter entries based on timeframe
  const filteredEntries = useMemo(() => {
    const now = new Date();
    return entries.filter((e) => {
      const entryDate = new Date(e.createdAt || e.updatedAt);
      if (isNaN(entryDate.getTime())) return true;
      const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
      if (timeframe === '7days') return diffDays <= 7;
      if (timeframe === '30days') return diffDays <= 30;
      return true;
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [entries, timeframe]);

  // Aggregate Metrics
  const totalEntries = filteredEntries.length;
  
  const totalWords = useMemo(() => {
    return filteredEntries.reduce((acc, e) => {
      const baseWords = (e.content || '').split(/\s+/).filter(Boolean).length;
      const dialogueWords = (e.messages || []).reduce((mAcc, m) => mAcc + (m.text || '').split(/\s+/).filter(Boolean).length, 0);
      return acc + baseWords + dialogueWords;
    }, 0);
  }, [filteredEntries]);

  const totalDialogues = useMemo(() => {
    return filteredEntries.reduce((acc, e) => acc + (e.messages || []).length, 0);
  }, [filteredEntries]);

  // Mood Distribution
  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      grateful: 0,
      energized: 0,
      peaceful: 0,
      thoughtful: 0,
      neutral: 0,
      anxious: 0,
    };
    filteredEntries.forEach((e) => {
      const mood = e.mood?.toLowerCase() || 'thoughtful';
      if (counts[mood] !== undefined) {
        counts[mood] += 1;
      } else {
        counts.thoughtful += 1;
      }
    });

    return Object.entries(counts)
      .map(([key, count]) => ({
        name: MOOD_META[key]?.label || key,
        moodKey: key,
        value: count,
        color: MOOD_META[key]?.color || '#6366f1',
      }))
      .filter((item) => item.value > 0);
  }, [filteredEntries]);

  // Top Mood
  const topMood = useMemo(() => {
    if (moodDistribution.length === 0) return { name: 'Thoughtful', moodKey: 'thoughtful', value: 0, color: '#6366f1' };
    return [...moodDistribution].sort((a, b) => b.value - a.value)[0];
  }, [moodDistribution]);

  // Timeline / Trajectory Data
  const trajectoryData = useMemo(() => {
    return filteredEntries.map((e) => {
      const d = new Date(e.createdAt);
      const mood = e.mood?.toLowerCase() || 'thoughtful';
      const score = MOOD_META[mood]?.score ?? 60;
      return {
        date: isNaN(d.getTime()) ? 'Entry' : d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        title: e.title || 'Untitled',
        score,
        mood: MOOD_META[mood]?.label || mood,
      };
    });
  }, [filteredEntries]);

  // Tag Frequency
  const tagFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      (e.tags || []).forEach((t) => {
        const clean = t.replace(/^#/, '').trim();
        if (clean) {
          counts[clean] = (counts[clean] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .map(([tag, count]) => ({
        tag: `#${tag}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredEntries]);

  // Day of week activity
  const dayOfWeekActivity = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    filteredEntries.forEach((e) => {
      const d = new Date(e.createdAt);
      if (!isNaN(d.getTime())) {
        counts[d.getDay()] += 1;
      }
    });

    return days.map((day, idx) => ({
      day,
      reflections: counts[idx],
    }));
  }, [filteredEntries]);

  // Trigger Trend Synthesis
  const handleGenerateReport = async () => {
    if (filteredEntries.length === 0) {
      setSynthesisError('Please write at least one journal reflection before generating an analytics synthesis.');
      return;
    }

    setIsSynthesizing(true);
    setSynthesisError(null);

    try {
      const payloadEntries = filteredEntries.map((e) => ({
        id: e.id,
        title: e.title,
        date: new Date(e.createdAt).toLocaleDateString(),
        mood: e.mood || 'Thoughtful',
        tags: e.tags || [],
        snippet: (e.content || '').slice(0, 300),
        dialogueCount: (e.messages || []).length,
      }));

      const report = await synthesizeJournalTrends({
        timeframe,
        entries: payloadEntries,
      });

      setSynthesisReport(report);
    } catch (err: any) {
      console.error('Synthesis failed:', err);
      setSynthesisError(err?.message || 'Unable to generate mindset synthesis. Please retry.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleCopyReport = () => {
    if (!synthesisReport) return;
    const text = `# Mindset & Cognitive Reflection Report (${timeframe})\n\n` +
      `## Overview\n${synthesisReport.synthesis}\n\n` +
      `## Key Themes\n${synthesisReport.keyThemes.map(t => `- ${t}`).join('\n')}\n\n` +
      `## Growth Highlights\n${synthesisReport.growthHighlights.map(g => `- ${g}`).join('\n')}\n\n` +
      `## Recommended Actions\n${synthesisReport.recommendations.map(r => `- ${r}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Mindset &amp; Emotional Analytics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Discover cognitive patterns, mood trajectories, and longitudinal insights from your reflections.
          </p>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl self-start sm:self-auto">
          {(['7days', '30days', 'all'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              id={`btn-timeframe-${tf}`}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeframe === tf
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tf === '7days' ? 'Last 7 Days' : tf === '30days' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Entries</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{totalEntries}</p>
          <p className="text-[11px] text-slate-500 mt-1">in selected timeframe</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Reflection Depth</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{totalWords.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">total words written</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">AI Inquiries</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{totalDialogues}</p>
          <p className="text-[11px] text-slate-500 mt-1">dialogue turns explored</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Dominant Mindset</span>
            <Smile className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-white truncate">{topMood.name}</p>
          <p className="text-[11px] text-slate-500 mt-1">{topMood.value} entries tagged</p>
        </div>
      </div>

      {/* Main Charts Section */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-800/60 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No Entries in This Timeframe</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Write or import reflections to populate interactive sentiment curves, mood breakdowns, and AI cognitive synthesis.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Emotional Trajectory Area Chart */}
          <div className="lg:col-span-2 p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Emotional Tone &amp; Valence Trajectory</span>
                </h3>
                <p className="text-xs text-slate-400">Progression of reflection mindset across entries</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    ticks={[30, 60, 90]}
                    tickFormatter={(val) => val >= 80 ? 'Elevated' : val >= 50 ? 'Steady' : 'Reflective'}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#020617', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }} 
                    formatter={(val: any, _name: any, item: any) => [
                      `${item.payload.mood} (${val} pts)`,
                      item.payload.title
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#818cf8" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mood Breakdown Donut Chart */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
                <Smile className="w-4 h-4 text-emerald-400" />
                <span>Mindset Breakdown</span>
              </h3>
              <p className="text-xs text-slate-400 mb-2">Proportion of emotional mindsets</p>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#020617', 
                        borderColor: '#1e293b', 
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mood Legends */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              {moodDistribution.map((m) => (
                <div key={m.name} className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                  <span className="truncate">{m.name}: <strong className="text-white">{m.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Analytics Row: Tags & Day of Week */}
      {filteredEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Tags Bar Chart */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <span>Top Recurring Reflection Themes</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Most frequent tags used across entries</p>

            {tagFrequency.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No tags assigned to entries in this timeframe.</p>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tagFrequency} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <YAxis type="category" dataKey="tag" stroke="#94a3b8" fontSize={11} width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#020617', 
                        borderColor: '#1e293b', 
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }} 
                    />
                    <Bar dataKey="count" fill="#818cf8" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Activity by Day of Week */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Reflection Habit Cadence</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Entry volume by day of week</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekActivity} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#020617', 
                      borderColor: '#1e293b', 
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#f8fafc'
                    }} 
                  />
                  <Bar dataKey="reflections" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* AI Cognitive Pattern & Synthesis Report Box */}
      <div className="p-6 bg-slate-900/95 border border-indigo-950 rounded-2xl shadow-xl relative overflow-hidden">
        {/* Decorative ambient background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-950 text-indigo-400 border border-indigo-800/80 rounded-xl shadow-xs">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">AI Mindset &amp; Pattern Synthesis</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Synthesize recurring psychological themes, cognitive shifts, and customized guidance from your journals.
            </p>
          </div>

          <button
            id="btn-generate-ai-synthesis"
            type="button"
            onClick={handleGenerateReport}
            disabled={isSynthesizing || filteredEntries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Cognitive Patterns...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Mindset Report</span>
              </>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {synthesisError && (
          <div className="mt-4 p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{synthesisError}</span>
          </div>
        )}

        {/* Report Output */}
        {synthesisReport ? (
          <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Top Bar with Dominant Mood and Copy button */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Dominant Psychological Tone:</span>
                <span className="font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60">
                  {synthesisReport.dominantMood}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Report'}</span>
              </button>
            </div>

            {/* Narrative Synthesis */}
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>Executive Reflection Summary</span>
              </h4>
              <div className="text-sm text-slate-300 leading-relaxed space-y-2">
                <ReactMarkdown>{synthesisReport.synthesis}</ReactMarkdown>
              </div>
            </div>

            {/* Themes & Growth Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Themes */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2.5">
                <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Identified Growth Themes</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {synthesisReport.keyThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-indigo-950/70 border border-indigo-800/60 rounded-lg"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* Growth Highlights */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2.5">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cognitive Breakthroughs</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {synthesisReport.growthHighlights.map((hl, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mindful Recommendations */}
            <div className="p-4 bg-slate-950/70 border border-indigo-900/50 rounded-xl space-y-2.5">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Mindful Focus Recommendations for Next Week</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {synthesisReport.recommendations.map((rec, i) => (
                  <div key={i} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed flex flex-col justify-between">
                    <span className="font-semibold text-indigo-400 mb-1">0{i + 1}</span>
                    <p>{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          !isSynthesizing && (
            <div className="mt-6 p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click <strong>"Generate Mindset Report"</strong> to receive an AI-powered cognitive analysis of your emotional trends, breakthrough moments, and personalized forward-looking recommendations.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
