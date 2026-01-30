import { supabase } from './client';
import type { Habit } from '@/types/database';

export async function createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'streak_count' | 'last_completed_at'>): Promise<Habit> {
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

export async function logHabitCompletion(habitId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_habit_streak', { habit_id: habitId });
    // Note: This RPC might not exist yet, so we'll do a simple update for now
    if (error) {
        const { data: habit } = await supabase.from('habits').select('streak_count').eq('id', habitId).single();
        await supabase.from('habits').update({
            streak_count: (habit?.streak_count || 0) + 1,
            last_completed_at: new Date().toISOString()
        }).eq('id', habitId);
    }
}

export async function getHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching habits:', error.message);
        throw error;
    }

    return data || [];
}
