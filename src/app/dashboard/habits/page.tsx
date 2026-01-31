'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
    getHabitsWithStatus,
    getHabitStats,
    createHabit,
    completeHabit,
    deleteHabit,
    HabitWithStatus
} from '@/lib/supabase/habitService';
import {
    CheckSquare,
    Plus,
    Flame,
    Check,
    Trash2,
    Target,
    TrendingUp,
    Zap,
    X,
    Loader2,
    Sparkles,
    Trophy,
    Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Frequency = 'daily' | 'weekly' | 'custom';

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'custom', label: 'Custom' }
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MILESTONE_BADGES: Record<number, { icon: React.ElementType; label: string; color: string }> = {
    7: { icon: Sparkles, label: '1 Week!', color: 'from-blue-500 to-cyan-500' },
    14: { icon: Zap, label: '2 Weeks!', color: 'from-violet-500 to-purple-500' },
    30: { icon: Trophy, label: '1 Month!', color: 'from-amber-500 to-orange-500' },
    100: { icon: Crown, label: '100 Days!', color: 'from-rose-500 to-pink-500' },
};

const CONFETTI_COLORS = ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];

// Pre-generate confetti positions (generated once at module load)
const CONFETTI_PARTICLES = Array.from({ length: 50 }, () => ({
    left: Math.random() * 100,
    colorIndex: Math.floor(Math.random() * 6),
    duration: 2 + Math.random() * 2,
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
}));

