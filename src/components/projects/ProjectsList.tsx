'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { ProjectCard } from './ProjectCard';
import { getProjectsWithStats, createProject } from '@/lib/supabase/projectService';
import type { ProjectWithStats } from '@/lib/supabase/projectService';
import { useAuth } from '@/lib/auth/AuthContext';
import { cn } from '@/lib/utils';

const DEFAULT_COLORS = [
    '#4a90e2', // Blue
    '#9b59b6', // Purple
    '#e74c3c', // Red
    '#f39c12', // Orange
    '#23bd9eff', // Teal
    '#34495e', // Dark Gray
];

const COLOR_BG_MAP: Record<string, string> = {
    '#4a90e2': 'bg-[#4a90e2]',
    '#9b59b6': 'bg-[#9b59b6]',
    '#e74c3c': 'bg-[#e74c3c]',
    '#f39c12': 'bg-[#f39c12]',
    '#23bd9eff': 'bg-[#23bd9eff]',
    '#34495e': 'bg-[#34495e]',
};


export function ProjectsList() {
    const router = useRouter();
    const { supabaseUser } = useAuth();
    const [projects, setProjects] = useState<ProjectWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectForm, setNewProjectForm] = useState({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0],
    });

    const loadProjects = useCallback(async () => {
        if (!supabaseUser) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getProjectsWithStats(supabaseUser.id);
            setProjects(data);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabaseUser || !newProjectForm.name.trim()) return;

        try {
            await createProject(
                supabaseUser.id,
                newProjectForm.name.trim(),
                newProjectForm.description.trim() || null,
                newProjectForm.color
            );

            // Reset form and close modal
            setNewProjectForm({
                name: '',
                description: '',
                color: DEFAULT_COLORS[0],
            });
            setIsCreating(false);

            // Refresh projects list
            await loadProjects();
        } catch (error) {
            console.error('Error creating project:', error);
        }
    };

    if (loading) {
        return (
            <div className="card p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-4 p-1 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
                        Projects
                    </h2>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                        Focus areas & health
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-neutral-200 dark:shadow-black/20"
                >
                    <Plus className="h-4 w-4" />
                    New Project
                </button>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="card p-12 text-center backdrop-blur-sm bg-white/40 dark:bg-neutral-800/40 border border-white/20 dark:border-white/10 shadow-lg dark:shadow-black/20">
                    <div className="max-w-xs mx-auto">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                            <Plus className="h-8 w-8 text-neutral-900 dark:text-white" />
                        </div>
                        <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
                            No projects yet
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-medium">
                            Get started by creating your first project to organize your work
                        </p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full px-4 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-neutral-200 dark:shadow-black/20"
                        >
                            <Plus className="h-4 w-4" />
                            Create First Project
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            stats={project.stats}
                            onClick={() => {
                                router.push(`/dashboard/projects/${project.id}`);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            {isCreating && (
                <div className="fixed inset-0 flex items-center justify-center z-[1000] px-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md animate-fade-in"
                        onClick={() => setIsCreating(false)}
                    />

                    {/* Modal Content */}
                    <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 dark:border-white/10 max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in relative z-10 custom-scrollbar">
                        <div className="p-8">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                                        Found New Project
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Define a new focus area</p>
                                </div>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all"
                                    aria-label="Close"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleCreateProject} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="project-name" className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest block pl-1">
                                        Project Name
                                    </label>
                                    <input
                                        id="project-name"
                                        type="text"
                                        value={newProjectForm.name}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/5 focus:border-neutral-900 dark:focus:border-white transition-all font-bold text-neutral-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
                                        placeholder="e.g., Creative Pursuit"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="project-description" className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-widest block pl-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="project-description"
                                        value={newProjectForm.description}
                                        onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/5 focus:border-neutral-900 dark:focus:border-white transition-all font-medium text-neutral-900 dark:text-white resize-none placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
                                        placeholder="What is the goal of this project?"
                                        rows={3}
                                    />
                                </div>

                                <fieldset className="space-y-3">
                                    <legend className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block pl-1">
                                        Visual Identity
                                    </legend>
                                    <div className="flex gap-3 mt-3">
                                        {DEFAULT_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewProjectForm({ ...newProjectForm, color })}
                                                className={cn(
                                                    "w-10 h-10 rounded-full transition-all border-2",
                                                    COLOR_BG_MAP[color] || "bg-neutral-400",
                                                    newProjectForm.color === color
                                                        ? "border-neutral-900 dark:border-white scale-110 shadow-lg"
                                                        : "border-transparent hover:scale-105"
                                                )}
                                                aria-label={`Select color ${color}`}
                                            />
                                        ))}
                                    </div>
                                </fieldset>

                                {/* Actions */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-4 font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold text-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-[0.98] transition-all shadow-xl shadow-neutral-200 dark:shadow-black/20"
                                        disabled={!newProjectForm.name.trim()}
                                    >
                                        Launch Project
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
