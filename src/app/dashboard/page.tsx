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
        <div className="p-8 space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-semibold text-neutral-900">Dashboard</h1>
                <p className="mt-2 text-neutral-600">Welcome to your Life Cockpit</p>
            </div>

            {/* Quick Capture - Always at Top */}
            <QuickCapture onCaptureAdded={handleCaptureAdded} />

            {/* Time Budget Timeline */}
            <TimeBudgetTimeline />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Focus Timer */}
                <div className="lg:col-span-1">
                    <FocusTimer />
                </div>

                {/* Projects List */}
                <div className="lg:col-span-2">
                    <ProjectsList />
                </div>

                {/* Inbox - Full Width on Next Row */}
                <div className="lg:col-span-3">
                    <InboxList onRefresh={refreshTrigger} />
                </div>
            </div>
        </div>
    );
}