// Confetti component
function Confetti({ show }: { show: boolean }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            {CONFETTI_PARTICLES.map((particle, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm animate-confetti-fall"
                    style={{
                        left: `${particle.left}%`,
                        top: '-10px',
                        backgroundColor: CONFETTI_COLORS[particle.colorIndex],
                        animationDuration: `${particle.duration}s`,
                        animationDelay: `${particle.delay}s`,
                        transform: `rotate(${particle.rotation}deg)`,
                    }}
                />
            ))}
            <style jsx>{`
                @keyframes confetti-fall {
                    0% { 
                        transform: translateY(0) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% { 
                        transform: translateY(100vh) rotate(720deg) scale(0);
                        opacity: 0;
                    }
                }
                .animate-confetti-fall {
                    animation: confetti-fall 2s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

export default function HabitsPage() {
    const { supabaseUser, loading: authLoading } = useAuth();
    const [habits, setHabits] = useState<HabitWithStatus[]>([]);
    const [stats, setStats] = useState({ totalHabits: 0, totalStreak: 0, longestStreak: 0, completedToday: 0 });
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<string | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [celebratingMilestone, setCelebratingMilestone] = useState<number | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newFrequency, setNewFrequency] = useState<Frequency>('daily');
    const [creating, setCreating] = useState(false);

    const loadData = useCallback(async () => {
        if (!supabaseUser) return;
        try {
            setLoading(true);
            const [habitsData, statsData] = await Promise.all([
                getHabitsWithStatus(supabaseUser.id),
                getHabitStats(supabaseUser.id)
            ]);
            setHabits(habitsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading habits:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabaseUser || !newName.trim()) return;

        try {
            setCreating(true);
            await createHabit({
                user_id: supabaseUser.id,
                name: newName.trim(),
                description: newDescription.trim() || null,
                frequency: newFrequency
            });
            setNewName('');
            setNewDescription('');
            setNewFrequency('daily');
            setShowForm(false);
            await loadData();
        } catch (error) {
            console.error('Error creating habit:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleComplete = async (habitId: string) => {
        if (!supabaseUser) return;

        try {
            setCompleting(habitId);
            const result = await completeHabit(habitId, supabaseUser.id);

            // Check for milestone celebration
            const newStreak = result.newStreak;
            if (MILESTONE_BADGES[newStreak]) {
                setCelebratingMilestone(newStreak);
                setTimeout(() => setCelebratingMilestone(null), 3000);
            }

            // Show confetti for any completion
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2500);

            await loadData();
        } catch (error) {
            console.error('Error completing habit:', error);
        } finally {
            setCompleting(null);
        }
    };

    const handleDelete = async (habitId: string) => {
        if (!confirm('Delete this habit? This action cannot be undone.')) return;

        try {
            await deleteHabit(habitId);
            await loadData();
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    };

    const todayIndex = new Date().getDay();
    const allCompletedToday = stats.totalHabits > 0 && stats.completedToday === stats.totalHabits;

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-200 dark:border-neutral-800" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (!supabaseUser) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <CheckSquare className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Authentication Required</h2>
                    <p className="text-neutral-500 mt-2">Please sign in to track your habits.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Confetti show={showConfetti} />

            {/* Milestone Celebration Overlay */}
            {celebratingMilestone && MILESTONE_BADGES[celebratingMilestone] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="text-center animate-bounce-in">
                        <div className={cn(
                            "w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6",
                            `bg-gradient-to-br ${MILESTONE_BADGES[celebratingMilestone].color}`
                        )}>
                            {(() => {
                                const Icon = MILESTONE_BADGES[celebratingMilestone].icon;
                                return <Icon className="w-16 h-16 text-white" />;
                            })()}
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2">
                            {MILESTONE_BADGES[celebratingMilestone].label}
                        </h2>
                        <p className="text-xl text-white/70">
                            🔥 {celebratingMilestone} Day Streak Achieved!
                        </p>
                    </div>
                </div>
            )}

            {/* Hero Header */}
            <div className="p-4 md:p-8 pb-0">
                <div className={cn(
                    "relative overflow-hidden rounded-[40px] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl transition-all duration-500",
                    allCompletedToday && "ring-2 ring-emerald-500/50 shadow-emerald-500/20"
                )}>
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-emerald-500/30 to-teal-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                    <div className={cn(
                        "absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-amber-500/20 to-orange-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 transition-all duration-1000",
                        stats.totalStreak > 7 && "opacity-100 animate-pulse-slow",
                        stats.totalStreak <= 7 && "opacity-50"
                    )} />
                    <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gradient-to-br from-violet-500/10 to-purple-500/5 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10 p-8 md:p-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            {/* Title Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm">
                                        <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600/70 dark:text-emerald-400/70">Habit Command</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                                    Habit Tracker
                                </h1>
                                <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium max-w-md">
                                    Build consistency through daily micro-wins. One streak at a time.
                                </p>
                            </div>

                            {/* Stats Cards */}
                            <div className="flex items-center gap-4">
                                {/* Streak Total */}
                                <div className={cn(
                                    "bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl flex items-center gap-4 transition-all",
                                    stats.totalStreak > 7 && "ring-2 ring-amber-500/30"
                                )}>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Total Streak</div>
                                        <div className="text-3xl font-black text-amber-500 tabular-nums">{stats.totalStreak}</div>
                                    </div>
                                    <div className={cn(
                                        "w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center",
                                        stats.totalStreak > 7 && "animate-wiggle"
                                    )}>
                                        <Flame className={cn(
                                            "w-6 h-6 text-amber-500",
                                            stats.totalStreak > 7 && "animate-flicker"
                                        )} />
                                    </div>
                                </div>

                                {/* Today's Progress */}
                                <div className={cn(
                                    "bg-gradient-to-br from-emerald-600 to-teal-600 p-5 rounded-3xl shadow-xl shadow-emerald-500/20 flex items-center gap-4 text-white transition-all",
                                    allCompletedToday && "animate-pulse-glow"
                                )}>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-emerald-200">Today</div>
                                        <div className="text-3xl font-black tabular-nums">{stats.completedToday}/{stats.totalHabits}</div>
                                    </div>
                                    <div className={cn(
                                        "w-12 h-12 rounded-full bg-white/20 flex items-center justify-center",
                                        allCompletedToday && "bg-white/30"
                                    )}>
                                        <Check className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-8 pt-6 space-y-6 max-w-7xl mx-auto">
                {/* Quick Add Section */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl">
                    {!showForm ? (
                        <button
                            onClick={() => setShowForm(true)}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all group hover:scale-[1.01]"
                        >
                            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors group-hover:scale-110">
                                <Plus className="w-5 h-5 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                            </div>
                            <span className="font-bold text-neutral-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                Add New Habit
                            </span>
                        </button>
                    ) : (
                        <form onSubmit={handleCreateHabit} className="space-y-4 animate-slide-up">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                    <Plus className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-black text-neutral-900 dark:text-white">New Habit</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="ml-auto p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors hover:rotate-90 duration-200"
                                    title="Close form"
                                >
                                    <X className="w-5 h-5 text-neutral-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="Habit name *"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    required
                                    autoFocus
                                />
                                <input
                                    type="text"
                                    placeholder="Description (optional)"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    className="px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                />
                                <div className="flex gap-2">
                                    <select
                                        value={newFrequency}
                                        onChange={(e) => setNewFrequency(e.target.value as Frequency)}
                                        title="Select habit frequency"
                                        className="flex-1 px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                    >
                                        {FREQUENCY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={creating || !newName.trim()}
                                        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 active:scale-95"
                                    >
                                        {creating ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5" />
                                                Add
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Habits Grid */}
                {habits.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-900 p-12 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6 animate-bounce-slow">
                            <CheckSquare className="w-10 h-10 text-neutral-400" />
                        </div>
                        <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">No Habits Yet</h3>
                        <p className="text-neutral-500 mb-6">Start building consistency by creating your first habit.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black transition-all inline-flex items-center gap-2 hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Create First Habit
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {habits.map((habit, index) => (
                            <HabitCard
                                key={habit.id}
                                habit={habit}
                                todayIndex={todayIndex}
                                completing={completing === habit.id}
                                onComplete={() => handleComplete(habit.id)}
                                onDelete={() => handleDelete(habit.id)}
                                animationDelay={index * 0.1}
                            />
                        ))}
                    </div>
                )}

                {/* Insights Card */}
                {habits.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-gradient-to-br from-neutral-900 to-neutral-800 p-8 rounded-[32px] text-white relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-xl bg-white/10">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-black">Weekly Overview</h3>
                                </div>

                                <div className="grid grid-cols-7 gap-2">
                                    {DAY_LABELS.map((day, i) => {
                                        const dayOffset = (todayIndex - i + 7) % 7;
                                        const completions = habits.filter(h => h.weeklyCompletions[dayOffset]).length;
                                        const percentage = habits.length > 0 ? (completions / habits.length) * 100 : 0;
                                        const isToday = i === todayIndex;

                                        return (
                                            <div key={i} className="flex flex-col items-center gap-2 group">
                                                <div
                                                    className={cn(
                                                        "w-full aspect-square rounded-2xl flex items-center justify-center text-lg font-black transition-all cursor-default",
                                                        percentage === 100
                                                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                                            : percentage > 0
                                                                ? "bg-emerald-500/30 text-emerald-300"
                                                                : "bg-white/10 text-neutral-500",
                                                        isToday && "ring-2 ring-white/50 scale-105",
                                                        "hover:scale-110"
                                                    )}
                                                >
                                                    {percentage === 100 ? (
                                                        <Check className="w-6 h-6" />
                                                    ) : percentage > 0 ? (
                                                        <span className="text-sm">{Math.round(percentage)}%</span>
                                                    ) : null}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase",
                                                    isToday ? "text-white" : "text-neutral-500"
                                                )}>
                                                    {day}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-black text-neutral-900 dark:text-white">Quick Stats</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:scale-[1.02] transition-transform">
                                    <span className="text-sm font-medium text-neutral-500">Total Habits</span>
                                    <span className="text-xl font-black text-neutral-900 dark:text-white tabular-nums">{stats.totalHabits}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:scale-[1.02] transition-transform">
                                    <span className="text-sm font-medium text-neutral-500">Longest Streak</span>
                                    <div className="flex items-center gap-2">
                                        <Flame className={cn(
                                            "w-5 h-5 text-amber-500",
                                            stats.longestStreak >= 7 && "animate-flicker"
                                        )} />
                                        <span className="text-xl font-black text-neutral-900 dark:text-white tabular-nums">{stats.longestStreak}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:scale-[1.02] transition-transform">
                                    <span className="text-sm font-medium text-neutral-500">Completion Rate</span>
                                    <span className={cn(
                                        "text-xl font-black tabular-nums",
                                        allCompletedToday ? "text-emerald-500" : "text-neutral-900 dark:text-white"
                                    )}>
                                        {stats.totalHabits > 0 ? Math.round((stats.completedToday / stats.totalHabits) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Global CSS */}
            <style jsx global>{`
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                }
                @keyframes flicker {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    25% { opacity: 0.8; transform: scale(0.95); }
                    50% { opacity: 1; transform: scale(1.05); }
                    75% { opacity: 0.9; transform: scale(0.98); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 25px 50px -12px rgb(16 185 129 / 0.25); }
                    50% { box-shadow: 0 25px 50px -12px rgb(16 185 129 / 0.4); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounce-in {
                    0% { opacity: 0; transform: scale(0.3); }
                    50% { transform: scale(1.1); }
                    70% { transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes card-appear {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-wiggle { animation: wiggle 0.5s ease-in-out infinite; }
                .animate-flicker { animation: flicker 1s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
                .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
                .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
                .animate-slide-up { animation: slide-up 0.3s ease-out; }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
                .animate-card-appear { animation: card-appear 0.4s ease-out backwards; }
            `}</style>
        </div>
    );
}

// Habit Card Component
function HabitCard({
    habit,
    todayIndex,
    completing,
    onComplete,
    onDelete,
    animationDelay
}: {
    habit: HabitWithStatus;
    todayIndex: number;
    completing: boolean;
    onComplete: () => void;
    onDelete: () => void;
    animationDelay: number;
}) {
    const currentMilestone = Object.entries(MILESTONE_BADGES)
        .reverse()
        .find(([threshold]) => habit.streak_count >= Number(threshold));

    return (
        <div
            className={cn(
                "group bg-white dark:bg-neutral-900 p-6 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl transition-all relative overflow-hidden animate-card-appear",
                "hover:shadow-2xl hover:-translate-y-1 hover:border-neutral-300 dark:hover:border-neutral-700",
                habit.completedToday && "ring-2 ring-emerald-500/20"
            )}
            style={{ animationDelay: `${animationDelay}s` }}
        >
            {/* Streak glow for high streaks */}
            {habit.streak_count >= 7 && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-[60px] animate-pulse-slow" />
            )}

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-neutral-900 dark:text-white truncate">{habit.name}</h3>
                            {currentMilestone && (
                                <div className={cn(
                                    "p-1 rounded-lg",
                                    `bg-gradient-to-br ${currentMilestone[1].color}`
                                )}>
                                    {(() => {
                                        const Icon = currentMilestone[1].icon;
                                        return <Icon className="w-3 h-3 text-white" />;
                                    })()}
                                </div>
                            )}
                        </div>
                        {habit.description && (
                            <p className="text-sm text-neutral-500 truncate">{habit.description}</p>
                        )}
                    </div>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-110 active:scale-95"
                        title="Delete habit"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>

                {/* Streak & Frequency */}
                <div className="flex items-center gap-3 mb-5">
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 transition-all",
                        habit.streak_count >= 7 && "ring-2 ring-amber-500/30"
                    )}>
                        <Flame className={cn(
                            "w-4 h-4 text-amber-500",
                            habit.streak_count >= 7 && "animate-flicker"
                        )} />
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">{habit.streak_count}</span>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                        {habit.frequency}
                    </span>
                </div>

                {/* Weekly Calendar */}
                <div className="flex justify-between mb-5">
                    {DAY_LABELS.map((day, i) => {
                        const dayOffset = (todayIndex - i + 7) % 7;
                        const completed = habit.weeklyCompletions[dayOffset];
                        const isToday = i === todayIndex;

                        return (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                        completed
                                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                                            : isToday
                                                ? "bg-neutral-200 dark:bg-neutral-700"
                                                : "bg-neutral-100 dark:bg-neutral-800",
                                        isToday && !completed && "ring-2 ring-emerald-500/50 animate-pulse"
                                    )}
                                >
                                    {completed && <Check className="w-4 h-4" />}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-bold uppercase",
                                    isToday ? "text-emerald-500" : "text-neutral-400"
                                )}>
                                    {day}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Complete Button */}
                <button
                    onClick={onComplete}
                    disabled={completing || habit.completedToday}
                    className={cn(
                        "w-full py-3 px-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2",
                        habit.completedToday
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-default"
                            : "bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                    )}
                >
                    {completing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : habit.completedToday ? (
                        <>
                            <Check className="w-5 h-5" />
                            Completed Today!
                        </>
                    ) : (
                        <>
                            <Check className="w-5 h-5" />
                            Complete
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
