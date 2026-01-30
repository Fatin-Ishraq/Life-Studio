import { supabase } from './client';

export interface ProductivityMetrics {
    totalFocusMinutes: number;
    sessionCount: number;
    avgEnergy: number;
    avgMood: number;
    tasksCompleted: number;
    productivityScore: number;
}

/**
 * Calculate basic productivity metrics for a user over the last X days
 */
export async function getProductivityOverview(userId: string, days = 7): Promise<ProductivityMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateISO = startDate.toISOString();

    // Fetch data in parallel
    const [sessions, vitality, tasks] = await Promise.all([
        supabase.from('sessions').select('*').eq('user_id', userId).gte('started_at', startDateISO),
        supabase.from('vitality').select('*').eq('user_id', userId).gte('logged_at', startDateISO),
        supabase.from('tasks').select('*').eq('user_id', userId).eq('status', 'done').gte('completed_at', startDateISO)
    ]);

    const sessionData = sessions.data || [];
    const vitalityData = vitality.data || [];
    const taskData = tasks.data || [];

    const totalFocusMinutes = sessionData.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    const avgEnergy = vitalityData.length > 0
        ? vitalityData.reduce((acc, v) => acc + v.energy_level, 0) / vitalityData.length
        : 0;
    const avgMood = vitalityData.length > 0
        ? vitalityData.reduce((acc, v) => acc + v.mood_score, 0) / vitalityData.length
        : 0;

    // A simple productivity score formula: (Focus Minutes / 60) * 10 + (Tasks * 5) + (Avg Energy * 2)
    const productivityScore = Math.round((totalFocusMinutes / 60) * 10 + (taskData.length * 5) + (avgEnergy * 2));

    return {
        totalFocusMinutes,
        sessionCount: sessionData.length,
        avgEnergy,
        avgMood,
        tasksCompleted: taskData.length,
        productivityScore
    };
}

/**
 * Get distribution of focus units relative to vitals
 */
export async function getSleepFocusCorrelation(userId: string) {
    const { data: vitality } = await supabase
        .from('vitality')
        .select('logged_at, sleep_quality')
        .eq('user_id', userId)
        .order('logged_at', { ascending: true });

    const { data: sessions } = await supabase
        .from('sessions')
        .select('started_at, duration_minutes')
        .eq('user_id', userId)
        .order('started_at', { ascending: true });

    return { vitality, sessions };
}

/**
 * Get focus time per day for the last 7 days
 */
export async function getDailyFocusTrends(userId: string, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: sessions } = await supabase
        .from('sessions')
        .select('started_at, duration_minutes')
        .eq('user_id', userId)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: true });

    const trends: Record<string, number> = {};

    // Initialize last 7 days with 0
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        trends[d.toISOString().split('T')[0]] = 0;
    }

    sessions?.forEach(s => {
        const date = s.started_at.split('T')[0];
        if (trends[date] !== undefined) {
            trends[date] += s.duration_minutes;
        }
    });

    return Object.entries(trends)
        .map(([date, minutes]) => ({ date, minutes }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get distribution of focus time across projects
 */
export async function getCategoryDistribution(userId: string) {
    const { data: sessions } = await supabase
        .from('sessions')
        .select(`
            duration_minutes,
            projects (name, color)
        `)
        .eq('user_id', userId);

    const distribution: Record<string, { minutes: number, color: string }> = {};

    sessions?.forEach((s: { duration_minutes: number, projects: any }) => {
        const project = Array.isArray(s.projects) ? s.projects[0] : s.projects;
        const projectName = project?.name || 'Uncategorized';
        const color = project?.color || '#cbd5e1';

        if (!distribution[projectName]) {
            distribution[projectName] = { minutes: 0, color };
        }
        distribution[projectName].minutes += s.duration_minutes;
    });

    return Object.entries(distribution).map(([name, data]) => ({
        name,
        ...data
    }));
}

/**
 * Compare planned work time from Day Planner vs actual Focus sessions
 */
export async function getPlannedVsActualFocus(userId: string, date: Date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];

    const { data: planned } = await supabase
        .from('time_allocations')
        .select('duration_minutes, category')
        .eq('user_id', userId)
        .eq('allocation_date', dateStr)
        .in('category', ['work', 'deep_work']);

    const { data: actual } = await supabase
        .from('sessions')
        .select('duration_minutes')
        .eq('user_id', userId)
        .gte('started_at', `${dateStr}T00:00:00Z`)
        .lte('started_at', `${dateStr}T23:59:59Z`);

    const plannedMins = (planned || []).reduce((acc, p) => acc + (p.duration_minutes || 0), 0);
    const actualMins = (actual || []).reduce((acc, a) => acc + (a.duration_minutes || 0), 0);

    return { plannedMins, actualMins };
}

/**
 * Correlation: Sleep Quality vs Energy trends
 */
export async function getVitalityTrends(userId: string, limit = 14) {
    const { data: vitality } = await supabase
        .from('vitality')
        .select('logged_at, sleep_quality, energy_level, mood_score')
        .eq('user_id', userId)
        .order('logged_at', { ascending: true })
        .limit(limit);

    return (vitality || []).map(v => ({
        date: v.logged_at.split('T')[0],
        sleep: v.sleep_quality,
        energy: v.energy_level,
        mood: v.mood_score
    }));
}

/**
 * Get quality of work (Flow vs Distraction) for the last 14 days
 */
export async function getWorkDynamics(userId: string, limit = 14) {
    const { data: sessions } = await supabase
        .from('sessions')
        .select('started_at, flow_state, distraction_level')
        .eq('user_id', userId)
        .not('flow_state', 'is', null)
        .order('started_at', { ascending: false })
        .limit(limit);

    return (sessions || []).map(s => ({
        date: s.started_at.split('T')[0],
        flow: s.flow_state,
        distraction: s.distraction_level
    })).reverse();
}

