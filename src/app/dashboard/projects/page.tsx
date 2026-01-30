'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    X,
    Search,
    FolderKanban,
    CheckSquare,
    Timer,
    Activity,
    TrendingUp,
    Archive,
    CheckCircle2,
    Sparkles,
    Target
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
    getAllProjectsByStatus,
    getProjectsAggregateStats,
    getProjectStats,
    createProject
} from '@/lib/supabase/projectService';
import type { Project } from '@/types/database';
import type { ProjectStats, ProjectWithStats } from '@/lib/supabase/projectService';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { cn } from '@/lib/utils';

const DEFAULT_COLORS = [
    '#4a90e2', '#9b59b6', '#e74c3c', '#f39c12', '#23bd9eff', '#34495e',
];

const STATUS_TABS = [
    { value: 'all', label: 'All', icon: FolderKanban },
    { value: 'active', label: 'Active', icon: Sparkles },
    { value: 'archived', label: 'Archived', icon: Archive },
    { value: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export default function ProjectsPage() {
    const router = useRouter();
    const { supabaseUser } = useAuth();

    const [projects, setProjects] = useState<ProjectWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [aggregateStats, setAggregateStats] = useState<{
        totalProjects: number;
        activeProjects: number;
        totalTasks: number;
        completedTasks: number;
        totalFocusMinutes: number;
        avgHealthScore: number;
    } | null>(null);

    // Create project modal
    const [isCreating, setIsCreating] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', color: DEFAULT_COLORS[0] });

    const loadData = useCallback(async () => {
        if (!supabaseUser) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch projects by status
            const projectsData = await getAllProjectsByStatus(
                supabaseUser.id,
                statusFilter as 'active' | 'archived' | 'completed' | 'all'
            );

            // Fetch stats for each project
            const projectsWithStats = await Promise.all(
                projectsData.map(async (project) => {
                    const stats = await getProjectStats(project.id);
                    return { ...project, stats };
                })
            );

            setProjects(projectsWithStats);

            // Fetch aggregate stats once
            if (!aggregateStats) {
                const stats = await getProjectsAggregateStats(supabaseUser.id);
                setAggregateStats(stats);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser, statusFilter, aggregateStats]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabaseUser || !newProject.name.trim()) return;

        try {
            await createProject(
                supabaseUser.id,
                newProject.name.trim(),
                newProject.description.trim() || null,
                newProject.color
            );
            setNewProject({ name: '', description: '', color: DEFAULT_COLORS[0] });
            setIsCreating(false);
            // Refresh stats
            const stats = await getProjectsAggregateStats(supabaseUser.id);
            setAggregateStats(stats);
            await loadData();
        } catch (error) {
            console.error('Error creating project:', error);
        }
    };

    // Filter projects by search
    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
                    {/* Background decoration - enhanced gradients */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/30 to-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                    <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gradient-to-br from-pink-500/10 to-rose-500/5 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10 p-8 md:p-10">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                            {/* Title Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm">
                                        <Target className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600/70 dark:text-violet-400/70">Command Center</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                                    Focus Areas
                                </h1>
                                <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium max-w-md">
                                    Track your projects, measure progress, and achieve your goals.
                                </p>
                            </div>

                            {/* Stats Grid */}
                            {aggregateStats && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <StatCard
                                        icon={FolderKanban}
                                        value={aggregateStats.activeProjects}
                                        label="Active"
                                        color="text-blue-500"
                                        bgColor="bg-blue-500/10"
                                    />
                                    <StatCard
                                        icon={CheckSquare}
                                        value={`${aggregateStats.completedTasks}/${aggregateStats.totalTasks}`}
                                        label="Tasks Done"
                                        color="text-emerald-500"
                                        bgColor="bg-emerald-500/10"
                                    />
                                    <StatCard
                                        icon={Timer}
                                        value={formatDuration(aggregateStats.totalFocusMinutes)}
                                        label="This Week"
                                        color="text-violet-500"
                                        bgColor="bg-violet-500/10"
                                    />
                                    <StatCard
                                        icon={Activity}
                                        value={`${aggregateStats.avgHealthScore}%`}
                                        label="Avg Health"
                                        color={aggregateStats.avgHealthScore >= 70 ? "text-emerald-500" : aggregateStats.avgHealthScore >= 50 ? "text-amber-500" : "text-red-500"}
                                        bgColor={aggregateStats.avgHealthScore >= 70 ? "bg-emerald-500/10" : aggregateStats.avgHealthScore >= 50 ? "bg-amber-500/10" : "bg-red-500/10"}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content - Contained Width */}
            <div className="p-4 md:p-8 pt-6 space-y-8 max-w-7xl mx-auto">
                {/* Filters and Search Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl">
                        {STATUS_TABS.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                                    statusFilter === tab.value
                                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-lg"
                                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-sm font-medium shadow-sm"
                            />
                        </div>

                        {/* Create Button */}
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 transition-all shadow-lg shadow-neutral-300/50 dark:shadow-black/30"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">New Project</span>
                        </button>
                    </div>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-neutral-200 dark:border-neutral-800" />
                            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-neutral-900 dark:border-t-white animate-spin" />
                        </div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <EmptyState
                        statusFilter={statusFilter}
                        searchQuery={searchQuery}
                        onCreateClick={() => setIsCreating(true)}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredProjects.map((project, i) => (
                            <div
                                key={project.id}
                                className="animate-fade-in"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <ProjectCard
                                    project={project}
                                    stats={project.stats}
                                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Project Modal */}
                {isCreating && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
                        <div
                            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md animate-fade-in"
                            onClick={() => setIsCreating(false)}
                        />
                        <div className="relative bg-white dark:bg-neutral-900 rounded-[36px] p-8 max-w-md w-full shadow-2xl animate-scale-in border border-neutral-200 dark:border-neutral-800">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="absolute top-6 right-6 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:scale-110 transition-all"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                                    <Sparkles className="h-6 w-6 text-violet-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white">New Project</h2>
                                    <p className="text-sm text-neutral-400">Create a new focus area</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateProject} className="space-y-6">
                                <div>
                                    <label htmlFor="project-name" className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2 block px-1">
                                        Project Name
                                    </label>
                                    <input
                                        id="project-name"
                                        type="text"
                                        value={newProject.name}
                                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                        placeholder="e.g., Creative Pursuit"
                                        className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-none font-bold text-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="project-desc" className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-2 block px-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="project-desc"
                                        value={newProject.description}
                                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                        placeholder="What is this project about?"
                                        className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border-none font-medium resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest mb-3 block px-1">
                                        Color
                                    </label>
                                    <div className="flex gap-3">
                                        {DEFAULT_COLORS.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewProject({ ...newProject, color })}
                                                className={cn(
                                                    "w-12 h-12 rounded-2xl transition-all shadow-lg",
                                                    newProject.color === color
                                                        ? "ring-4 ring-neutral-900 dark:ring-white scale-110"
                                                        : "hover:scale-110 ring-2 ring-white/50"
                                                )}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Select color ${color}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={!newProject.name.trim()}
                                        className="flex-1 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
                                    >
                                        Create Project
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="px-8 py-4 text-neutral-400 font-bold hover:text-neutral-900 dark:hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ icon: Icon, value, label, color, bgColor }: {
    icon: React.ElementType;
    value: string | number;
    label: string;
    color: string;
    bgColor: string;
}) {
    return (
        <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 dark:border-neutral-700/50">
            <div className={cn("p-2 rounded-xl w-fit mb-2", bgColor)}>
                <Icon className={cn("w-4 h-4", color)} />
            </div>
            <p className="text-2xl font-black text-neutral-900 dark:text-white">{value}</p>
            <p className="text-[9px] font-black uppercase text-neutral-400 tracking-widest">{label}</p>
        </div>
    );
}

// Empty State Component
function EmptyState({ statusFilter, searchQuery, onCreateClick }: {
    statusFilter: string;
    searchQuery: string;
    onCreateClick: () => void;
}) {
    const getMessage = () => {
        if (searchQuery) {
            return {
                title: 'No matches found',
                description: `No projects matching "${searchQuery}"`,
                showCreate: false
            };
        }
        switch (statusFilter) {
            case 'archived':
                return { title: 'No archived projects', description: 'Projects you archive will appear here', showCreate: false };
            case 'completed':
                return { title: 'No completed projects', description: 'Finish a project to see it here', showCreate: false };
            case 'all':
            case 'active':
            default:
                return {
                    title: 'No projects yet',
                    description: 'Create your first project to start organizing your work',
                    showCreate: true
                };
        }
    };

    const msg = getMessage();

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 p-16 text-center max-w-md mx-auto shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <FolderKanban className="h-10 w-10 text-violet-500" />
            </div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
                {msg.title}
            </h3>
            <p className="text-neutral-500 font-medium mb-8">
                {msg.description}
            </p>
            {msg.showCreate && (
                <button
                    onClick={onCreateClick}
                    className="px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 mx-auto"
                >
                    <Plus className="h-5 w-5" />
                    Create First Project
                </button>
            )}
        </div>
    );
}
