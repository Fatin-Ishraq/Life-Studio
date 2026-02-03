'use client';

import { useState } from 'react';
import { FocusTimer } from '@/components/panels/FocusTimer';
import { ProjectsList } from '@/components/projects/ProjectsList';
import { QuickCapture } from '@/components/inbox/QuickCapture';
import { InboxList } from '@/components/inbox/InboxList';

import { TimeBudgetTimeline } from '@/components/timeline/TimeBudgetTimeline';

export default function DashboardPage() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleCaptureAdded = () => {
        // Trigger inbox refresh
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl mb-8">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/30 to-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
                <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2" />

                <div className="relative z-10 p-8 md:p-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm">
                            <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600/70 dark:text-violet-400/70">Life Studio</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight mb-3">
                        Dashboard
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 font-medium max-w-md">
                        Your command center for focus, projects, and productivity.
                    </p>
                </div>
            </div>

            {/* Quick Capture - Always at Top */}
            <QuickCapture onCaptureAdded={handleCaptureAdded} />

            {/* Time Budget Timeline */}
            <TimeBudgetTimeline />

            {/* Main Grid - items-start ensures alignment at top */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Focus Timer - Sticky on large screens */}
                <div className="lg:col-span-1 lg:sticky lg:top-8">
                    <FocusTimer showAmbientMode={false} />
                </div>

                {/* Projects List - Scrollable container */}
                <div className="lg:col-span-2 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar rounded-[32px]">
                    <ProjectsList />
                </div>
            </div>

            {/* Inbox - Full Width Below */}
            <InboxList
                refreshTrigger={refreshTrigger}
                onRefresh={(ts) => setRefreshTrigger(ts)}
            />
        </div>
    );
}
