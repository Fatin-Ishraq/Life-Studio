import React from 'react';
import { ReadingItem } from '@/types/database';

interface ReadingStatsProps {
    items: ReadingItem[];
}

export function ReadingStats({ items }: ReadingStatsProps) {
    const totalBooks = items.length;
    const completed = items.filter(i => i.status === 'completed').length;
    const reading = items.filter(i => i.status === 'reading').length;
    
    // Calculate total pages read (rough estimate for completed books if total_pages missing?)
    // Or just sum progress_pages
    const pagesRead = items.reduce((acc, item) => {
        if (item.status === 'completed' && item.total_pages) return acc + item.total_pages;
        return acc + (item.progress_pages || 0);
    }, 0);

    const stats = [
        { label: 'Total Books', value: totalBooks, icon: '📚', color: 'bg-blue-500/10 text-blue-600' },
        { label: 'Reading Now', value: reading, icon: '📖', color: 'bg-amber-500/10 text-amber-600' },
        { label: 'Completed', value: completed, icon: '✅', color: 'bg-green-500/10 text-green-600' },
        { label: 'Pages Read', value: pagesRead.toLocaleString(), icon: '📄', color: 'bg-violet-500/10 text-violet-600' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${stat.color}`}>
                        {stat.icon}
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-white leading-none">
                            {stat.value}
                        </p>
                        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wide">
                            {stat.label}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
