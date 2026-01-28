export interface User {
    id: string;
    firebase_uid: string;
    email: string;
    display_name: string | null;
    photo_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    color: string;
    status: 'active' | 'archived' | 'completed';
    health_score: number;
    created_at: string;
    updated_at: string;
}

export interface Task {
    id: string;
    user_id: string;
    project_id: string | null;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'done' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Session {
    id: string;
    user_id: string;
    project_id: string | null;
    session_type: 'pomodoro' | 'deep_work' | 'custom';
    duration_minutes: number;
    started_at: string;
    ended_at: string | null;
    notes: string | null;
    created_at: string;
}

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    frequency: 'daily' | 'weekly' | 'custom';
    streak_count: number;
    last_completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Goal {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    goal_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
    target_value: number | null;
    current_value: number;
    unit: string | null;
    deadline: string | null;
    completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface ReadingItem {
    id: string;
    user_id: string;
    title: string;
    author: string | null;
    item_type: 'book' | 'article' | 'paper' | 'course';
    status: 'to_read' | 'reading' | 'completed';
    progress_pages: number;
    total_pages: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Capture {
    id: string;
    user_id: string;
    content: string;
    capture_type: 'task' | 'project' | 'note' | 'reading' | null;
    processed: boolean;
    created_at: string;
}

export interface TimeAllocation {
    id: string;
    user_id: string;
    project_id: string | null;
    label: string | null;
    duration_minutes: number;
    start_time: string | null;  // "09:00"
    end_time: string | null;    // "12:00"
    category: TimeCategory | null;
    allocation_date: string;
    created_at: string;
}

export type TimeCategory =
    | 'work'
    | 'deep_work'
    | 'health'
    | 'personal'
    | 'learning'
    | 'admin'
    | 'sleep'
    | 'meals'
    | 'commute'
    | 'other';

export interface TimeTemplate {
    id: string;
    user_id: string;
    name: string;
    blocks: TimeTemplateBlock[];
    created_at: string;
}

export interface TimeTemplateBlock {
    label: string;
    category: TimeCategory;
    start_time: string;
    end_time: string;
    project_id?: string;
}

export interface UserPreferences {
    id: string;
    user_id: string;
    day_start_time: string;  // "06:00"
    day_end_time: string;    // "23:00"
    created_at: string;
    updated_at: string;
}
