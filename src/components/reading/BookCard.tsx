import React, { useState } from 'react';
import { ReadingItem } from '@/types/database';
import { Play, MoreVertical, Edit2, Trash2, BookOpen, CheckCircle2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookCardProps {
    book: ReadingItem;
    onEdit?: (book: ReadingItem) => void;
    onDelete?: (id: string) => void;
    onUpdateProgress?: (id: string, newPage: number) => void;
    onStartFocusSession?: (book: ReadingItem) => void;
}

export function BookCard({ book, onEdit, onDelete, onUpdateProgress, onStartFocusSession }: BookCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tempProgress, setTempProgress] = useState(book.progress_pages);

    const isReading = book.status === 'reading';
    const totalPages = book.total_pages || 100; // Fallback to 100 to avoid div by zero
    const percent = Math.min(100, Math.round((book.progress_pages / totalPages) * 100));

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempProgress(Number(e.target.value));
    };

    const handleProgressCommit = () => {
        if (onUpdateProgress && tempProgress !== book.progress_pages) {
            onUpdateProgress(book.id, tempProgress);
        }
    };

    return (
        <div className="group relative bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-200 dark:border-neutral-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Background Gradient for aesthetic */}
            <div className={cn(
                "absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                book.status === 'reading' ? "bg-blue-500/20" :
                book.status === 'completed' ? "bg-emerald-500/20" : "bg-amber-500/20"
            )} />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full p-6">
                
                {/* Header: Cover & Menu */}
                <div className="flex items-start gap-4 mb-4">
                    {/* Cover Image / Placeholder */}
                    <div className="shrink-0 w-20 h-28 rounded-2xl bg-neutral-100 dark:bg-neutral-800 shadow-inner overflow-hidden flex items-center justify-center relative">
                        {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                            <BookOpen className="w-8 h-8 text-neutral-300 dark:text-neutral-700" />
                        )}
                        {/* Status Dot */}
                        <div className={cn(
                            "absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900",
                            book.status === 'reading' ? "bg-blue-500 animate-pulse" :
                            book.status === 'completed' ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                    </div>

                    {/* Title & Author */}
                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex justify-between items-start">
                             <h3 className="text-lg font-black text-neutral-900 dark:text-white leading-tight line-clamp-2 mb-1" title={book.title}>
                                {book.title}
                            </h3>
                             {/* Context Menu Button */}
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setIsMenuOpen(!isMenuOpen);
                                        }
                                    }}
                                    className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                    aria-label="More options"
                                    tabIndex={0}
                                >
                                    <MoreVertical className="w-4 h-4" aria-hidden="true" />
                                </button>
                                
                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 py-1 z-30 animate-scale-in origin-top-right">
                                            {onEdit && (
                                                <button
                                                    onClick={() => { onEdit(book); setIsMenuOpen(false); }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            onEdit(book);
                                                            setIsMenuOpen(false);
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                                    tabIndex={0}
                                                    aria-label={`Edit ${book.title}`}
                                                >
                                                    <Edit2 className="w-3 h-3" aria-hidden="true" /> Edit
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => { onDelete(book.id); setIsMenuOpen(false); }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            onDelete(book.id);
                                                            setIsMenuOpen(false);
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                                    tabIndex={0}
                                                    aria-label={`Delete ${book.title}`}
                                                >
                                                    <Trash2 className="w-3 h-3" aria-hidden="true" /> Delete
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
                            {book.author || 'Unknown Author'}
                        </p>
                        
                        {/* Tags or Type Pill */}
                        <div className="mt-2 flex gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                                {book.item_type}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="mt-auto space-y-4">
                    {/* Progress Bar & Slider */}
                    {isReading ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                <span>{percent}% Complete</span>
                                <span className="tabular-nums">{tempProgress} / {totalPages} p</span>
                            </div>
                            
                            {/* Interactive Slider */}
                            <div className="relative h-2 w-full group/slider">
                                <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                                        style={{ width: `${(tempProgress / totalPages) * 100}%` }}
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={totalPages}
                                    value={tempProgress}
                                    onChange={handleProgressChange}
                                    onMouseUp={handleProgressCommit}
                                    onTouchEnd={handleProgressCommit}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleProgressCommit();
                                        }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={!onUpdateProgress}
                                    aria-label={`Progress for ${book.title}: ${tempProgress} of ${totalPages} pages`}
                                />
                            </div>
                        </div>
                    ) : book.status === 'completed' ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl">
                             <CheckCircle2 className="w-5 h-5" />
                             <span className="text-sm font-bold">Finished</span>
                             {book.rating && (
                                 <div className="ml-auto flex gap-0.5">
                                     {[...Array(5)].map((_, i) => (
                                         <Star 
                                             key={i} 
                                             className={cn("w-3 h-3", i < (book.rating || 0) ? "text-amber-400 fill-amber-400" : "text-neutral-300")} 
                                         />
                                     ))}
                                 </div>
                             )}
                        </div>
                    ) : (
                         <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-center">
                             <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Not Started</span>
                         </div>
                    )}

                    {/* Action Buttons */}
                    {isReading && (
                        <div className="space-y-3">
                            <button
                                className="w-full py-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                onClick={() => onStartFocusSession?.(book)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onStartFocusSession?.(book);
                                    }
                                }}
                                tabIndex={0}
                                aria-label={`Start focus session for ${book.title}`}
                            >
                                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                                Start Focus Session
                            </button>
                            <button
                                className="w-full py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        // Handle read now action
                                    }
                                }}
                                tabIndex={0}
                                aria-label={`Continue reading ${book.title}`}
                            >
                                <BookOpen className="w-4 h-4 fill-current" aria-hidden="true" />
                                Read Now
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
