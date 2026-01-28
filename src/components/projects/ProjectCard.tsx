'use client';

import { cn } from '@/lib/utils';
import type { Project } from '@/types/database';
import type { ProjectStats } from '@/lib/supabase/projectService';
import { CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
    stats: ProjectStats;
    onClick?: () => void;
}

export function ProjectCard({ project, stats, onClick }: ProjectCardProps) {
    const healthScore = project.health_score;
    const completionRate = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

    const getHealthLabel = (score: number) => {
        if (score >= 80) return 'Thriving';
        if (score >= 60) return 'Healthy';
        if (score >= 40) return 'Needs Work';
        return 'Critical';
    };


    const circumference = 2 * Math.PI * 38;
    const healthOffset = circumference - (healthScore / 100) * circumference;

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative w-full text-left transition-all duration-300",
                "rounded-[28px] overflow-hidden",
                "bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl",
                "border border-white/20 shadow-xl shadow-neutral-100/50",
                "hover:shadow-2xl hover:shadow-neutral-200/50 hover:-translate-y-1",
                "focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-4",
                "active:scale-[0.98]"
            )}
        >
            {/* Color Accent Bar */}
            <div
                className="absolute top-0 left-0 w-full h-1.5 opacity-80"
                style={{ backgroundColor: project.color }}
            />

            <div className="p-6 pt-7">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <div
                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                style={{ backgroundColor: project.color }}
                            />
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.2em]",
                                project.status === 'active' ? "text-emerald-500" :
                                    project.status === 'completed' ? "text-blue-500" : "text-neutral-400"
                            )}>
                                {project.status}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 truncate group-hover:text-neutral-700 transition-colors">
                            {project.name}
                        </h3>
                        {project.description && (
                            <p className="text-xs text-neutral-500 truncate mt-1 font-medium">
                                {project.description}
                            </p>
                        )}
                    </div>

                    {/* Health Score Ring */}
                    <div className="relative flex-shrink-0">
                        <svg className="w-20 h-20 -rotate-90">
                            <defs>
                                <linearGradient id={`health-${project.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={healthScore >= 70 ? '#34d399' : healthScore >= 50 ? '#fbbf24' : '#f87171'} />
                                    <stop offset="100%" stopColor={healthScore >= 70 ? '#22c55e' : healthScore >= 50 ? '#f97316' : '#ef4444'} />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="40"
                                cy="40"
                                r="38"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-neutral-100"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="38"
                                stroke={`url(#health-${project.id})`}
                                strokeWidth="4"
                                fill="transparent"
                                className="transition-all duration-700 ease-out"
                                strokeDasharray={circumference}
                                strokeDashoffset={healthOffset}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-neutral-900">{healthScore}</span>
                            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider">{getHealthLabel(healthScore)}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 mb-4">
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-neutral-800 to-neutral-600 transition-all duration-700 rounded-full"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            Progress
                        </span>
                        <span className="text-xs font-black text-neutral-900">
                            {stats.done}/{stats.total} Done
                        </span>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 pt-4 border-t border-neutral-100">
                    {stats.in_progress > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-600">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">{stats.in_progress} Active</span>
                        </div>
                    )}
                    {stats.blocked > 0 && (
                        <div className="flex items-center gap-1.5 text-red-500">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">{stats.blocked} Blocked</span>
                        </div>
                    )}
                    {stats.done > 0 && (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold">{stats.done} Complete</span>
                        </div>
                    )}
                    {stats.total === 0 && (
                        <div className="flex items-center gap-1.5 text-neutral-400">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">No tasks yet</span>
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}
