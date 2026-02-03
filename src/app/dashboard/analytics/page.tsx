'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
    getProductivityOverview,
    getDailyFocusTrends,
    getCategoryDistribution,
    getPlannedVsActualFocus,
    getVitalityTrends,
    getWorkDynamics,
    ProductivityMetrics
} from '@/lib/supabase/analyticsService';
import {
    TrendingUp,
    Clock,
    CheckSquare,
    Zap,
    Activity,
    Heart,
    Brain,
    Target,
    Flame,
    BarChart3,
    PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DateRange = '7d' | '14d' | '30d';

export default function AnalyticsDashboard() {
    const { supabaseUser, loading: authLoading } = useAuth();
    const [dateRange, setDateRange] = useState<DateRange>('7d');
    const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
    const [trends, setTrends] = useState<{ date: string; minutes: number }[]>([]);
    const [distribution, setDistribution] = useState<{ name: string; minutes: number; color: string }[]>([]);
    const [plannedVsActual, setPlannedVsActual] = useState<{ plannedMins: number; actualMins: number }>({ plannedMins: 0, actualMins: 0 });
    const [vitalityTrends, setVitalityTrends] = useState<{ date: string; sleep: number; energy: number; mood: number }[]>([]);
    const [workDynamics, setWorkDynamics] = useState<{ date: string; flow: number; distraction: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;

    const loadAnalytics = useCallback(async () => {
        if (!supabaseUser) return;
        try {
            setLoading(true);
            const [m, t, d, pva, vt, wd] = await Promise.all([
                getProductivityOverview(supabaseUser.id, days),
                getDailyFocusTrends(supabaseUser.id, days),
                getCategoryDistribution(supabaseUser.id),
                getPlannedVsActualFocus(supabaseUser.id),
                getVitalityTrends(supabaseUser.id, days),
                getWorkDynamics(supabaseUser.id, days)
            ]);
            setMetrics(m);
            setTrends(t);
            setDistribution(d);
            setPlannedVsActual(pva);
            setVitalityTrends(vt);
            setWorkDynamics(wd);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser, days]);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-200 dark:border-neutral-800" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (!supabaseUser) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <Activity className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Authentication Required</h2>
                    <p className="text-neutral-500 mt-2">Please sign in to view your analytics.</p>
                </div>
            </div>
        );
    }

    const maxFocusMinutes = Math.max(...trends.map(t => t.minutes), 1);
    const totalDistributionMinutes = distribution.reduce((acc, d) => acc + d.minutes, 0);

    // Calculate real efficiency (% of focus time that's non-uncategorized)
    const categorizedMinutes = distribution.filter(d => d.name !== 'Uncategorized').reduce((acc, d) => acc + d.minutes, 0);
    const focusEfficiency = totalDistributionMinutes > 0 ? Math.round((categorizedMinutes / totalDistributionMinutes) * 100) : 0;

    // Focus alignment percentage
    const focusAlignment = plannedVsActual.plannedMins > 0
        ? Math.min(Math.round((plannedVsActual.actualMins / plannedVsActual.plannedMins) * 100), 150)
        : 0;

    // Average flow and distraction
    const avgFlow = workDynamics.length > 0
        ? (workDynamics.reduce((acc, w) => acc + w.flow, 0) / workDynamics.length).toFixed(1)
        : '–';
    const avgDistraction = workDynamics.length > 0
        ? (workDynamics.reduce((acc, w) => acc + w.distraction, 0) / workDynamics.length).toFixed(1)
        : '–';

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    return (
        <div className="min-h-screen">
            {/* Hero Header - Full Width */}
            <div className="p-4 md:p-8 pb-0">
                <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl">
                    {/* Background decorations - enhanced */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/30 to-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-emerald-500/20 to-cyan-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                    <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10 p-8 md:p-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            {/* Title Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm">
                                        <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600/70 dark:text-violet-400/70">System Intelligence</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                                    Performance Lab
                                </h1>
                                <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium max-w-md">
                                    Analyze your productivity patterns and optimize your workflow.
                                </p>
                            </div>

                            {/* Date Range Selector + Productivity Score */}
                            <div className="flex items-center gap-4">
                                {/* Date Range Pills */}
                                <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/50 dark:border-neutral-700/50">
                                    {(['7d', '14d', '30d'] as DateRange[]).map(range => (
                                        <button
                                            key={range}
                                            onClick={() => setDateRange(range)}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                                dateRange === range
                                                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg"
                                                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                                            )}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>

                                {/* Productivity Score */}
                                <div className="bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Score</div>
                                        <div className="text-3xl font-black text-violet-600 dark:text-violet-400">{metrics?.productivityScore || 0}</div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Contained Width */}
            <div className="p-4 md:p-8 pt-6 space-y-8 max-w-7xl mx-auto">

                {/* Primary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Clock} label="Focus Time" value={formatDuration(metrics?.totalFocusMinutes || 0)} color="text-violet-500" bgColor="bg-violet-100 dark:bg-violet-900/30" />
                    <StatCard icon={Flame} label="Sessions" value={metrics?.sessionCount || 0} color="text-orange-500" bgColor="bg-orange-100 dark:bg-orange-900/30" />
                    <StatCard icon={CheckSquare} label="Tasks Done" value={metrics?.tasksCompleted || 0} color="text-emerald-500" bgColor="bg-emerald-100 dark:bg-emerald-900/30" />
                    <StatCard icon={Zap} label="Avg Energy" value={metrics?.avgEnergy?.toFixed(1) || '–'} color="text-amber-500" bgColor="bg-amber-100 dark:bg-amber-900/30" />
                </div>

                {/* Main Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Focus Trends Chart - 2 cols */}
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                                    <TrendingUp className="w-5 h-5 text-violet-500" />
                                </div>
                                <h3 className="text-lg font-black text-neutral-900 dark:text-white">Focus Trends</h3>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Last {days} days</span>
                        </div>

                        {trends.length === 0 || trends.every(t => t.minutes === 0) ? (
                            <EmptyChart message="No focus sessions recorded yet" />
                        ) : (
                            <div className="h-48 flex items-end gap-2">
                                {trends.map((t) => (
                                    <div key={t.date} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="relative w-full">
                                            <div
                                                className="w-full rounded-xl bg-violet-500/20 dark:bg-violet-400/20 group-hover:bg-violet-500/40 transition-all"
                                                style={{ height: `${Math.max((t.minutes / maxFocusMinutes) * 160, 8)}px` }}
                                            >
                                                {t.minutes === maxFocusMinutes && (
                                                    <div className="absolute inset-0 bg-violet-500 dark:bg-violet-400 rounded-xl" />
                                                )}
                                            </div>
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                                                {t.minutes}m
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-bold text-neutral-400 uppercase">
                                            {new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Focus Distribution */}
                    <div className="bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                <PieChart className="w-5 h-5 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-black text-neutral-900 dark:text-white">By Project</h3>
                        </div>

                        {distribution.length === 0 ? (
                            <EmptyChart message="No project data yet" small />
                        ) : (
                            <div className="space-y-4">
                                {distribution.slice(0, 5).map((d) => (
                                    <div key={d.name} className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[150px]">{d.name}</span>
                                            <span className="text-[10px] font-black text-neutral-400">{d.minutes}m</span>
                                        </div>
                                        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${(d.minutes / (totalDistributionMinutes || 1)) * 100}%`,
                                                    backgroundColor: d.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Efficiency footer */}
                        <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Categorized</span>
                            <span className="text-lg font-black text-neutral-900 dark:text-white">{focusEfficiency}%</span>
                        </div>
                    </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Focus Alignment */}
                    <div className="bg-gradient-to-br from-violet-600 to-purple-600 p-6 md:p-8 rounded-[32px] text-white shadow-2xl shadow-violet-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-white/20">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black">Focus Alignment</h3>
                                    <p className="text-violet-200 text-sm">Planned vs Actual today</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-5xl font-black mb-4">{focusAlignment}%</div>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1.5 rounded-xl bg-white text-violet-600 font-black text-[10px] uppercase">
                                            Plan: {plannedVsActual.plannedMins}m
                                        </div>
                                        <div className="px-3 py-1.5 rounded-xl bg-white/20 font-black text-[10px] uppercase">
                                            Done: {plannedVsActual.actualMins}m
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-end gap-3 h-24">
                                    <div className="flex-1 bg-white/20 rounded-t-xl h-full relative">
                                        <div className="absolute bottom-0 w-full bg-white/40 rounded-t-xl" style={{ height: '100%' }} />
                                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-70">Plan</span>
                                    </div>
                                    <div className="flex-1 bg-white/20 rounded-t-xl h-full relative">
                                        <div
                                            className="absolute bottom-0 w-full bg-white rounded-t-xl shadow-lg"
                                            style={{ height: `${Math.min(focusAlignment, 100)}%` }}
                                        />
                                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-70">Done</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vitality Trends */}
                    <div className="bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                                    <Heart className="w-5 h-5 text-rose-500" />
                                </div>
                                <h3 className="text-lg font-black text-neutral-900 dark:text-white">Vitality</h3>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500/30" />
                                    <span className="text-[9px] font-bold text-neutral-400">Sleep</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span className="text-[9px] font-bold text-neutral-400">Energy</span>
                                </div>
                            </div>
                        </div>

                        {vitalityTrends.length === 0 ? (
                            <EmptyChart message="No vitality data logged yet" />
                        ) : (
                            <div className="h-36 flex items-end gap-1">
                                {vitalityTrends.map((vt, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                                        <div
                                            className="w-full bg-violet-500/20 rounded-lg"
                                            style={{ height: `${vt.sleep * 10}%` }}
                                        />
                                        <div
                                            className="w-full bg-amber-500 rounded-lg"
                                            style={{ height: `${vt.energy * 8}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Third Row - Work Dynamics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                    <Brain className="w-5 h-5 text-indigo-500" />
                                </div>
                                <h3 className="text-lg font-black text-neutral-900 dark:text-white">Work Quality</h3>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                    <span className="text-[9px] font-bold text-neutral-400">Flow</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                                    <span className="text-[9px] font-bold text-neutral-400">Distraction</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Chart */}
                            {workDynamics.length === 0 ? (
                                <EmptyChart message="No work quality data yet" />
                            ) : (
                                <div className="h-40 flex items-end gap-1">
                                    {workDynamics.map((wd, i) => (
                                        <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                                            <div
                                                className="w-full bg-indigo-500 rounded-lg shadow-indigo-500/20"
                                                style={{ height: `${wd.flow * 18}%` }}
                                            />
                                            <div
                                                className="w-full bg-amber-500/30 rounded-lg"
                                                style={{ height: `${wd.distraction * 18}%` }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Stats */}
                            <div className="space-y-4 flex flex-col justify-center">
                                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-indigo-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Avg Flow</span>
                                    </div>
                                    <div className="text-3xl font-black text-neutral-900 dark:text-white">
                                        {avgFlow} <span className="text-sm font-bold text-neutral-400">/ 5</span>
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-amber-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Avg Distractions</span>
                                    </div>
                                    <div className="text-3xl font-black text-neutral-900 dark:text-white">
                                        {avgDistraction}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Card */}
                    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 md:p-8 rounded-[32px] text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />

                        <div className="relative z-10 space-y-6">
                            <div className="p-3 rounded-2xl bg-white/10 w-fit">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black mb-2">Quick Stats</h3>
                                <p className="text-neutral-400 text-sm">Your {days}-day performance summary</p>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Daily avg focus</span>
                                    <span className="font-black">{formatDuration(Math.round((metrics?.totalFocusMinutes || 0) / days))}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Mood average</span>
                                    <span className="font-black">{metrics?.avgMood?.toFixed(1) || '–'} / 10</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-neutral-400">Best focus day</span>
                                    <span className="font-black">
                                        {trends.length > 0
                                            ? new Date(trends.reduce((a, b) => a.minutes > b.minutes ? a : b).date).toLocaleDateString('en-US', { weekday: 'short' })
                                            : '–'
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, bgColor }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    bgColor: string;
}) {
    return (
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg hover:shadow-xl transition-shadow">
            <div className={cn("p-2.5 rounded-xl w-fit mb-3", bgColor)}>
                <Icon className={cn("w-5 h-5", color)} />
            </div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white">{value}</p>
            <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mt-1">{label}</p>
        </div>
    );
}

// Empty Chart Component
function EmptyChart({ message, small = false }: { message: string; small?: boolean }) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center text-center",
            small ? "py-8" : "py-12"
        )}>
            <div className={cn(
                "rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3",
                small ? "w-12 h-12" : "w-16 h-16"
            )}>
                <BarChart3 className={cn("text-neutral-400", small ? "w-6 h-6" : "w-8 h-8")} />
            </div>
            <p className="text-sm text-neutral-400 font-medium">{message}</p>
        </div>
    );
}
