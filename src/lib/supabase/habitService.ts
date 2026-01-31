import { supabase } from './client';
import type { Habit } from '@/types/database';

export interface HabitCompletion {
    id: string;
    habit_id: string;
    user_id: string;
    completed_at: string;
    notes: string | null;
    created_at: string;
}

export interface HabitWithStatus extends Habit {
    completedToday: boolean;
    weeklyCompletions: boolean[]; // Last 7 days, index 0 = today
}

export async function createHabit(
    habit: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'streak_count' | 'last_completed_at'>
): Promise<Habit> {
    const { data, error } = await supabase
        .from('habits')
        .insert({ ...habit, streak_count: 0 })
        .select()
        .single();

    if (error) {
        console.error('Error creating habit:', error.message);
        throw error;
    }

    return data;
}

export async function getHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching habits:', error.message);
        throw error;
    }

    return data || [];
}

export async function updateHabit(
    habitId: string,
    updates: Partial<Pick<Habit, 'name' | 'description' | 'frequency'>>
): Promise<Habit> {
    const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', habitId)
        .select()
        .single();

    if (error) {
        console.error('Error updating habit:', error.message);
        throw error;
    }

    return data;
}

export async function deleteHabit(habitId: string): Promise<void> {
    const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

    if (error) {
        console.error('Error deleting habit:', error.message);
        throw error;
    }
}

/**
 * Complete a habit for today using the database function.
 * This atomically updates the streak and logs the completion.
 */
export async function completeHabit(
    habitId: string,
    userId: string,
    notes?: string
): Promise<{ newStreak: number; completionId: string }> {
    const { data, error } = await supabase.rpc('complete_habit', {
        p_habit_id: habitId,
        p_user_id: userId,
        p_notes: notes || null
    });

    if (error) {
        console.error('Error completing habit:', error.message);
        // Fallback: simple update if RPC doesn't exist yet
        const { data: habit } = await supabase
            .from('habits')
            .select('streak_count, last_completed_at')
            .eq('id', habitId)
            .single();

        const today = new Date().toISOString().split('T')[0];
        const lastCompleted = habit?.last_completed_at?.split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newStreak = 1;
        if (lastCompleted === yesterday) {
            newStreak = (habit?.streak_count || 0) + 1;
        } else if (lastCompleted === today) {
            newStreak = habit?.streak_count || 1;
        }

        await supabase
            .from('habits')
            .update({
                streak_count: newStreak,
                last_completed_at: new Date().toISOString()
            })
            .eq('id', habitId);

        return { newStreak, completionId: '' };
    }

    return {
        newStreak: data?.[0]?.new_streak || 1,
        completionId: data?.[0]?.completion_id || ''
    };
}

/**
 * Get completion history for a habit over the last N days.
 * Returns an array of booleans, where index 0 = today, index 1 = yesterday, etc.
 */
export async function getHabitCompletionHistory(
    habitId: string,
    days: number = 7
): Promise<boolean[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_at')
        .eq('habit_id', habitId)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

    if (error) {
        console.error('Error fetching completion history:', error.message);
        return new Array(days).fill(false);
    }

    // Create a set of completed dates (YYYY-MM-DD format)
    const completedDates = new Set(
        (data || []).map(c => c.completed_at.split('T')[0])
    );

    // Build array from today backwards
    const result: boolean[] = [];
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push(completedDates.has(dateStr));
    }

    return result;
}

/**
 * Get habits with their completion status for today and weekly history.
 */
export async function getHabitsWithStatus(userId: string): Promise<HabitWithStatus[]> {
    const habits = await getHabits(userId);

    const habitsWithStatus = await Promise.all(
        habits.map(async (habit) => {
            const weeklyCompletions = await getHabitCompletionHistory(habit.id, 7);
            const completedToday = weeklyCompletions[0] || false;

            return {
                ...habit,
                completedToday,
                weeklyCompletions
            };
        })
    );

    return habitsWithStatus;
}

/**
 * Get aggregate stats for all habits.
 */
export async function getHabitStats(userId: string): Promise<{
    totalHabits: number;
    totalStreak: number;
    longestStreak: number;
    completedToday: number;
}> {
    const habits = await getHabits(userId);

    const today = new Date().toISOString().split('T')[0];
    let completedToday = 0;

    habits.forEach(habit => {
        if (habit.last_completed_at?.split('T')[0] === today) {
            completedToday++;
        }
    });

    return {
        totalHabits: habits.length,
        totalStreak: habits.reduce((sum, h) => sum + h.streak_count, 0),
        longestStreak: Math.max(0, ...habits.map(h => h.streak_count)),
        completedToday
    };
}
