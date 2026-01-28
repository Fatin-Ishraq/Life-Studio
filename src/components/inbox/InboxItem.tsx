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
    task: { icon: CheckSquare, bg: 'bg-blue-50', text: 'text-blue-600', label: 'Task' },
    note: { icon: FileText, bg: 'bg-amber-50', text: 'text-amber-600', label: 'Note' },
    reading: { icon: BookOpen, bg: 'bg-purple-50', text: 'text-purple-600', label: 'Reading' },
    project: { icon: FolderPlus, bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Project' },
    null: { icon: Zap, bg: 'bg-neutral-100', text: 'text-neutral-500', label: 'Capture' },
};

export function InboxItem({ capture, onProcess, onDelete }: InboxItemProps) {
    const config = TYPE_CONFIG[capture.capture_type || 'null'];
    const Icon = config.icon;

    return (
        <div className={cn(
            "group relative overflow-hidden rounded-2xl transition-all duration-300",
            "bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl",
            "border border-white/20 shadow-lg shadow-neutral-100/50",
            "hover:shadow-xl hover:-translate-y-0.5"
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
                        <p className="text-sm font-medium text-neutral-900 leading-relaxed break-words">
                            {capture.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={cn(
                                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-lg",
                                config.bg, config.text
                            )}>
                                {config.label}
                            </span>
                            <span className="text-[10px] font-medium text-neutral-400">
                                {getTimeAgo(capture.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button
                            onClick={() => onProcess(capture)}
                            className="p-2.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-all active:scale-95 shadow-lg"
                            aria-label="Process capture"
                            title="Process"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onDelete(capture.id)}
                            className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all active:scale-95"
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
