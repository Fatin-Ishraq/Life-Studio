import { supabase } from './client';
import type { Goal } from '@/types/database';

export async function createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'current_value' | 'completed'>): Promise<Goal> {
    const { data, error } = await supabase
        .from('goals')
        .insert({ ...goal, current_value: 0, completed: false })
        .select()
        .single();

    if (error) {
        console.error('Error creating goal:', error.message);
        throw error;
    }

    return data;
}

export async function updateGoalProgress(goalId: string, newValue: number): Promise<void> {
    const { data: goal } = await supabase.from('goals').select('target_value').eq('id', goalId).single();

    const completed = goal?.target_value ? newValue >= goal.target_value : false;

    const { error } = await supabase
        .from('goals')
        .update({
            current_value: newValue,
            completed,
            updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

    if (error) {
        console.error('Error updating goal progress:', error.message);
        throw error;
    }
}

export async function getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching goals:', error.message);
        throw error;
    }

    return data || [];
}
