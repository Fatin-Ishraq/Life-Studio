import { supabase } from './client';
import type { TimeAllocation, TimeCategory, UserPreferences, TimeTemplate } from '@/types/database';

// Category configuration with colors and icons
export const CATEGORY_CONFIG: Record<TimeCategory, { color: string; label: string; icon: string }> = {
    work: { color: '#3b82f6', label: 'Work', icon: 'Briefcase' },
    deep_work: { color: '#6366f1', label: 'Deep Work', icon: 'Zap' },
    health: { color: '#22c55e', label: 'Health', icon: 'Heart' },
    personal: { color: '#f59e0b', label: 'Personal', icon: 'User' },
    learning: { color: '#8b5cf6', label: 'Learning', icon: 'BookOpen' },
    admin: { color: '#64748b', label: 'Admin', icon: 'Settings' },
    sleep: { color: '#1e293b', label: 'Sleep', icon: 'Moon' },
    meals: { color: '#f97316', label: 'Meals', icon: 'Utensils' },
    commute: { color: '#06b6d4', label: 'Commute', icon: 'Car' },
    other: { color: '#94a3b8', label: 'Other', icon: 'Circle' },
};

// Helper: Convert "HH:MM" to minutes from midnight
export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper: Convert minutes from midnight to "HH:MM"
export function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper: Calculate duration between two times
export function calculateDuration(start: string, end: string): number {
    return timeToMinutes(end) - timeToMinutes(start);
}

/**
 * Get user preferences (day bounds)
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user preferences:', error);
    }

    return data;
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(
    userId: string,
    dayStartTime: string,
    dayEndTime: string
): Promise<UserPreferences> {
    const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: userId,
            day_start_time: dayStartTime,
            day_end_time: dayEndTime,
        }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) {
        console.error('Error saving user preferences:', error);
        throw error;
    }

    return data;
}

/**
 * Get time allocations for a specific date
 */
export async function getTimeBudgets(
    userId: string,
    date: Date = new Date()
): Promise<TimeAllocation[]> {
    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('time_allocations')
        .select('*')
        .eq('user_id', userId)
        .eq('allocation_date', dateStr)
        .order('start_time', { ascending: true, nullsFirst: false });

    if (error) {
        console.error('Error fetching time budgets:', error);
        throw error;
    }

    return data || [];
}

/**
 * Save a time allocation with start/end times
 */
export async function saveTimeBudget(
    userId: string,
    data: {
        projectId?: string | null;
        label?: string | null;
        category: TimeCategory;
        startTime: string;
        endTime: string;
        date?: Date;
    }
): Promise<TimeAllocation> {
    const dateStr = (data.date || new Date()).toISOString().split('T')[0];
    const durationMinutes = calculateDuration(data.startTime, data.endTime);

    const { data: result, error } = await supabase
        .from('time_allocations')
        .insert({
            user_id: userId,
            project_id: data.projectId || null,
            label: data.label || null,
            category: data.category,
            start_time: data.startTime,
            end_time: data.endTime,
            duration_minutes: durationMinutes,
            allocation_date: dateStr,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving time budget:', error);
        throw error;
    }

    return result;
}

/**
 * Update an existing time allocation
 */
export async function updateTimeBudget(
    allocationId: string,
    data: {
        projectId?: string | null;
        label?: string | null;
        category?: TimeCategory;
        startTime?: string;
        endTime?: string;
    }
): Promise<TimeAllocation> {
    const updates: Record<string, unknown> = {};

    if (data.projectId !== undefined) updates.project_id = data.projectId;
    if (data.label !== undefined) updates.label = data.label;
    if (data.category) updates.category = data.category;
    if (data.startTime) updates.start_time = data.startTime;
    if (data.endTime) updates.end_time = data.endTime;

    // Recalculate duration if times changed
    if (data.startTime && data.endTime) {
        updates.duration_minutes = calculateDuration(data.startTime, data.endTime);
    }

    const { data: result, error } = await supabase
        .from('time_allocations')
        .update(updates)
        .eq('id', allocationId)
        .select()
        .single();

    if (error) {
        console.error('Error updating time budget:', error);
        throw error;
    }

    return result;
}

/**
 * Delete a time allocation
 */
export async function deleteTimeBudget(allocationId: string): Promise<void> {
    const { error } = await supabase
        .from('time_allocations')
        .delete()
        .eq('id', allocationId);

    if (error) {
        console.error('Error deleting time budget:', error);
        throw error;
    }
}

/**
 * Get daily summary: hours per category
 */
export async function getDailySummary(
    userId: string,
    date: Date = new Date()
): Promise<{ category: TimeCategory; minutes: number }[]> {
    const allocations = await getTimeBudgets(userId, date);

    const summary: Record<TimeCategory, number> = {} as Record<TimeCategory, number>;

    for (const alloc of allocations) {
        const cat = alloc.category || 'other';
        summary[cat] = (summary[cat] || 0) + alloc.duration_minutes;
    }

    return Object.entries(summary).map(([category, minutes]) => ({
        category: category as TimeCategory,
        minutes,
    }));
}

/**
 * Check for overlapping time blocks
 */
export function checkOverlap(
    blocks: TimeAllocation[],
    newStart: string,
    newEnd: string,
    excludeId?: string
): boolean {
    const newStartMins = timeToMinutes(newStart);
    const newEndMins = timeToMinutes(newEnd);

    for (const block of blocks) {
        if (excludeId && block.id === excludeId) continue;
        if (!block.start_time || !block.end_time) continue;

        const blockStart = timeToMinutes(block.start_time);
        const blockEnd = timeToMinutes(block.end_time);

        // Check overlap
        if (newStartMins < blockEnd && newEndMins > blockStart) {
            return true;
        }
    }

    return false;
}

// ============ Templates ============

/**
 * Save current day as template
 */
export async function saveAsTemplate(
    userId: string,
    name: string,
    date: Date = new Date()
): Promise<TimeTemplate> {
    const allocations = await getTimeBudgets(userId, date);

    const blocks = allocations.map(a => ({
        label: a.label || '',
        category: a.category || 'other',
        start_time: a.start_time || '09:00',
        end_time: a.end_time || '10:00',
        project_id: a.project_id || undefined,
    }));

    const { data, error } = await supabase
        .from('time_templates')
        .insert({
            user_id: userId,
            name,
            blocks,
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving template:', error);
        throw error;
    }

    return data;
}

/**
 * Get all templates for user
 */
export async function getTemplates(userId: string): Promise<TimeTemplate[]> {
    const { data, error } = await supabase
        .from('time_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }

    return data || [];
}

/**
 * Load template to a date
 */
export async function loadTemplate(
    userId: string,
    templateId: string,
    date: Date = new Date()
): Promise<void> {
    // Get template
    const { data: template, error: fetchError } = await supabase
        .from('time_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (fetchError || !template) {
        throw new Error('Template not found');
    }

    const dateStr = date.toISOString().split('T')[0];

    // Delete existing allocations for the date
    await supabase
        .from('time_allocations')
        .delete()
        .eq('user_id', userId)
        .eq('allocation_date', dateStr);

    // Create new allocations from template
    const blocks = template.blocks as Array<{
        label: string;
        category: TimeCategory;
        start_time: string;
        end_time: string;
        project_id?: string;
    }>;

    for (const block of blocks) {
        await saveTimeBudget(userId, {
            label: block.label,
            category: block.category,
            startTime: block.start_time,
            endTime: block.end_time,
            projectId: block.project_id,
        });
    }
}
