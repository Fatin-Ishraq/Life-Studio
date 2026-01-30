'use client';

import { Construction, MoveLeft } from 'lucide-react';
import Link from 'next/link';

export default function PlaceholderPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center uppercase tracking-widest">
            <Construction className="w-12 h-12 text-neutral-300 mb-6" />
            <h1 className="text-xl font-black text-neutral-900 dark:text-white mb-2">Module Under Construction</h1>
            <p className="text-[10px] font-bold text-neutral-500 mb-8">This logic path is currently being mapped by the cockpit crew.</p>
            <Link
                href="/dashboard"
                className="flex items-center gap-2 text-[10px] font-black hover:text-emerald-500 transition-colors"
            >
                <MoveLeft className="w-4 h-4" />
                Return to Dashboard
            </Link>
        </div>
    );
}
