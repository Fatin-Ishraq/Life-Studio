import { supabase } from './client';
import type { Task } from '@/types/database';
import { updateProjectHealth } from './projectService';

/**
 * Get all tasks for a specific project
 */
export async function getTasksForProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get a single task by ID
 */
export async function getTaskById(taskId: string): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (error) {
        console.error('Error fetching task:', error);
        throw error;
    }

    return data;
}

/**
 * Create a new task
 */
export async function createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

    if (error) {
        console.error('Error creating task:', error.message, error.details, error.hint);
        throw error;
    }

    // Update project health if linked to a project
    if (data.project_id) {
        await updateProjectHealth(data.project_id);
    }

    return data;
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        console.error('Error updating task:', error);
        throw error;
    }

    // Update project health if linked to a project
    if (data.project_id) {
        await updateProjectHealth(data.project_id);
    }

    return data;
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
    // Get task data first to know the project_id for health update
    const task = await getTaskById(taskId);

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error deleting task:', error);
        throw error;
    }

    // Update project health if linked to a project
    if (task.project_id) {
        await updateProjectHealth(task.project_id);
    }
}
