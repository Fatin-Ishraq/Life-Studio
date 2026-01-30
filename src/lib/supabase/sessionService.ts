import { supabase } from './client';
import type { Session } from '@/types/database';

/**
 * Log a completed focus session to the database
 */
export async function createSession(
    userId: string,
    sessionType: 'pomodoro' | 'deep_work' | 'custom',
    durationMinutes: number,
    startedAt: string,
    projectId?: string | null,
    notes?: string | null,
    flow_state?: number | null,
    distraction_level?: number | null
): Promise<Session> {
    const { data, error } = await supabase
        .from('sessions')
        .insert({
            user_id: userId,
            project_id: projectId || null,
            session_type: sessionType,
            duration_minutes: durationMinutes,
            started_at: startedAt,
            ended_at: new Date().toISOString(),
            notes: notes || null,
            flow_state: flow_state || null,
            distraction_level: distraction_level || null
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating focus session:', error.message || error);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        throw error;
    }

    return data;
}

/**
 * Get recent focus sessions for a user
 */
export async function getRecentSessions(userId: string, limit = 10): Promise<Session[]> {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent sessions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get focus sessions for a specific project
 */
export async function getProjectSessions(projectId: string, limit = 20): Promise<Session[]> {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('project_id', projectId)
        .order('started_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching project sessions:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get aggregated focus stats for a project
 */
export async function getProjectFocusStats(projectId: string): Promise<{
    totalSessions: number;
    totalMinutes: number;
    avgFlowState: number | null;
    avgDistraction: number | null;
}> {
    const { data, error } = await supabase
        .from('sessions')
        .select('duration_minutes, flow_state, distraction_level')
        .eq('project_id', projectId);

    if (error) {
        console.error('Error fetching project focus stats:', error);
        throw error;
    }

    const sessions = data || [];
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    const flowStates = sessions.filter(s => s.flow_state !== null).map(s => s.flow_state!);
    const avgFlowState = flowStates.length > 0 ? flowStates.reduce((a, b) => a + b, 0) / flowStates.length : null;

    const distractions = sessions.filter(s => s.distraction_level !== null).map(s => s.distraction_level!);
    const avgDistraction = distractions.length > 0 ? distractions.reduce((a, b) => a + b, 0) / distractions.length : null;

    return { totalSessions, totalMinutes, avgFlowState, avgDistraction };
}

/**
 * Get today's focus statistics for the user
 */
export async function getTodayFocusStats(userId: string): Promise<{
    sessionsToday: number;
    minutesToday: number;
    streak: number;
}> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Get today's sessions
    const { data: todaySessions, error } = await supabase
        .from('sessions')
        .select('duration_minutes, started_at')
        .eq('user_id', userId)
        .gte('started_at', todayISO);

    if (error) {
        console.error('Error fetching today focus stats:', error);
        throw error;
    }

    const sessions = todaySessions || [];
    const sessionsToday = sessions.length;
    const minutesToday = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    // Calculate streak (consecutive days with sessions)
    let streak = sessionsToday > 0 ? 1 : 0;
    const checkDate = new Date(today);

    for (let i = 0; i < 365; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const dayStart = new Date(checkDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(checkDate);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: daySessions } = await supabase
            .from('sessions')
            .select('id')
            .eq('user_id', userId)
            .gte('started_at', dayStart.toISOString())
            .lte('started_at', dayEnd.toISOString())
            .limit(1);

        if (daySessions && daySessions.length > 0) {
            streak++;
        } else {
            break;
        }
    }

    return { sessionsToday, minutesToday, streak };
}

/**
 * Get recent sessions with project info
 */
export async function getRecentSessionsWithProjects(userId: string, limit = 7): Promise<Array<{
    id: string;
    session_type: string;
    duration_minutes: number;
    started_at: string;
    project_name: string | null;
    project_color: string | null;
}>> {
    const { data, error } = await supabase
        .from('sessions')
        .select(`
            id,
            session_type,
            duration_minutes,
            started_at,
            projects (name, color)
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent sessions:', error);
        throw error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((s: any) => {
        const project = Array.isArray(s.projects) ? s.projects[0] : s.projects;
        return {
            id: s.id,
            session_type: s.session_type,
            duration_minutes: s.duration_minutes,
            started_at: s.started_at,
            project_name: project?.name || null,
            project_color: project?.color || null
        };
    });
}
