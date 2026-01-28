'use client';

import { useState, useEffect, useCallback } from 'react';
import { Inbox, X, Sparkles, Archive } from 'lucide-react';
import { InboxItem } from './InboxItem';
import {
    getUnprocessedCaptures,
    deleteCapture,
    markAsProcessed,
} from '@/lib/supabase/captureService';
import type { Capture } from '@/types/database';
import { useAuth } from '@/lib/auth/AuthContext';

interface InboxListProps {
    onRefresh?: number;
}

export function InboxList({ onRefresh }: InboxListProps) {
    const { supabaseUser } = useAuth();
    const [captures, setCaptures] = useState<Capture[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingCapture, setProcessingCapture] = useState<Capture | null>(null);

    const loadCaptures = useCallback(async () => {
        if (!supabaseUser) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getUnprocessedCaptures(supabaseUser.id);
            setCaptures(data);
        } catch (error) {
            console.error('Error loading captures:', error);
        } finally {
            setLoading(false);
        }
    }, [supabaseUser]);

    useEffect(() => {
        loadCaptures();
    }, [onRefresh, loadCaptures]);

    const handleDelete = async (captureId: string) => {
        try {
            await deleteCapture(captureId);
            setCaptures((prev) => prev.filter((c) => c.id !== captureId));
        } catch (error) {
            console.error('Error deleting capture:', error);
        }
    };

    const handleProcess = (capture: Capture) => {
        setProcessingCapture(capture);
    };

    const handleProcessComplete = async () => {
        if (!processingCapture) return;

        try {
            await markAsProcessed(processingCapture.id);
            setCaptures((prev) => prev.filter((c) => c.id !== processingCapture.id));
            setProcessingCapture(null);
        } catch (error) {
            console.error('Error processing capture:', error);
        }
    };

    if (loading) {
        return (
            <div className="rounded-[28px] bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl border border-white/20 shadow-lg p-12 flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center">
                        <Inbox className="h-5 w-5 text-neutral-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-neutral-900">
                            Inbox
                        </h2>
                        <p className="text-xs font-medium text-neutral-400">
                            {captures.length > 0 ? `${captures.length} items to process` : 'All clear'}
                        </p>
                    </div>
                </div>
                {captures.length > 0 && (
                    <span className="px-3 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-bold">
                        {captures.length}
                    </span>
                )}
            </div>

            {/* Content */}
            {captures.length === 0 ? (
                <div className="rounded-[28px] bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl border border-white/20 shadow-lg p-12 text-center">
                    <div className="max-w-xs mx-auto">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-[24px] bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
                            <Sparkles className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 mb-2">
                            Inbox Zero! 🎉
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium">
                            All caught up. Use the quick capture above to add new thoughts.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {captures.map((capture) => (
                        <InboxItem
                            key={capture.id}
                            capture={capture}
                            onProcess={handleProcess}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Process Modal */}
            {processingCapture && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                    <div
                        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md animate-fade-in"
                        onClick={() => setProcessingCapture(null)}
                    />
                    <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 max-w-md w-full overflow-hidden animate-scale-in relative z-10 p-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
                                    Process Item
                                </h3>
                                <p className="text-sm text-neutral-500 font-medium">What would you like to do?</p>
                            </div>
                            <button
                                onClick={() => setProcessingCapture(null)}
                                className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-all"
                                aria-label="Close modal"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content Preview */}
                        <div className="mb-6 p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
                            <p className="text-base font-medium text-neutral-900 leading-relaxed">
                                {processingCapture.content}
                            </p>
                            {processingCapture.capture_type && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Type</span>
                                    <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600">
                                        {processingCapture.capture_type}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-sm text-blue-800 font-medium">
                                🚀 Soon you&apos;ll be able to convert this directly into tasks or projects!
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setProcessingCapture(null)}
                                className="flex-1 py-4 font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
                            >
                                Keep in Inbox
                            </button>
                            <button
                                onClick={handleProcessComplete}
                                className="flex-1 py-4 bg-neutral-900 text-white rounded-2xl font-bold shadow-xl shadow-neutral-200 hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Archive className="h-5 w-5" />
                                Archive
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
