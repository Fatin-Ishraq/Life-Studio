import { supabase } from './client';
import type { Project } from '@/types/database';

export interface ProjectStats {
    total: number;
    done: number;
    in_progress: number;
    blocked: number;
}

export interface ProjectWithStats extends Project {
    stats: ProjectStats;
}

/**
 * Get all active projects for the current user
 */
export async function getActiveProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get task statistics for a specific project
 */
export async function getProjectStats(projectId: string): Promise<ProjectStats> {
    const { data, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', projectId);

    if (error) {
        console.error('Error fetching project stats:', error);
        throw error;
    }

    const stats: ProjectStats = {
        total: data?.length || 0,
        done: data?.filter(t => t.status === 'done').length || 0,
        in_progress: data?.filter(t => t.status === 'in_progress').length || 0,
        blocked: data?.filter(t => t.status === 'blocked').length || 0,
    };

    return stats;
}

/**
 * Get projects with their task statistics
 */
export async function getProjectsWithStats(userId: string): Promise<ProjectWithStats[]> {
    const projects = await getActiveProjects(userId);

    const projectsWithStats = await Promise.all(
        projects.map(async (project) => {
            const stats = await getProjectStats(project.id);
            return { ...project, stats };
        })
    );

    return projectsWithStats;
}

/**
 * Calculate project health score based on task completion and activity
 * Score is 0-100, with higher being better
 */
export function calculateHealthScore(
    stats: ProjectStats,
    lastUpdated: string
): number {
    let score = 50; // Base score

    // Task completion rate (50% weight)
    if (stats.total > 0) {
        const completionRate = stats.done / stats.total;
        score += completionRate * 50;
    }

    // Recent activity bonus (30% weight)
    const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUpdate === 0) {
        score += 30;
    } else if (daysSinceUpdate <= 3) {
        score += 20;
    } else if (daysSinceUpdate <= 7) {
        score += 10;
    }

    // Blocked tasks penalty (20% weight)
    if (stats.total > 0) {
        const blockedRate = stats.blocked / stats.total;
        score -= blockedRate * 20;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Update the health score for a project
 */
export async function updateProjectHealth(projectId: string): Promise<void> {
    const stats = await getProjectStats(projectId);

    const { data: project } = await supabase
        .from('projects')
        .select('updated_at')
        .eq('id', projectId)
        .single();

    if (!project) return;

    const healthScore = calculateHealthScore(stats, project.updated_at);

    const { error } = await supabase
        .from('projects')
        .update({ health_score: healthScore })
        .eq('id', projectId);

    if (error) {
        console.error('Error updating project health:', error);
        throw error;
    }
}

/**
 * Create a new project
 */
export async function createProject(
    userId: string,
    name: string,
    description: string | null,
    color: string
): Promise<Project> {
    const { data, error } = await supabase
        .from('projects')
        .insert({
            user_id: userId,
            name,
            description,
            color,
            status: 'active',
            health_score: 50, // Default starting score
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating project:', error);
        throw error;
    }

    return data;
}

/**
 * Update an existing project
 */
export async function updateProject(
    projectId: string,
    updates: Partial<Pick<Project, 'name' | 'description' | 'color' | 'status'>>
): Promise<Project> {
    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

    if (error) {
        console.error('Error updating project:', error);
        throw error;
    }

    return data;
}

/**
 * Archive a project (soft delete)
 */
export async function archiveProject(projectId: string): Promise<void> {
    const { error } = await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', projectId);

    if (error) {
        console.error('Error archiving project:', error);
        throw error;
    }
}
