'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus, Settings, Save, ChevronDown, X, Trash2,
    Briefcase, Zap, Heart, User, BookOpen, Moon, Utensils, Car, Circle,
    Clock
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';
import {
    getTimeBudgets,
    saveTimeBudget,
    updateTimeBudget,
    deleteTimeBudget,
    getUserPreferences,
    saveUserPreferences,
    CATEGORY_CONFIG,
    timeToMinutes,
    checkOverlap,
} from '@/lib/supabase/timeBudgetService';
import type { TimeAllocation, TimeCategory } from '@/types/database';
import { getActiveProjects } from '@/lib/supabase/projectService';
import type { Project } from '@/types/database';

const CATEGORY_ICONS: Record<TimeCategory, React.ElementType> = {
    work: Briefcase,
    deep_work: Zap,
    health: Heart,
    personal: User,
    learning: BookOpen,
    admin: Settings,
    sleep: Moon,
    meals: Utensils,
    commute: Car,
    other: Circle,
};

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as TimeCategory[];

const CATEGORY_BG_CLASSES: Record<TimeCategory, string> = {
    work: 'bg-[#3b82f6]',
    deep_work: 'bg-[#6366f1]',
    health: 'bg-[#22c55e]',
    personal: 'bg-[#f59e0b]',
    learning: 'bg-[#8b5cf6]',
    admin: 'bg-[#64748b]',
    sleep: 'bg-[#1e293b]',
    meals: 'bg-[#f97316]',
    commute: 'bg-[#06b6d4]',
    other: 'bg-[#94a3b8]',
};

