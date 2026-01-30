'use client';

import { Trash2, ArrowRight, CheckSquare, FileText, BookOpen, FolderPlus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Capture } from '@/types/database';
import { getTimeAgo } from '@/lib/supabase/captureService';

interface InboxItemProps {
    capture: Capture;
    onProcess: (capture: Capture) => void;
    onDelete: (id: string) => void;
}

const TYPE_CONFIG = {
    task: { icon: CheckSquare, bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', label: 'Task' },
    note: { icon: FileText, bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', label: 'Note' },
    reading: { icon: BookOpen, bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', label: 'Reading' },
    project: { icon: FolderPlus, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', label: 'Project' },
    null: { icon: Zap, bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-500 dark:text-neutral-400', label: 'Capture' },
};

export function InboxItem({ capture, onProcess, onDelete }: InboxItemProps) {
    const config = TYPE_CONFIG[capture.capture_type || 'null'];
    const Icon = config.icon;

    return (
        <div className={cn(
            "group relative overflow-hidden rounded-2xl transition-all duration-300",
            "bg-gradient-to-br from-white/90 to-white/60 dark:from-neutral-800/90 dark:to-neutral-900/60 backdrop-blur-xl",
            "border border-white/20 dark:border-white/10 shadow-lg shadow-neutral-100/50 dark:shadow-black/20",
            "hover:shadow-xl hover:-translate-y-0.5 dark:hover:shadow-black/40"
        )}>
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                        config.bg
                    )}>
                        <Icon className={cn("h-5 w-5", config.text)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white leading-relaxed break-words">
                            {capture.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={cn(
                                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg",
                                config.bg, config.text
                            )}>
                                {config.label}
                            </span>
                            <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                                {getTimeAgo(capture.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button
                            onClick={() => onProcess(capture)}
                            className="p-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all active:scale-95 shadow-lg"
                            aria-label="Process capture"
                            title="Process"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(capture.id)}
                            className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
                            aria-label="Delete capture"
                            title="Delete"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
