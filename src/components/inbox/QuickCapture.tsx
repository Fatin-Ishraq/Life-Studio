'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Zap, CheckSquare, FileText, BookOpen, FolderPlus, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { createCapture, parseCapture } from '@/lib/supabase/captureService';

interface QuickCaptureProps {
    onCaptureAdded?: () => void;
}

export function QuickCapture({ onCaptureAdded }: QuickCaptureProps) {
    const { supabaseUser } = useAuth();
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const { type } = parseCapture(input);

    const TYPE_CONFIG = {
        task: { icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Task' },
        note: { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Note' },
        reading: { icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Reading' },
        project: { icon: FolderPlus, color: 'text-green-500', bg: 'bg-green-50', label: 'Project' },
        null: { icon: Zap, color: 'text-neutral-400', bg: 'bg-neutral-100', label: 'Capture' },
    };

    const currentType = TYPE_CONFIG[type || 'null'];
    const Icon = currentType.icon;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabaseUser || !input.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            const { type: detectedType, cleanContent } = parseCapture(input);

            await createCapture(supabaseUser.id, cleanContent, detectedType);

            setInput('');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1500);
            onCaptureAdded?.();
        } catch (error) {
            console.error('Error creating capture:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setInput('');
            inputRef.current?.blur();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div
                className={cn(
                    "relative overflow-hidden rounded-[28px] transition-all duration-300",
                    "bg-gradient-to-br from-white/90 to-white/60 dark:from-neutral-800/90 dark:to-neutral-900/60 backdrop-blur-xl",
                    "border border-white/20 dark:border-white/10 shadow-lg shadow-neutral-100/50 dark:shadow-black/20",
                    isFocused && "shadow-2xl shadow-neutral-200/50 dark:shadow-black/30 border-neutral-200 dark:border-neutral-600"
                )}
            >
                {/* Success Flash */}
                {showSuccess && (
                    <div className="absolute inset-0 bg-green-500/10 animate-pulse z-10 pointer-events-none" />
                )}

                <div className="p-5">
                    <div className="flex items-center gap-4">
                        {/* Type Indicator */}
                        <div className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                            currentType.bg,
                            isFocused && "scale-110"
                        )}>
                            <Icon className={cn("h-5 w-5 transition-colors", currentType.color)} />
                        </div>

                        {/* Input */}
                        <div className="flex-1 min-w-0">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                onKeyDown={handleKeyDown}
                                placeholder="What's on your mind?"
                                className="w-full bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-base font-medium"
                                disabled={isSubmitting}
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">
                                    {currentType.label}
                                </span>
                                <span className="text-[10px] text-neutral-200">•</span>
                                <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-300">
                                    <Command className="h-2.5 w-2.5" />
                                    <span>K</span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !input.trim()}
                            className={cn(
                                "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                input.trim()
                                    ? "bg-neutral-900 text-white shadow-lg shadow-neutral-200 hover:bg-neutral-800 active:scale-95"
                                    : "bg-neutral-100 text-neutral-300 cursor-not-allowed"
                            )}
                            aria-label="Submit capture"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* Hints */}
                    {isFocused && (
                        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 animate-fade-in">
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { prefix: '[]', label: 'Task', color: 'text-blue-500' },
                                    { prefix: '#', label: 'Note', color: 'text-amber-500' },
                                    { prefix: '*', label: 'Reading', color: 'text-purple-500' },
                                    { prefix: 'project:', label: 'Project', color: 'text-green-500' },
                                ].map((hint) => (
                                    <div key={hint.prefix} className="flex items-center gap-1.5">
                                        <code className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
                                            {hint.prefix}
                                        </code>
                                        <span className={cn("text-[10px] font-bold", hint.color)}>
                                            {hint.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