export function TimeBudgetTimeline() {
    const { supabaseUser } = useAuth();
    const [allocations, setAllocations] = useState<TimeAllocation[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Day bounds
    const [dayStart, setDayStart] = useState('06:00');
    const [dayEnd, setDayEnd] = useState('23:00');

    // Modals
    const [isAdding, setIsAdding] = useState(false);
    const [editingBlock, setEditingBlock] = useState<TimeAllocation | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        label: '',
        category: 'work' as TimeCategory,
        projectId: '',
        startTime: '09:00',
        endTime: '10:00',
    });

    const loadData = useCallback(async () => {
        if (!supabaseUser) return;
        try {
            const [allocs, projs, prefs] = await Promise.all([
                getTimeBudgets(supabaseUser.id),
                getActiveProjects(supabaseUser.id),
                getUserPreferences(supabaseUser.id),
            ]);
            setAllocations(allocs);
            setProjects(projs);
            if (prefs) {
                setDayStart(prefs.day_start_time);
                setDayEnd(prefs.day_end_time);
            }
        } catch (error) {
            console.error('Error loading time budget:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser]);

    useEffect(() => {
        if (supabaseUser) loadData();
    }, [supabaseUser, loadData]);

    // Calculate day bounds in minutes
    const dayStartMins = timeToMinutes(dayStart);
    const dayEndMins = timeToMinutes(dayEnd);
    const totalDayMins = dayEndMins - dayStartMins;

    // Sum of allocated time
    const allocatedMins = allocations.reduce((sum, a) => sum + a.duration_minutes, 0);
    const remainingMins = Math.max(0, totalDayMins - allocatedMins);

    const handleSaveSettings = async () => {
        if (!supabaseUser) return;
        try {
            await saveUserPreferences(supabaseUser.id, dayStart, dayEnd);
            setShowSettings(false);
            loadData();
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const handleAddBlock = async () => {
        if (!supabaseUser) return;

        if (checkOverlap(allocations, formData.startTime, formData.endTime)) {
            alert('This time slot overlaps with an existing block!');
            return;
        }

        try {
            await saveTimeBudget(supabaseUser.id, {
                label: formData.label || null,
                category: formData.category,
                projectId: formData.projectId || null,
                startTime: formData.startTime,
                endTime: formData.endTime,
            });

            setIsAdding(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error adding block:', error);
        }
    };

    const handleUpdateBlock = async () => {
        if (!editingBlock) return;

        if (checkOverlap(allocations, formData.startTime, formData.endTime, editingBlock.id)) {
            alert('This time slot overlaps with an existing block!');
            return;
        }

        try {
            await updateTimeBudget(editingBlock.id, {
                label: formData.label || null,
                category: formData.category,
                projectId: formData.projectId || null,
                startTime: formData.startTime,
                endTime: formData.endTime,
            });

            setEditingBlock(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Error updating block:', error);
        }
    };

    const handleDeleteBlock = async (id: string) => {
        try {
            await deleteTimeBudget(id);
            setAllocations(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error('Error deleting block:', error);
        }
    };

    const openEditModal = (block: TimeAllocation) => {
        setFormData({
            label: block.label || '',
            category: block.category || 'work',
            projectId: block.project_id || '',
            startTime: block.start_time || '09:00',
            endTime: block.end_time || '10:00',
        });
        setEditingBlock(block);
    };

    const resetForm = () => {
        setFormData({
            label: '',
            category: 'work',
            projectId: '',
            startTime: '09:00',
            endTime: '10:00',
        });
    };

    const formatTime = (time: string | null | undefined) => {
        if (!time) return '';
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}${m > 0 ? `:${m.toString().padStart(2, '0')}` : ''} ${ampm}`;
    };

    // Current time state
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // 1 min update
        return () => clearInterval(timer);
    }, []);

    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const currentLeft = ((currentMins - dayStartMins) / totalDayMins) * 100;
    const isCurrentTimeVisible = currentLeft >= 0 && currentLeft <= 100;

    const getBlockStyle = (block: TimeAllocation) => {
        if (!block.start_time || !block.end_time) return {};

        const startMins = timeToMinutes(block.start_time);
        const endMins = timeToMinutes(block.end_time);

        // Clamped relative positions
        const relativeStart = Math.max(dayStartMins, startMins);
        const relativeEnd = Math.min(dayEndMins, endMins);

        // If block is completely outside view
        if (endMins <= dayStartMins || startMins >= dayEndMins) return { display: 'none' };

        const left = ((relativeStart - dayStartMins) / totalDayMins) * 100;
        const width = ((relativeEnd - relativeStart) / totalDayMins) * 100;

        const config = CATEGORY_CONFIG[block.category || 'other'];

        return {
            left: `${left}%`,
            width: `${width}%`,
            backgroundColor: config.color,
        };
    };

    const hourMarkers = [];
    for (let mins = dayStartMins; mins <= dayEndMins; mins += 60) {
        // Adjust grid to be cleaner
        const left = ((mins - dayStartMins) / totalDayMins) * 100;
        if (left < 0 || left > 100) continue;

        const hour = Math.floor(mins / 60);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        hourMarkers.push({ left, label: `${displayHour}${ampm}` });
    }

    if (loading) {
        return (
            <div className="card p-12 flex items-center justify-center bg-white/40 dark:bg-neutral-800/40 backdrop-blur-sm">
                <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <>
            <div className="card p-6 backdrop-blur-sm bg-white/40 dark:bg-neutral-800/40 border border-white/20 dark:border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
                            Today&apos;s Rhythm
                        </h3>
                        <p className="text-sm text-neutral-500 mt-1">
                            <span className="font-semibold text-neutral-900 dark:text-white">{Math.floor(allocatedMins / 60)}h {allocatedMins % 60}m</span> planned
                            <span className="mx-2 text-neutral-300 dark:text-neutral-600">•</span>
                            <span className="font-semibold text-primary-600">{Math.floor(remainingMins / 60)}h {remainingMins % 60}m</span> buffer
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2.5 rounded-xl bg-neutral-100/50 dark:bg-neutral-700/50 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-200"
                            title="Day Settings"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => { resetForm(); setIsAdding(true); }}
                            className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-neutral-200 dark:shadow-black/20"
                        >
                            <Plus className="h-4 w-4" />
                            Plan Day
                        </button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative pt-6 pb-2">
                    {/* Hour Markers */}
                    <div className="absolute top-0 left-0 w-full flex pointer-events-none h-full">
                        {hourMarkers.map((marker, i) => (
                            <div
                                key={i}
                                className="absolute h-full border-l border-neutral-100 dark:border-neutral-700 flex flex-col items-center left-[var(--marker-left)]"
                                style={{ '--marker-left': `${marker.left}%` } as React.CSSProperties}
                            >
                                <span className="text-[10px] font-bold text-neutral-300 dark:text-neutral-600 -translate-y-6">
                                    {marker.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Timeline Bar */}
                    <div className="h-20 w-full bg-neutral-50/50 dark:bg-neutral-700/50 rounded-2xl overflow-hidden relative border border-neutral-100 dark:border-neutral-600 shadow-inner group/timeline">
                        {/* Current Time Indicator */}
                        {isCurrentTimeVisible && (
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.6)] left-[var(--current-left)]"
                                style={{ '--current-left': `${currentLeft}%` } as React.CSSProperties}
                            >
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                            </div>
                        )}

                        {allocations
                            .filter(block => block.start_time && block.end_time)
                            .map((block) => {
                                const style = getBlockStyle(block);
                                const config = CATEGORY_CONFIG[block.category || 'other'];
                                const Icon = CATEGORY_ICONS[block.category || 'other'];

                                return (
                                    <div
                                        key={block.id}
                                        className={cn(
                                            "absolute top-0 h-full flex flex-col items-center justify-center group cursor-pointer transition-all duration-300 hover:brightness-105 hover:z-10 shadow-[inset_0_1px_rgba(255,255,255,0.2)]",
                                            "left-[var(--block-left)] w-[var(--block-width)]",
                                            CATEGORY_BG_CLASSES[block.category || 'other']
                                        )}
                                        style={{
                                            '--block-left': style.left,
                                            '--block-width': style.width
                                        } as React.CSSProperties}
                                        onClick={() => openEditModal(block)}
                                    >
                                        {/* Tooltip */}
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 bg-neutral-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl whitespace-nowrap z-30 transition-all duration-200 translate-y-2 group-hover:translate-y-0 shadow-xl border border-white/10">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Icon className="h-3 w-3" />
                                                <span className="text-[10px] font-bold tracking-wider uppercase opacity-60">
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="font-bold text-sm">{block.label || config.label}</div>
                                            <div className="text-[10px] font-medium text-white/50 mt-1">
                                                {formatTime(block.start_time)} - {formatTime(block.end_time)}
                                            </div>
                                            {/* Tooltip Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-neutral-900/90" />
                                        </div>

                                        <Icon className="h-4 w-4 text-white/80 mb-1" />
                                        <span className="text-white text-[10px] font-bold truncate w-full px-3 text-center opacity-90 tracking-tight">
                                            {block.label || config.label}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-8 flex flex-wrap gap-5">
                    {CATEGORIES.slice(0, 8).map((cat) => {
                        const config = CATEGORY_CONFIG[cat];
                        return (
                            <div key={cat} className="flex items-center gap-2 group cursor-default">
                                <div
                                    className={cn(
                                        "w-2.5 h-2.5 rounded-full shadow-sm transition-transform group-hover:scale-125",
                                        CATEGORY_BG_CLASSES[cat]
                                    )}
                                />
                                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider group-hover:text-neutral-900 transition-colors">
                                    {config.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            {(isAdding || editingBlock) && (
                <div className="fixed inset-0 flex items-center justify-center z-[1000] px-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md animate-fade-in"
                        onClick={() => { setIsAdding(false); setEditingBlock(null); }}
                    />

                    {/* Modal Content */}
                    <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 dark:border-white/10 max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in relative z-10 custom-scrollbar">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                                        {editingBlock ? 'Refine Slot' : 'New Time Slot'}
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Design your daily flow</p>
                                </div>
                                <button
                                    onClick={() => { setIsAdding(false); setEditingBlock(null); }}
                                    className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all"
                                    aria-label="Close"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Category Grid */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block mb-3 pl-1">
                                        Vibe & Category
                                    </label>
                                    <div className="grid grid-cols-5 gap-2.5">
                                        {CATEGORIES.map((cat) => {
                                            const Icon = CATEGORY_ICONS[cat];
                                            const isActive = formData.category === cat;
                                            return (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, category: cat })}
                                                    aria-label={`Select ${CATEGORY_CONFIG[cat].label} category`}
                                                    className={cn(
                                                        'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 border',
                                                        isActive
                                                            ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white shadow-lg shadow-neutral-200 dark:shadow-black/20 scale-105'
                                                            : 'bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 hover:border-neutral-200 dark:hover:border-neutral-600'
                                                    )}
                                                >
                                                    <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-neutral-400")} />
                                                    <span className={cn("text-[9px] font-black tracking-tight", isActive ? "text-white" : "text-neutral-500")}>
                                                        {CATEGORY_CONFIG[cat].label.split(' ')[0]}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Label Input */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest block pl-1">
                                        What&apos;s the focus?
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.label}
                                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                        placeholder="Add a custom name..."
                                        className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/5 focus:border-neutral-900 dark:focus:border-white transition-all font-medium text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
                                    />
                                </div>

                                {/* Time Picker */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="start-time" className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block pl-1">
                                            Begins
                                        </label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                                            <input
                                                id="start-time"
                                                type="time"
                                                title="Start time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                className="w-full pl-11 pr-4 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/5 focus:border-neutral-900 dark:focus:border-white transition-all font-bold text-neutral-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="end-time" className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block pl-1">
                                            Ends
                                        </label>
                                        <div className="relative group">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                                            <input
                                                id="end-time"
                                                type="time"
                                                title="End time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                className="w-full pl-11 pr-4 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/5 focus:border-neutral-900 dark:focus:border-white transition-all font-bold text-neutral-900 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Project Link */}
                                {projects.length > 0 && (
                                    <div className="space-y-2">
                                        <label htmlFor="project-select" className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block pl-1">
                                            Attach Project
                                        </label>
                                        <div className="relative group">
                                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                            <select
                                                id="project-select"
                                                title="Select project"
                                                value={formData.projectId}
                                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                                className="w-full pl-11 pr-10 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/5 focus:border-neutral-900 dark:focus:border-white transition-all font-bold text-neutral-900 dark:text-white appearance-none"
                                            >
                                                <option value="" className="dark:bg-neutral-900">No Project</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id} className="dark:bg-neutral-900">{p.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {/* Main Actions */}
                                <div className="flex gap-4 pt-4">
                                    {editingBlock && (
                                        <button
                                            type="button"
                                            onClick={() => { handleDeleteBlock(editingBlock.id); setEditingBlock(null); }}
                                            className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-300 transition-all duration-200"
                                            title="Delete block"
                                        >
                                            <Trash2 className="h-6 w-6" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={editingBlock ? handleUpdateBlock : handleAddBlock}
                                        className="flex-1 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold text-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-[0.98] transition-all shadow-xl shadow-neutral-200 dark:shadow-black/20 flex items-center justify-center gap-3"
                                    >
                                        <Save className="h-5 w-5" />
                                        {editingBlock ? 'Confirm Edit' : 'Schedule Vitality'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 flex items-center justify-center z-[1000] px-4">
                    <div
                        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md animate-fade-in"
                        onClick={() => setShowSettings(false)}
                    />
                    <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 dark:border-white/10 max-sm w-full max-h-[90vh] overflow-y-auto animate-scale-in relative z-10 p-8 text-center custom-scrollbar">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Settings className="h-8 w-8 text-neutral-900 dark:text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Active Window</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 font-medium">
                            Set your daily bounds. Use these to define when your cockpit should track your progress.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="space-y-2">
                                <label htmlFor="day-start" className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block text-left pl-1">Starts</label>
                                <input
                                    id="day-start"
                                    type="time"
                                    title="Active window start"
                                    value={dayStart}
                                    onChange={(e) => setDayStart(e.target.value)}
                                    className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-all font-bold text-neutral-900 dark:text-white text-center"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="day-end" className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block text-left pl-1">Ends</label>
                                <input
                                    id="day-end"
                                    type="time"
                                    title="Active window end"
                                    value={dayEnd}
                                    onChange={(e) => setDayEnd(e.target.value)}
                                    className="w-full px-4 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-all font-bold text-neutral-900 dark:text-white text-center"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowSettings(false)} className="flex-1 py-4 font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Dismiss</button>
                            <button onClick={handleSaveSettings} className="flex-1 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold shadow-lg shadow-neutral-100 dark:shadow-black/20 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

