'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
    getReadingItems,
    getCurrentlyReading,
    getReadingStats,
    getReadingTrends,
    getAllHighlights,
    addReadingItem,
    updateReadingProgress,
    deleteReadingItem,
    addHighlight,
    deleteHighlight,
    logReadingSession,
    type ReadingStats as ReadingStatsType,
    type Highlight
} from '@/lib/supabase/readingService';
import { createSession } from '@/lib/supabase/sessionService';
import type { ReadingItem } from '@/types/database';
import {
    BookOpen,
    Plus,
    TrendingUp,
    Trash2,
    Play,
    Quote,
    Flame,
    X,
    Check,
    Library,
    Bookmark,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface ReadingTrend {
    date: string;
    pages: number;
    minutes: number;
}

interface HighlightWithTitle extends Highlight {
    reading_item: { title: string };
}

// Animation keyframes (pre-generated)

export default function ReadingPage() {
    const { supabaseUser, loading: authLoading } = useAuth();
    const [items, setItems] = useState<ReadingItem[]>([]);
    const [currentlyReading, setCurrentlyReading] = useState<ReadingItem | null>(null);
    const [stats, setStats] = useState<ReadingStatsType | null>(null);
    const [trends, setTrends] = useState<ReadingTrend[]>([]);
    const [highlights, setHighlights] = useState<HighlightWithTitle[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHighlightModal, setShowHighlightModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ReadingItem | null>(null);
    const [activePanel, setActivePanel] = useState<'queue' | 'completed' | 'highlights'>('queue');
    const [searchQuery, setSearchQuery] = useState('');

    // Refs for keyboard navigation
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const loadData = useCallback(async () => {
        if (!supabaseUser) return;
        try {
            setLoading(true);
            const [itemsData, currentData, statsData, trendsData, highlightsData] = await Promise.all([
                getReadingItems(supabaseUser.id),
                getCurrentlyReading(supabaseUser.id),
                getReadingStats(supabaseUser.id),
                getReadingTrends(supabaseUser.id, 14),
                getAllHighlights(supabaseUser.id)
            ]);
            setItems(itemsData);
            setCurrentlyReading(currentData);
            setStats(statsData);
            setTrends(trendsData);
            setHighlights(highlightsData);
        } catch (error) {
            console.error('Error loading reading data:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ⌘+K or Ctrl+K to open add modal
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowAddModal(true);
            }
            // Escape to close modals
            if (e.key === 'Escape') {
                setShowAddModal(false);
                setShowHighlightModal(false);
                setSelectedItem(null);
            }
            // / to focus search
            if (e.key === '/' && !showAddModal && !showHighlightModal) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            // 1, 2, 3 to switch panels
            if (!showAddModal && !showHighlightModal) {
                if (e.key === '1') setActivePanel('queue');
                if (e.key === '2') setActivePanel('completed');
                if (e.key === '3') setActivePanel('highlights');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAddModal, showHighlightModal]);

    const handleAddItem = async (itemData: Partial<ReadingItem>) => {
        if (!supabaseUser) return;
        try {
            await addReadingItem({
                user_id: supabaseUser.id,
                title: itemData.title || '',
                author: itemData.author || null,
                status: itemData.status || 'to_read',
                item_type: itemData.item_type || 'book',
                total_pages: itemData.total_pages || null,
                cover_url: itemData.cover_url || null,
                progress_pages: 0,
                rating: null,
                aha_moment: null,
                notes: null,
                started_at: itemData.status === 'reading' ? new Date().toISOString() : null,
                completed_at: null,
                tags: [],
                link: itemData.link || null
            });
            setShowAddModal(false);
            await loadData();
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const handleUpdateProgress = async (itemId: string, newPage: number) => {
        try {
            await updateReadingProgress(itemId, newPage);
            await loadData();
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const handleStartReading = async (item: ReadingItem) => {
        if (!supabaseUser) return;
        try {
            // Log a reading session
            await logReadingSession(supabaseUser.id, item.id, 30, 5); // 30 min, 5 pages default
            
            // Also create a focus session
            await createSession(
                supabaseUser.id,
                'deep_work',
                30,
                new Date().toISOString()
            );
            
            await loadData();
        } catch (error) {
            console.error('Error starting reading session:', error);
        }
    };

    const handleAddHighlight = async (itemId: string, content: string, pageNumber: number | null) => {
        if (!supabaseUser) return;
        try {
            await addHighlight(supabaseUser.id, itemId, content, pageNumber);
            setShowHighlightModal(false);
            await loadData();
        } catch (error) {
            console.error('Error adding highlight:', error);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Delete this item?')) return;
        try {
            await deleteReadingItem(itemId);
            await loadData();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const filteredItems = items.filter(item => {
        const query = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(query) || 
               (item.author && item.author.toLowerCase().includes(query));
    });

    const queueItems = filteredItems.filter(i => i.status === 'to_read');
    const completedItems = filteredItems.filter(i => i.status === 'completed');

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-200 dark:border-neutral-800" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-amber-500 animate-spin" />
                </div>
            </div>
        );
    }

    if (!supabaseUser) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <BookOpen className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-neutral-900 dark:text-white">Authentication Required</h2>
                    <p className="text-neutral-500 mt-2">Please sign in to track your reading.</p>
                </div>
            </div>
        );
    }

    const maxPages = Math.max(...trends.map(t => t.pages), 1);
    const maxMinutes = Math.max(...trends.map(t => t.minutes), 1);

    return (
        <div className="min-h-screen">
            {/* Hero Header */}
            <div className="p-4 md:p-8 pb-0">
                <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-amber-500/30 to-orange-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-yellow-500/20 to-amber-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                    <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10 p-8 md:p-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            {/* Title Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm">
                                        <Library className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600/70 dark:text-amber-400/70">Reading Command</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                                    Reading Dashboard
                                </h1>
                                <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium max-w-md">
                                    Track your reading journey. Build knowledge, one page at a time.
                                </p>
                            </div>

                            {/* Stats Cards */}
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Streak */}
                                <div className={cn(
                                    "bg-white dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl flex items-center gap-4",
                                    (stats?.currentStreak || 0) > 0 && "ring-2 ring-amber-500/30"
                                )}>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Day Streak</div>
                                        <div className="text-3xl font-black text-amber-500 tabular-nums">{stats?.currentStreak || 0}</div>
                                    </div>
                                    <div className={cn(
                                        "w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center",
                                        (stats?.currentStreak || 0) > 0 && "animate-pulse"
                                    )}>
                                        <Flame className="w-6 h-6 text-amber-500" />
                                    </div>
                                </div>

                                {/* Weekly Pages */}
                                <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-5 rounded-3xl shadow-xl shadow-amber-500/20 flex items-center gap-4 text-white">
                                    <div className="text-right">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-amber-200">This Week</div>
                                        <div className="text-3xl font-black tabular-nums">{stats?.weeklyPagesRead || 0}</div>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-8 pt-6 space-y-6 max-w-7xl mx-auto">
                {/* Search & Quick Add Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search your library... (Press /)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                        />
                    </div>
                    <button
                        ref={addButtonRef}
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Add Book
                        <span className="text-[10px] opacity-60 ml-1">⌘K</span>
                    </button>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Currently Reading */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Currently Reading Card */}
                        {currentlyReading ? (
                            <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 dark:from-amber-900/20 dark:to-orange-900/10 p-6 md:p-8 rounded-[32px] border border-amber-200/50 dark:border-amber-800/30 shadow-xl relative overflow-hidden">
                                {/* Ambient glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600/70 dark:text-amber-400/70">Currently Reading</span>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-6">
                                        {/* Cover */}
                                        <div className="shrink-0 w-32 h-44 rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-inner overflow-hidden flex items-center justify-center">
                                            {currentlyReading.cover_url ? (
                                                <img src={currentlyReading.cover_url} alt={currentlyReading.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-700" />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-1">{currentlyReading.title}</h2>
                                                <p className="text-neutral-500 dark:text-neutral-400">{currentlyReading.author || 'Unknown Author'}</p>
                                            </div>

                                            {/* Progress */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span className="text-neutral-600 dark:text-neutral-300">Progress</span>
                                                    <span className="text-neutral-900 dark:text-white tabular-nums">
                                                        {currentlyReading.progress_pages} / {currentlyReading.total_pages || '?'} pages
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(100, ((currentlyReading.progress_pages || 0) / (currentlyReading.total_pages || 100)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    onClick={() => handleStartReading(currentlyReading)}
                                                    className="flex-1 py-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                >
                                                    <Play className="w-4 h-4 fill-current" />
                                                    Start Reading Session
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(currentlyReading);
                                                        setShowHighlightModal(true);
                                                    }}
                                                    className="px-4 py-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                >
                                                    <Quote className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-neutral-900 p-8 md:p-12 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl text-center">
                                <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                                    <BookOpen className="w-10 h-10 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">Not Reading Anything</h3>
                                <p className="text-neutral-500 mb-6">Start a book from your queue to track your progress.</p>
                                <button
                                    onClick={() => setActivePanel('queue')}
                                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all hover:scale-105 active:scale-95"
                                >
                                    View Queue
                                </button>
                            </div>
                        )}

                        {/* Reading Trends */}
                        <div className="bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                        <TrendingUp className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <h3 className="text-lg font-black text-neutral-900 dark:text-white">Reading Trends</h3>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Last 14 days</span>
                            </div>

                            {trends.length === 0 || trends.every(t => t.pages === 0) ? (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                                        <TrendingUp className="w-8 h-8 text-neutral-400" />
                                    </div>
                                    <p className="text-sm text-neutral-500">No reading data yet. Start reading to see trends.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Pages Chart */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Pages Read</span>
                                        </div>
                                        <div className="h-24 flex items-end gap-1">
                                            {trends.map((t) => (
                                                <div key={t.date} className="flex-1 flex flex-col items-center gap-1 group">
                                                    <div className="relative w-full">
                                                        <div
                                                            className="w-full rounded-lg bg-amber-500/20 group-hover:bg-amber-500/40 transition-all"
                                                            style={{ height: `${Math.max((t.pages / maxPages) * 80, 4)}px` }}
                                                        />
                                                        {t.pages === maxPages && maxPages > 0 && (
                                                            <div className="absolute inset-0 bg-amber-500 rounded-lg" />
                                                        )}
                                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                                                            {t.pages}p
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-neutral-400 uppercase">
                                                        {new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Minutes Chart */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Minutes Spent</span>
                                        </div>
                                        <div className="h-16 flex items-end gap-1">
                                            {trends.map((t) => (
                                                <div key={`min-${t.date}`} className="flex-1 flex flex-col items-center gap-1 group">
                                                    <div className="relative w-full">
                                                        <div
                                                            className="w-full rounded-lg bg-orange-500/20 group-hover:bg-orange-500/40 transition-all"
                                                            style={{ height: `${Math.max((t.minutes / maxMinutes) * 50, 4)}px` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Panel Navigation & Content */}
                    <div className="space-y-6">
                        {/* Panel Tabs */}
                        <div className="flex p-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg">
                            {[
                                { key: 'queue', label: 'Queue', count: queueItems.length, shortcut: '1' },
                                { key: 'completed', label: 'Done', count: completedItems.length, shortcut: '2' },
                                { key: 'highlights', label: 'Notes', count: highlights.length, shortcut: '3' }
                            ].map(panel => (
                                <button
                                    key={panel.key}
                                    onClick={() => setActivePanel(panel.key as typeof activePanel)}
                                    className={cn(
                                        "flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                                        activePanel === panel.key
                                            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg"
                                            : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                                    )}
                                >
                                    {panel.label}
                                    <span className="text-[9px] opacity-60">({panel.count})</span>
                                </button>
                            ))}
                        </div>

                        {/* Panel Content */}
                        <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden min-h-[400px]">
                            {/* Queue Panel */}
                            {activePanel === 'queue' && (
                                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {queueItems.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                                                <Bookmark className="w-8 h-8 text-neutral-400" />
                                            </div>
                                            <p className="text-sm text-neutral-500">Your queue is empty</p>
                                        </div>
                                    ) : (
                                        queueItems.map((item, i) => (
                                            <div
                                                key={item.id}
                                                className="group p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer"
                                                style={{ animationDelay: `${i * 50}ms` }}
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setShowAddModal(true);
                                                }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="shrink-0 w-12 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                                        {item.cover_url ? (
                                                            <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <BookOpen className="w-6 h-6 m-2 text-neutral-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-neutral-900 dark:text-white truncate">{item.title}</h4>
                                                        <p className="text-xs text-neutral-500">{item.author || 'Unknown'}</p>
                                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-[9px] font-bold uppercase text-neutral-600 dark:text-neutral-400">
                                                            {item.item_type}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateProgress(item.id, 0);
                                                        }}
                                                        className="p-2 rounded-xl opacity-0 group-hover:opacity-100 bg-amber-100 dark:bg-amber-900/30 text-amber-600 transition-all"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Completed Panel */}
                            {activePanel === 'completed' && (
                                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {completedItems.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                                                <Check className="w-8 h-8 text-neutral-400" />
                                            </div>
                                            <p className="text-sm text-neutral-500">No completed books yet</p>
                                        </div>
                                    ) : (
                                        completedItems.map((item, i) => (
                                            <div
                                                key={item.id}
                                                className="group p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 transition-all"
                                                style={{ animationDelay: `${i * 50}ms` }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="shrink-0 w-12 h-16 rounded-lg bg-emerald-100 dark:bg-emerald-800 overflow-hidden">
                                                        {item.cover_url ? (
                                                            <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Check className="w-6 h-6 m-2 text-emerald-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-neutral-900 dark:text-white truncate">{item.title}</h4>
                                                        <p className="text-xs text-neutral-500">{item.author || 'Unknown'}</p>
                                                        {item.rating && (
                                                            <div className="flex gap-0.5 mt-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg
                                                                        key={i}
                                                                        className={cn("w-3 h-3", i < item.rating! ? "text-amber-400 fill-amber-400" : "text-neutral-300")}
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                                                    </svg>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Highlights Panel */}
                            {activePanel === 'highlights' && (
                                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {highlights.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                                                <Quote className="w-8 h-8 text-neutral-400" />
                                            </div>
                                            <p className="text-sm text-neutral-500">No highlights yet</p>
                                            <p className="text-xs text-neutral-400 mt-1">Capture insights while reading</p>
                                        </div>
                                    ) : (
                                        highlights.map((highlight, i) => (
                                            <div
                                                key={highlight.id}
                                                className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 transition-all group"
                                                style={{ animationDelay: `${i * 50}ms` }}
                                            >
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-2">
                                                    &ldquo;{highlight.content}&rdquo;
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                            {highlight.reading_item?.title}
                                                        </span>
                                                        {highlight.page_number && (
                                                            <span className="text-[9px] text-neutral-400">
                                                                p.{highlight.page_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => deleteHighlight(highlight.id).then(loadData)}
                                                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg">
                                <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">Total Books</div>
                                <div className="text-2xl font-black text-neutral-900 dark:text-white">{stats?.totalItems || 0}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg">
                                <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">Completed</div>
                                <div className="text-2xl font-black text-emerald-600">{stats?.completed || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Book Modal */}
            {showAddModal && (
                <AddBookModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleAddItem}
                    initialData={selectedItem}
                />
            )}

            {/* Add Highlight Modal */}
            {showHighlightModal && selectedItem && (
                <AddHighlightModal
                    isOpen={showHighlightModal}
                    onClose={() => setShowHighlightModal(false)}
                    onSubmit={handleAddHighlight}
                    item={selectedItem}
                />
            )}

            {/* Keyboard Shortcuts Help */}
            <div className="fixed bottom-6 right-6 z-40">
                <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl opacity-50 hover:opacity-100 transition-opacity">
                    ⌘K Add • / Search • 1-3 Switch
                </div>
            </div>
        </div>
    );
}

// Add Book Modal Component
function AddBookModal({
    isOpen,
    onClose,
    onSubmit,
    initialData
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<ReadingItem>) => void;
    initialData: ReadingItem | null;
}) {
    const [formData, setFormData] = useState<Partial<ReadingItem>>({
        title: initialData?.title || '',
        author: initialData?.author || '',
        status: initialData?.status || 'to_read',
        item_type: initialData?.item_type || 'book',
        total_pages: initialData?.total_pages || undefined,
        cover_url: initialData?.cover_url || '',
        link: initialData?.link || ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        {initialData ? 'Edit Book' : 'Add New Book'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Title</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Atomic Habits"
                            className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Author</label>
                            <input
                                type="text"
                                placeholder="e.g. James Clear"
                                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                value={formData.author ?? ''}
                                onChange={e => setFormData({...formData, author: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Total Pages</label>
                            <input
                                type="number"
                                placeholder="320"
                                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                value={formData.total_pages ?? ''}
                                onChange={e => setFormData({...formData, total_pages: parseInt(e.target.value) || undefined})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value as 'to_read' | 'reading' | 'completed'})}
                            >
                                <option value="to_read">To Read</option>
                                <option value="reading">Reading</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Type</label>
                            <select
                                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                value={formData.item_type}
                                onChange={e => setFormData({...formData, item_type: e.target.value as 'book' | 'article' | 'paper' | 'course'})}
                            >
                                <option value="book">Book</option>
                                <option value="article">Article</option>
                                <option value="paper">Paper</option>
                                <option value="course">Course</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Link (Optional)</label>
                        <input
                            type="url"
                            placeholder="https://..."
                            className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            value={formData.link ?? ''}
                            onChange={e => setFormData({...formData, link: e.target.value})}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                        >
                            {initialData ? 'Update' : 'Add Book'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Add Highlight Modal Component
function AddHighlightModal({
    isOpen,
    onClose,
    onSubmit,
    item
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (itemId: string, content: string, pageNumber: number | null) => void;
    item: ReadingItem;
}) {
    const [content, setContent] = useState('');
    const [pageNumber, setPageNumber] = useState<number | ''>('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(item.id, content, pageNumber === '' ? null : pageNumber);
        setContent('');
        setPageNumber('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Add Highlight</h2>
                        <p className="text-sm text-neutral-500">{item.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Quote or Note</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="What resonated with you?"
                            className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Page Number (Optional)</label>
                        <input
                            type="number"
                            placeholder="42"
                            className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                            value={pageNumber === '' ? '' : pageNumber}
                            onChange={e => setPageNumber(e.target.value ? parseInt(e.target.value) : '')}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                        >
                            Save Highlight
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
