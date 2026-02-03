import React, { useState } from 'react';
import { ReadingItem } from '@/types/database';
import { addReadingItem } from '@/lib/supabase/readingService';

interface AddBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userId: string;
}

export function AddBookModal({ isOpen, onClose, onSuccess, userId }: AddBookModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<ReadingItem>>({
        title: '',
        author: '',
        status: 'to_read',
        total_pages: 0,
        cover_url: '',
        item_type: 'book'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addReadingItem({
                user_id: userId,
                title: formData.title!,
                author: formData.author || null,
                status: formData.status as 'to_read' | 'reading' | 'completed',
                item_type: formData.item_type as 'book' | 'article' | 'paper' | 'course',
                total_pages: formData.total_pages || null,
                cover_url: formData.cover_url || null,
                progress_pages: 0,
                rating: null,
                aha_moment: null,
                notes: null,
                started_at: formData.status === 'reading' ? new Date().toISOString() : null,
                completed_at: null,
                tags: [],
                link: null
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to add book');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
                className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-lg shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Add New Book</h2>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Title</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Atomic Habits"
                            className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Author</label>
                            <input
                                type="text"
                                placeholder="e.g. James Clear"
                                className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.author || ''}
                                onChange={e => setFormData({...formData, author: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Total Pages</label>
                            <input
                                type="number"
                                placeholder="320"
                                className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.total_pages || ''}
                                onChange={e => setFormData({...formData, total_pages: parseInt(e.target.value) || 0})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</label>
                            <select
                                className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.status}
                                onChange={e => setFormData({...formData, status: e.target.value as 'to_read' | 'reading' | 'completed'})}
                            >
                                <option value="to_read">To Read</option>
                                <option value="reading">Reading</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Type</label>
                            <select
                                className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={formData.item_type}
                                onChange={e => setFormData({...formData, item_type: e.target.value as 'book' | 'article' | 'paper' | 'course'})}
                            >
                                <option value="book">Book</option>
                                <option value="article">Article</option>
                                <option value="paper">Paper</option>
                                <option value="course">Course</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Cover URL (Optional)</label>
                        <input
                            type="url"
                            placeholder="https://example.com/cover.jpg"
                            className="w-full px-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            value={formData.cover_url || ''}
                            onChange={e => setFormData({...formData, cover_url: e.target.value})}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Adding...' : 'Add Book'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
