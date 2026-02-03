'use client';

import { useState, useEffect, useCallback } from 'react';
import { Inbox, X, Sparkles, Archive, ArrowRight, CheckSquare, FolderPlus, Plus } from 'lucide-react';
import { InboxItem } from './InboxItem';
import {
    getUnprocessedCaptures,
    deleteCapture,
    markAsProcessed,
} from '@/lib/supabase/captureService';
import { getActiveProjects, createProject } from '@/lib/supabase/projectService';
import { createTask } from '@/lib/supabase/taskService';
import type { Capture, Project } from '@/types/database';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';

interface InboxListProps {
    onRefresh?: (timestamp: number) => void;
    refreshTrigger?: number;
}

type ProcessMode = 'view' | 'convert_task' | 'convert_project';

export function InboxList({ onRefresh, refreshTrigger }: InboxListProps) {
    const { supabaseUser } = useAuth();
    const [captures, setCaptures] = useState<Capture[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConverting, setIsConverting] = useState(false);
    const [processingCapture, setProcessingCapture] = useState<Capture | null>(null);
    const [mode, setMode] = useState<ProcessMode>('view');

    // Conversion Form State
    const [title, setTitle] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [projectColor, setProjectColor] = useState('#6366f1');

    const loadData = useCallback(async () => {
        if (!supabaseUser) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [capturesData, projectsData] = await Promise.all([
                getUnprocessedCaptures(supabaseUser.id),
                getActiveProjects(supabaseUser.id)
            ]);
            setCaptures(capturesData);
            setProjects(projectsData);
        } catch (error) {
            console.error('Error loading inbox data:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser]);

    useEffect(() => {
        loadData();
    }, [refreshTrigger, loadData]);

    const handleProcess = (capture: Capture) => {
        setProcessingCapture(capture);
        setTitle(capture.content);
        // Automatic mode selection based on detected type
        if (capture.capture_type === 'project') {
            setMode('convert_project');
        } else if (capture.capture_type === 'task') {
            setMode('convert_task');
        } else {
            setMode('view');
        }
    };

    const handleArchive = async () => {
        if (!processingCapture) return;
        try {
            setIsConverting(true);
            await markAsProcessed(processingCapture.id);
            setCaptures((prev: Capture[]) => prev.filter((c: Capture) => c.id !== processingCapture.id));
            setProcessingCapture(null);
        } catch (error) {
            console.error('Error archiving:', error);
        } finally {
            setIsConverting(false);
        }
    };

    const handleConvertToTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!processingCapture || !supabaseUser) return;

        try {
            setIsConverting(true);
            await createTask({
                user_id: supabaseUser.id,
                title,
                project_id: selectedProjectId || null,
                priority,
                status: 'todo',
                description: `Created from capture: ${processingCapture.content}`,
                complexity: 'medium',
                due_date: null,
                completed_at: null
            });
            await markAsProcessed(processingCapture.id);
            setProcessingCapture(null);
            await loadData();
            onRefresh?.(Date.now());
        } catch (error) {
            const err = error as { message?: string };
            console.error('Error converting to task:', err.message || error);
        } finally {
            setIsConverting(false);
        }
    };

    const handleConvertToProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!processingCapture || !supabaseUser) return;

        try {
            setIsConverting(true);
            await createProject(
                supabaseUser.id,
                title,
                `Created from capture: ${processingCapture.content}`,
                projectColor
            );
            await markAsProcessed(processingCapture.id);
            setProcessingCapture(null);
            await loadData(); // Refresh local projects and captures
            onRefresh?.(Date.now()); // Trigger parent refresh if needed
        } catch (error) {
            console.error('Error converting to project:', error);
        } finally {
            setIsConverting(false);
        }
    };

    const handleDelete = async (captureId: string) => {
        try {
            await deleteCapture(captureId);
            setCaptures((prev) => prev.filter((c) => c.id !== captureId));
        } catch (error) {
            console.error('Error deleting capture:', error);
        }
    };

    if (loading) {
        return (
            <div className="rounded-[28px] bg-gradient-to-br from-white/90 to-white/60 dark:from-neutral-800/90 dark:to-neutral-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg p-12 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-neutral-200 dark:border-neutral-700 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Inbox className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Inbox
                        </h2>
                        <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500">
                            {captures.length > 0 ? `${captures.length} items to process` : 'All clear'}
                        </p>
                    </div>
                </div>
                {captures.length > 0 && (
                    <span className="px-3 py-1.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shadow-lg dark:shadow-black/20">
                        {captures.length}
                    </span>
                )}
            </div>

            {/* Content */}
            {captures.length === 0 ? (
                <div className="rounded-[28px] bg-gradient-to-br from-white/90 to-white/60 dark:from-neutral-800/90 dark:to-neutral-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg p-12 text-center">
                    <div className="max-w-xs mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-[24px] bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 flex items-center justify-center">
                            <Sparkles className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                            Inbox Zero! 🎉
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                            All caught up. Use the quick capture above to add new thoughts.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {captures.map((capture) => (
                        <InboxItem
                            key={capture.id}
                            capture={capture}
                            onProcess={handleProcess}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Enhanced Process Modal */}
            {processingCapture && (
                <div className="fixed inset-0 flex items-center justify-center z-[1000] px-4">
                    <div
                        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => !isConverting && setProcessingCapture(null)}
                    />
                    <div className="bg-white dark:bg-neutral-900 rounded-[40px] shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in relative z-10 p-10 custom-scrollbar">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter">
                                    {mode === 'view' ? 'Process Item' : mode === 'convert_task' ? 'Create Task' : 'New Project'}
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                    {mode === 'view' ? 'What would you like to do with this thought?' : 'Fine-tune the details before publishing.'}
                                </p>
                            </div>
                            <button
                                onClick={() => setProcessingCapture(null)}
                                className="p-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-all"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {mode === 'view' ? (
                            <div className="space-y-8">
                                <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-100 dark:border-neutral-700/50">
                                    <p className="text-lg font-bold text-neutral-900 dark:text-white leading-relaxed italic">
                                        &quot;{processingCapture.content}&quot;
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <button
                                        onClick={() => setMode('convert_task')}
                                        className="flex items-center justify-between p-6 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
                                                <CheckSquare className="h-5 w-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black uppercase text-[10px] tracking-widest opacity-60">Promotion</div>
                                                <div className="font-bold">Convert to Task</div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                                    </button>

                                    <button
                                        onClick={() => setMode('convert_project')}
                                        className="flex items-center justify-between p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg">
                                                <FolderPlus className="h-5 w-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black uppercase text-[10px] tracking-widest opacity-60">Initiative</div>
                                                <div className="font-bold">Promote to Project</div>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" />
                                    </button>

                                    <button
                                        onClick={handleArchive}
                                        disabled={isConverting}
                                        className="flex items-center justify-between p-6 rounded-3xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-2xl bg-neutral-300 dark:bg-neutral-700 text-white">
                                                <Archive className="h-5 w-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black uppercase text-[10px] tracking-widest opacity-60">Retention</div>
                                                <div className="font-bold">Just Archive</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : mode === 'convert_task' ? (
                            <form onSubmit={handleConvertToTask} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Task Title</label>
                                    <input
                                        autoFocus
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="What needs to be done?"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="project-link" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Project Link</label>
                                        <select
                                            id="project-link"
                                            title="Select associated project"
                                            value={selectedProjectId}
                                            onChange={(e) => setSelectedProjectId(e.target.value)}
                                            className="w-full px-4 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-sm font-bold focus:outline-none"
                                        >
                                            <option value="">Inbox (Standalone)</option>
                                            {projects.map((p: Project) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="priority-select" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Priority</label>
                                        <select
                                            id="priority-select"
                                            title="Select task priority"
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                                            className="w-full px-4 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-sm font-bold focus:outline-none"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setMode('view')}
                                        className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isConverting}
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isConverting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleConvertToProject} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Project Name</label>
                                    <input
                                        autoFocus
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-6 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                        placeholder="Project name"
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-1">Visual Identity</label>
                                    <div className="flex gap-4">
                                        {['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a855f7'].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setProjectColor(color)}
                                                className={cn(
                                                    "w-10 h-10 rounded-full transition-all border-4",
                                                    projectColor === color ? "border-white dark:border-neutral-900 scale-125 shadow-lg" : "border-transparent opacity-40 hover:opacity-100"
                                                )}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setMode('view')}
                                        className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isConverting}
                                        className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isConverting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FolderPlus className="w-5 h-5" />}
                                        Launch Project
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
