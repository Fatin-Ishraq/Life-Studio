'use client';

import { useState, useEffect, useCallback } from 'react';
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

export function ProjectsList() {
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Projects</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="btn-primary flex items-center gap-2 text-sm"
                >
                    <Plus className="h-4 w-4" />
                    New Project
                </button>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="max-w-xs mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                            <Plus className="h-8 w-8 text-primary-500" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">
                            No projects yet
                        </h3>
                        <p className="text-sm text-neutral-600 mb-4">
                            Get started by creating your first project to organize your work
                        </p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn-primary inline-flex items-center gap-2"
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
                                // TODO: Open project detail modal
                                console.log('Open project:', project.name);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-neutral-900">
                                New Project
                            </h3>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label htmlFor="project-name" className="block text-sm font-medium text-neutral-700 mb-1">
                                    Project Name
                                </label>
                                <input
                                    id="project-name"
                                    type="text"
                                    value={newProjectForm.name}
                                    onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                                    className="input w-full"
                                    placeholder="e.g., Life Cockpit Development"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label htmlFor="project-description" className="block text-sm font-medium text-neutral-700 mb-1">
                                    Description (optional)
                                </label>
                                <textarea
                                    id="project-description"
                                    value={newProjectForm.description}
                                    onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                                    className="input w-full resize-none"
                                    placeholder="What is this project about?"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Color
                                </label>
                                <div className="flex gap-2">
                                    {DEFAULT_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewProjectForm({ ...newProjectForm, color })}
                                            className={cn(
                                                "w-10 h-10 rounded-full transition-all",
                                                newProjectForm.color === color
                                                    ? "ring-2 ring-offset-2 ring-primary-500 scale-110"
                                                    : "hover:scale-105"
                                            )}
                                            style={{ backgroundColor: color }}
                                            aria-label={`Select ${color}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="btn-ghost flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1"
                                    disabled={!newProjectForm.name.trim()}
                                >
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
