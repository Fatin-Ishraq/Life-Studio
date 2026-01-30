'use client';

import { cn } from '@/lib/utils';
import type { Project } from '@/types/database';
import type { ProjectStats } from '@/lib/supabase/projectService';
import { CheckCircle2, Clock, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
    stats: ProjectStats;
    onClick?: () => void;
}

export function ProjectCard({ project, stats, onClick }: ProjectCardProps) {
    const healthScore = project.health_score;
    const completionRate = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

    const circumference = 2 * Math.PI * 28;
    const healthOffset = circumference - (healthScore / 100) * circumference;

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative w-full text-left transition-all duration-300",
                "rounded-[24px] overflow-hidden",
                // Dark glassmorphic design matching FocusTimer
                "bg-gradient-to-br from-white/80 to-white/40 dark:from-neutral-800/80 dark:to-neutral-900/60 backdrop-blur-xl",
                "border border-white/20 dark:border-white/10",
                "shadow-xl shadow-neutral-200/50 dark:shadow-black/30",
                "hover:shadow-2xl hover:shadow-neutral-200/60 dark:hover:shadow-black/50",
                "hover:-translate-y-0.5 hover:border-white/30 dark:hover:border-white/20",
                "focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-neutral-900",
                "active:scale-[0.98]"
            )}
        >
            {/* Subtle color glow based on project color */}
            <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ backgroundColor: project.color }}
            />

            <div className="p-5 relative">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    {/* Project Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div
                                className="w-2 h-2 rounded-full ring-2 ring-white/20 dark:ring-white/10"
                                style={{ backgroundColor: project.color }}
                            />
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.15em]",
                                project.status === 'active' ? "text-emerald-500" :
                                    project.status === 'completed' ? "text-blue-500" : "text-neutral-400"
                            )}>
                                {project.status}
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
                            {project.name}
                        </h3>
                        {project.description && (
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5 font-medium">
                                {project.description}
                            </p>
                        )}
                    </div>

                    {/* Compact Health Score Ring */}
                    <div className="relative flex-shrink-0">
                        <svg className="w-14 h-14 -rotate-90">
                            <defs>
                                <linearGradient id={`health-${project.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={healthScore >= 70 ? '#34d399' : healthScore >= 50 ? '#fbbf24' : '#f87171'} />
                                    <stop offset="100%" stopColor={healthScore >= 70 ? '#22c55e' : healthScore >= 50 ? '#f97316' : '#ef4444'} />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="28"
                                cy="28"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="transparent"
                                className="text-neutral-100 dark:text-neutral-800"
                            />
                            <circle
                                cx="28"
                                cy="28"
                                r="28"
                                stroke={`url(#health-${project.id})`}
                                strokeWidth="3"
                                fill="transparent"
                                className="transition-all duration-700 ease-out"
                                strokeDasharray={circumference}
                                strokeDashoffset={healthOffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm font-black text-neutral-900 dark:text-white">{healthScore}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-3">
                    <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-neutral-800 to-neutral-600 dark:from-white dark:to-neutral-400 transition-all duration-700 rounded-full"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                            Progress
                        </span>
                        <span className="text-[10px] font-black text-neutral-700 dark:text-neutral-300">
                            {stats.done}/{stats.total}
                        </span>
                    </div>
                </div>

                {/* Stats Row - Compact */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/50">
                    <div className="flex items-center gap-3">
                        {stats.in_progress > 0 && (
                            <div className="flex items-center gap-1 text-amber-600">
                                <Clock className="h-3 w-3" />
                                <span className="text-[10px] font-bold">{stats.in_progress}</span>
                            </div>
                        )}
                        {stats.blocked > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                                <AlertCircle className="h-3 w-3" />
                                <span className="text-[10px] font-bold">{stats.blocked}</span>
                            </div>
                        )}
                        {stats.done > 0 && (
                            <div className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-[10px] font-bold">{stats.done}</span>
                            </div>
                        )}
                        {stats.total === 0 && (
                            <div className="flex items-center gap-1 text-neutral-400">
                                <Sparkles className="h-3 w-3" />
                                <span className="text-[10px] font-medium">No tasks</span>
                            </div>
                        )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all" />
                </div>
            </div>
        </button>
    );
}
