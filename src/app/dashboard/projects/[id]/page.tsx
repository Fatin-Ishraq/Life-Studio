'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Search,
    CheckCircle2,
    Circle,
    AlertCircle,
    Calendar,
    Flag,
    Zap,
    Timer,
    Edit2,
    Trash2,
    X,
    Flame,
    TrendingUp,
    Target,
    Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getTasksForProject, createTask, updateTask, deleteTask } from '@/lib/supabase/taskService';
import { getProjectSessions, getProjectFocusStats } from '@/lib/supabase/sessionService';
import { updateProject, archiveProject } from '@/lib/supabase/projectService';
import type { Project, Task, Session } from '@/types/database';
import { cn } from '@/lib/utils';

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low', color: 'text-neutral-400', bg: 'bg-neutral-100 dark:bg-neutral-800' },
    { value: 'medium', label: 'Medium', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { value: 'high', label: 'High', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
];

const COMPLEXITY_OPTIONS = [
    { value: 'easy', label: 'Quick', icon: '⚡', desc: '< 30 min' },
    { value: 'medium', label: 'Standard', icon: '📋', desc: '1-2 hours' },
    { value: 'hard', label: 'Deep Work', icon: '🧠', desc: '3+ hours' },
];

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { supabaseUser } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [focusStats, setFocusStats] = useState<{ totalSessions: number; totalMinutes: number; avgFlowState: number | null; avgDistraction: number | null } | null>(null);
    const [loading, setLoading] = useState(true);

    // Task creation state
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        priority: 'medium' as Task['priority'],
        complexity: 'medium' as Task['complexity'],
        due_date: '',
        status: 'todo' as Task['status']
    });

    // Edit project modal
    const [isEditingProject, setIsEditingProject] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '', color: '' });

    // Filter state
    const [statusFilter, setStatusFilter] = useState<string>('active');
    const [searchQuery, setSearchQuery] = useState('');

    const loadProjectData = useCallback(async () => {
        if (!supabaseUser || !id) return;

        try {
            setLoading(true);

            const { data: projectData, error: projectError } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (projectError) throw projectError;
            setProject(projectData);
            setEditForm({
                name: projectData.name,
                description: projectData.description || '',
                color: projectData.color
            });

            const taskData = await getTasksForProject(id as string);
            setTasks(taskData);

            const sessionData = await getProjectSessions(id as string);
            setSessions(sessionData);

            const stats = await getProjectFocusStats(id as string);
            setFocusStats(stats);
        } catch (error) {
            console.error('Error loading project detail:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser, id]);

    useEffect(() => {
        loadProjectData();
    }, [loadProjectData]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabaseUser || !newTask.title.trim() || !id) return;

        try {
            await createTask({
                user_id: supabaseUser.id,
                project_id: id as string,
                title: newTask.title.trim(),
                description: null,
                status: newTask.status,
                priority: newTask.priority,
                complexity: newTask.complexity,
                due_date: newTask.due_date || null,
                completed_at: null
            });
            setNewTask({ title: '', priority: 'medium', complexity: 'medium', due_date: '', status: 'todo' });
            setIsAddingTask(false);
            await loadProjectData();
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleToggleTask = async (task: Task) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        try {
            await updateTask(task.id, {
                status: newStatus,
                completed_at: newStatus === 'done' ? new Date().toISOString() : null
            });
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error('Error toggling task:', error);
            await loadProjectData();
        }
    };

    const handleUpdateProject = async () => {
        if (!project) return;
        try {
            await updateProject(project.id, {
                name: editForm.name,
                description: editForm.description || null,
                color: editForm.color
            });
            setIsEditingProject(false);
            await loadProjectData();
        } catch (error) {
            console.error('Error updating project:', error);
        }
    };

    const handleArchiveProject = async () => {
        if (!project || !confirm('Archive this project? It can be restored later.')) return;
        try {
            await archiveProject(project.id);
            router.push('/dashboard');
        } catch (error) {
            console.error('Error archiving project:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-neutral-200 dark:border-neutral-800" />
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-neutral-900 dark:border-t-white animate-spin" />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-neutral-400" />
                </div>
                <h1 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Project Not Found</h1>
                <p className="text-neutral-500 mb-6">This project may have been deleted or does not exist.</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Filter tasks
    const filteredTasks = tasks.filter(t => {
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && t.status !== 'done') || (statusFilter === 'done' && t.status === 'done');
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const activeTasks = filteredTasks.filter(t => t.status !== 'done');
    const completedTasks = filteredTasks.filter(t => t.status === 'done');
    const allTasksCount = tasks.length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const completionPercentage = allTasksCount > 0 ? Math.round((doneCount / allTasksCount) * 100) : 0;

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    // Health color
    const healthColor = project.health_score >= 70 ? 'text-emerald-500' : project.health_score >= 50 ? 'text-amber-500' : 'text-red-500';
    const healthBg = project.health_score >= 70 ? 'from-emerald-500/20 to-green-500/20' : project.health_score >= 50 ? 'from-amber-500/20 to-orange-500/20' : 'from-red-500/20 to-rose-500/20';

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 pb-20">
            {/* Header Navigation */}
            <div className="flex items-center justify-between animate-fade-in">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="group flex items-center gap-3 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all"
                >
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-neutral-800 shadow-lg shadow-neutral-200/50 dark:shadow-black/20 group-hover:scale-110 group-hover:-translate-x-1 transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Back</span>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEditingProject(true)}
                        className="p-3 rounded-2xl bg-white dark:bg-neutral-800 shadow-lg shadow-neutral-200/50 dark:shadow-black/20 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:scale-110 active:scale-95 transition-all"
                        title="Edit Project"
                    >
                        <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleArchiveProject}
                        className="p-3 rounded-2xl bg-white dark:bg-neutral-800 shadow-lg shadow-neutral-200/50 dark:shadow-black/20 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 active:scale-95 transition-all"
                        title="Archive Project"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Hero Project Card */}
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-white/90 to-white/50 dark:from-neutral-800/90 dark:to-neutral-900/70 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-2xl shadow-neutral-300/50 dark:shadow-black/40 animate-scale-in">
                {/* Animated Background Glow */}
                <div
                    className="absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] opacity-40 -translate-y-1/3 translate-x-1/4 rounded-full animate-pulse"
                    style={{ backgroundColor: project.color }}
                />
                <div
                    className="absolute bottom-0 left-0 w-[300px] h-[300px] blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/4 rounded-full"
                    style={{ backgroundColor: project.color }}
                />

                <div className="relative z-10 p-8 md:p-12">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                        {/* Project Info */}
                        <div className="space-y-4 max-w-2xl">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-5 h-5 rounded-full shadow-lg ring-4 ring-white/50 dark:ring-white/20"
                                    style={{ backgroundColor: project.color }}
                                />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
                                    {project.status === 'active' ? '● Active Project' : project.status}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
                                {project.name}
                            </h1>
                            {project.description && (
                                <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed max-w-xl">
                                    {project.description}
                                </p>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Health Score */}
                            <div className={cn("relative overflow-hidden p-5 rounded-3xl border border-white/50 dark:border-white/10 text-center bg-gradient-to-br", healthBg)}>
                                <Target className={cn("w-5 h-5 mx-auto mb-2", healthColor)} />
                                <p className={cn("text-3xl font-black", healthColor)}>{project.health_score}</p>
                                <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest mt-1">Health</p>
                            </div>

                            {/* Progress */}
                            <div className="relative overflow-hidden bg-white/60 dark:bg-neutral-800/60 p-5 rounded-3xl border border-white/50 dark:border-white/10 text-center">
                                <TrendingUp className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                                <p className="text-3xl font-black text-neutral-900 dark:text-white">{completionPercentage}%</p>
                                <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest mt-1">Progress</p>
                                {/* Mini progress bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700">
                                    <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${completionPercentage}%` }} />
                                </div>
                            </div>

                            {/* Focus Time */}
                            <div className="bg-white/60 dark:bg-neutral-800/60 p-5 rounded-3xl border border-white/50 dark:border-white/10 text-center">
                                <Timer className="w-5 h-5 mx-auto mb-2 text-violet-500" />
                                <p className="text-3xl font-black text-neutral-900 dark:text-white">{formatDuration(focusStats?.totalMinutes || 0)}</p>
                                <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest mt-1">Focus Time</p>
                            </div>

                            {/* Sessions */}
                            <div className="bg-white/60 dark:bg-neutral-800/60 p-5 rounded-3xl border border-white/50 dark:border-white/10 text-center">
                                <Flame className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                                <p className="text-3xl font-black text-neutral-900 dark:text-white">{focusStats?.totalSessions || 0}</p>
                                <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest mt-1">Sessions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Tasks Section - 2 columns */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Task Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-amber-500" />
                            Tasks
                            <span className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black text-neutral-500">
                                {activeTasks.length} Active
                            </span>
                        </h2>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-400 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <option value="active">Active</option>
                            <option value="done">Completed</option>
                            <option value="all">All Tasks</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-neutral-900 dark:group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 focus:shadow-lg text-sm font-medium transition-all"
                        />
                    </div>

                    {/* Add Task Button/Form */}
                    {isAddingTask ? (
                        <form onSubmit={handleAddTask} className="bg-white dark:bg-neutral-900 rounded-[28px] border-2 border-neutral-200 dark:border-neutral-700 p-6 space-y-5 shadow-xl animate-scale-in">
                            <input
                                type="text"
                                placeholder="What high-impact task will you tackle?"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-none text-lg font-bold focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10 placeholder:text-neutral-300"
                                autoFocus
                            />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Priority */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-neutral-400 tracking-wider block px-1">Priority</label>
                                    <div className="flex flex-wrap gap-1">
                                        {PRIORITY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setNewTask({ ...newTask, priority: opt.value as Task['priority'] })}
                                                className={cn(
                                                    "px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                                                    newTask.priority === opt.value
                                                        ? cn(opt.bg, opt.color, "ring-2 ring-current scale-105")
                                                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:scale-105"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Complexity */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-neutral-400 tracking-wider block px-1">Effort</label>
                                    <div className="flex gap-1">
                                        {COMPLEXITY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setNewTask({ ...newTask, complexity: opt.value as Task['complexity'] })}
                                                className={cn(
                                                    "flex-1 px-2 py-2 rounded-xl text-center transition-all",
                                                    newTask.complexity === opt.value
                                                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 scale-105 shadow-lg"
                                                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:scale-105"
                                                )}
                                                title={opt.desc}
                                            >
                                                <span className="text-lg">{opt.icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[9px] font-black uppercase text-neutral-400 tracking-wider block px-1">Due Date</label>
                                    <input
                                        type="date"
                                        value={newTask.due_date}
                                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-none text-sm font-bold focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={!newTask.title.trim()}
                                    className="flex-1 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-neutral-300/50 dark:shadow-black/30"
                                >
                                    Create Task
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingTask(false)}
                                    className="px-8 py-4 text-neutral-400 font-bold hover:text-neutral-900 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="w-full flex items-center justify-center gap-3 p-5 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800 rounded-[24px] border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-400 dark:hover:border-neutral-500 hover:shadow-lg transition-all group"
                        >
                            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 group-hover:bg-neutral-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-neutral-900 transition-all">
                                <Plus className="h-5 w-5" />
                            </div>
                            <span className="font-bold">Add a new task</span>
                        </button>
                    )}

                    {/* Task List */}
                    <div className="space-y-3">
                        {filteredTasks.length === 0 && (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-20 h-20 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                    <Zap className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
                                </div>
                                <p className="text-neutral-400 font-bold">No tasks found</p>
                                <p className="text-sm text-neutral-300 dark:text-neutral-600">Create your first task to get started</p>
                            </div>
                        )}

                        {/* Active Tasks */}
                        {activeTasks.map((task, i) => (
                            <div key={task.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in">
                                <TaskItem task={task} onToggle={handleToggleTask} onDelete={async () => { await deleteTask(task.id); await loadProjectData(); }} />
                            </div>
                        ))}

                        {/* Completed Tasks */}
                        {completedTasks.length > 0 && statusFilter !== 'active' && (
                            <>
                                <div className="pt-8 pb-4">
                                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        Completed ({completedTasks.length})
                                        <span className="h-px flex-1 bg-gradient-to-r from-neutral-200 dark:from-neutral-800 to-transparent" />
                                    </h3>
                                </div>
                                {completedTasks.map((task, i) => (
                                    <div key={task.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-fade-in">
                                        <TaskItem task={task} onToggle={handleToggleTask} onDelete={async () => { await deleteTask(task.id); await loadProjectData(); }} completed />
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5 lg:sticky lg:top-8">
                    {/* Focus Stats Card */}
                    {focusStats && focusStats.totalSessions > 0 && (
                        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 rounded-[28px] p-6 text-white shadow-2xl shadow-violet-500/30">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="p-2 rounded-xl bg-white/20">
                                        <Flame className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">Focus Performance</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                                        <p className="text-2xl font-black">{formatDuration(focusStats.totalMinutes)}</p>
                                        <p className="text-[9px] font-bold uppercase opacity-70">Total Focus</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                                        <p className="text-2xl font-black">{focusStats.totalSessions}</p>
                                        <p className="text-[9px] font-bold uppercase opacity-70">Sessions</p>
                                    </div>
                                    {focusStats.avgFlowState !== null && (
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                                            <p className="text-2xl font-black">{focusStats.avgFlowState.toFixed(1)}<span className="text-sm opacity-70">/5</span></p>
                                            <p className="text-[9px] font-bold uppercase opacity-70">Avg Flow</p>
                                        </div>
                                    )}
                                    {focusStats.avgDistraction !== null && (
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                                            <p className="text-2xl font-black">{focusStats.avgDistraction.toFixed(1)}</p>
                                            <p className="text-[9px] font-bold uppercase opacity-70">Distractions</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Sessions */}
                    <div className="bg-white dark:bg-neutral-900 rounded-[28px] border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl shadow-neutral-200/50 dark:shadow-black/20">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                                <Timer className="h-4 w-4 text-violet-500" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400">Recent Sessions</h3>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="text-center py-10">
                                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                                    <Timer className="h-8 w-8 text-neutral-300 dark:text-neutral-700" />
                                </div>
                                <p className="text-sm text-neutral-400 font-medium">No sessions yet</p>
                                <p className="text-[11px] text-neutral-300 dark:text-neutral-600 mt-1">Link focus sessions to this project</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sessions.slice(0, 5).map((session, i) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-neutral-900 dark:text-white capitalize">{session.session_type.replace('_', ' ')}</p>
                                            <p className="text-[10px] text-neutral-400">{new Date(session.started_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-neutral-900 dark:text-white">{session.duration_minutes}m</p>
                                            {session.flow_state && (
                                                <div className="flex items-center gap-1 justify-end">
                                                    <Zap className="w-3 h-3 text-amber-500" />
                                                    <span className="text-[9px] text-amber-500 font-bold">{session.flow_state}/5</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 rounded-[28px] p-6 border border-neutral-200/50 dark:border-neutral-700/50">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left transition-all group border border-transparent hover:border-violet-200 dark:hover:border-violet-800">
                                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600">
                                    <Timer className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-neutral-900 dark:text-white block">Start Focus Session</span>
                                    <span className="text-[10px] text-neutral-400">Deep work on this project</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setIsEditingProject(true)}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-neutral-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left transition-all group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                            >
                                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                    <Edit2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-neutral-900 dark:text-white block">Edit Project</span>
                                    <span className="text-[10px] text-neutral-400">Name, color, description</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Project Modal */}
            {isEditingProject && (
                <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
                    <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md animate-fade-in" onClick={() => setIsEditingProject(false)} />
                    <div className="relative bg-white dark:bg-neutral-900 rounded-[36px] p-8 max-w-md w-full shadow-2xl animate-scale-in border border-neutral-200 dark:border-neutral-800">
                        <button onClick={() => setIsEditingProject(false)} className="absolute top-6 right-6 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:scale-110 transition-all">
                            <X className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                                <Edit2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-neutral-900 dark:text-white">Edit Project</h2>
                                <p className="text-sm text-neutral-400">Update project details</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2 block px-1">Project Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-none font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2 block px-1">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="What is this project about?"
                                    className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-none font-medium resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-3 block px-1">Project Color</label>
                                <div className="flex gap-3">
                                    {['#4a90e2', '#9b59b6', '#e74c3c', '#f39c12', '#23bd9eff', '#34495e'].map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setEditForm({ ...editForm, color })}
                                            className={cn(
                                                "w-12 h-12 rounded-2xl transition-all shadow-lg",
                                                editForm.color === color
                                                    ? "ring-4 ring-neutral-900 dark:ring-white scale-110"
                                                    : "hover:scale-110 ring-2 ring-white/50"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={handleUpdateProject}
                                    className="flex-1 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => setIsEditingProject(false)}
                                    className="px-8 py-4 text-neutral-400 font-bold hover:text-neutral-900 dark:hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Task Item Component
function TaskItem({ task, onToggle, onDelete, completed = false }: { task: Task; onToggle: (t: Task) => void; onDelete: () => void; completed?: boolean }) {
    const priorityConfig = PRIORITY_OPTIONS.find(p => p.value === task.priority);
    const complexityConfig = COMPLEXITY_OPTIONS.find(c => c.value === task.complexity);

    return (
        <div className={cn(
            "group relative flex items-center gap-4 p-5 rounded-[20px] border transition-all duration-300",
            completed
                ? "bg-neutral-50/50 dark:bg-neutral-800/30 border-transparent opacity-60 hover:opacity-100"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xl shadow-neutral-100 dark:shadow-black/10"
        )}>
            {/* Priority indicator */}
            <div
                className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all",
                    task.priority === 'urgent' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-amber-500' :
                            task.priority === 'medium' ? 'bg-blue-500' : 'bg-neutral-300'
                )}
            />

            <button
                onClick={() => onToggle(task)}
                className={cn(
                    "flex-shrink-0 transition-all duration-300",
                    completed
                        ? "text-emerald-500"
                        : "text-neutral-300 hover:text-emerald-500 hover:scale-110"
                )}
            >
                {completed ? (
                    <CheckCircle2 className="h-6 w-6" />
                ) : (
                    <Circle className="h-6 w-6" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                <h4 className={cn(
                    "text-base font-bold truncate transition-colors",
                    completed ? "text-neutral-400 line-through" : "text-neutral-900 dark:text-white"
                )}>
                    {task.title}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {/* Priority Badge */}
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-lg", priorityConfig?.bg)}>
                        <Flag className={cn("h-3 w-3", priorityConfig?.color)} />
                        <span className={cn("text-[9px] font-black uppercase", priorityConfig?.color)}>{task.priority}</span>
                    </div>

                    {/* Complexity */}
                    {complexityConfig && (
                        <span className="text-sm" title={complexityConfig.label}>{complexityConfig.icon}</span>
                    )}

                    {/* Due Date */}
                    {task.due_date && (
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-lg",
                            new Date(task.due_date) < new Date() && !completed
                                ? "bg-red-50 dark:bg-red-900/20 text-red-500"
                                : "text-neutral-400"
                        )}>
                            <Calendar className="h-3 w-3" />
                            <span className="text-[9px] font-bold">{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-2.5 rounded-xl text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );
}
